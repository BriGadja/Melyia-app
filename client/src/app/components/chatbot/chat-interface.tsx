import { useState, useEffect } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatAPI } from "../../../shared/lib/chat-api";
import { ChatMessage as ChatMessageType } from "../../../shared/types/chat";

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Vérifier que l'utilisateur est connecté et valide
    const userStr = localStorage.getItem("auth_user");
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      console.log("Utilisateur connecté:", userData);
    } else {
      console.error("Aucun utilisateur trouvé");
    }
  }, []);

  const handleSendMessage = async (content: string) => {
    // Vérification préalable
    if (!user || !user.id) {
      const errorMessage: ChatMessageType = {
        id: Date.now().toString(),
        content:
          "Erreur: Utilisateur non identifié. Veuillez vous reconnecter.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log("Envoi du message pour user:", user.id);
      const response = await ChatAPI.sendMessage(content);

      const assistantMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        role: "assistant",
        timestamp: new Date(),
        confidence: response.confidence,
        sources: response.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Erreur chat détaillée:", error);
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: `❌ ${error.message || "Une erreur est survenue"}`,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Affichage conditionnel si pas d'utilisateur
  if (!user) {
    return (
      <div className="flex flex-col h-96 border rounded-lg bg-white items-center justify-center">
        <p className="text-red-500">❌ Erreur d'authentification</p>
        <p className="text-sm text-gray-500">Veuillez vous reconnecter</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 border rounded-lg bg-white">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>🤖 Assistant IA Médical</p>
            <p className="text-sm mt-2">
              Posez vos questions sur votre dossier médical
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
