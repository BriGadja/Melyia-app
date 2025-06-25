import { useState, useEffect } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { PatientSelector } from "./patient-selector";
import { useAuth } from "../../context/auth-context";
import {
  ChatAPI,
  WarmupResponse,
  ChatbotStatus,
} from "../../../shared/lib/chat-api";
import { ChatMessage as ChatMessageType } from "../../../shared/types/chat";

// ✅ NOUVEAU : Interface pour l'état du chatbot
interface ChatbotState {
  status: "initializing" | "warming" | "ready" | "error";
  isReady: boolean;
  message: string;
  warmupTime?: number;
  retry?: boolean; // ✅ NOUVEAU : Indique si un retry est possible
}

export function ChatInterface() {
  const { user, currentPatientId, setCurrentPatient, getEffectivePatientId } =
    useAuth();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // ✅ NOUVEAU : État du chatbot pour UX optimisée
  const [chatbotState, setChatbotState] = useState<ChatbotState>({
    status: "initializing",
    isReady: false,
    message: "Initialisation du chatbot...",
  });
  // ✅ NOUVEAU : État RAG pour indicateurs visuels
  const [ragStatus, setRagStatus] = useState<
    "idle" | "searching" | "found" | "fallback"
  >("idle");
  const [relevantDocs, setRelevantDocs] = useState<string[]>([]);

  useEffect(() => {
    // ✅ NOUVEAU : Démarrer le warm-up automatiquement si utilisateur connecté
    if (user) {
      console.log("Utilisateur connecté:", user);
      initializeChatbot();
    } else {
      console.error("Aucun utilisateur trouvé");
      setChatbotState({
        status: "error",
        isReady: false,
        message: "Erreur d'authentification",
      });
    }
  }, [user]);

  // ✅ NOUVEAU : Fonction d'initialisation intelligente du chatbot
  const initializeChatbot = async () => {
    try {
      console.log("🚀 [UI] Initialisation chatbot...");

      // 1. Vérifier le status actuel
      setChatbotState({
        status: "initializing",
        isReady: false,
        message: "Vérification du chatbot...",
      });

      const status = await ChatAPI.getChatbotStatus();

      if (status.isReady) {
        console.log("⚡ [UI] Chatbot déjà prêt !");
        setChatbotState({
          status: "ready",
          isReady: true,
          message: "Chatbot prêt - Réponses instantanées !",
        });
        return;
      }

      // 2. Si pas prêt, démarrer le warm-up
      console.log("🔥 [UI] Démarrage warm-up...");
      setChatbotState({
        status: "warming",
        isReady: false,
        message:
          "Préparation du chatbot IA... Cela peut prendre jusqu'à 30 secondes.",
      });

      const warmupResult = await ChatAPI.warmupChatbot();

      if (warmupResult.success && warmupResult.status === "ready") {
        setChatbotState({
          status: "ready",
          isReady: true,
          message: warmupResult.isInstant
            ? "Chatbot prêt instantanément !"
            : `Chatbot prêt en ${Math.round(
                (warmupResult.warmupTime || 0) / 1000
              )}s !`,
          warmupTime: warmupResult.warmupTime,
        });

        // ✅ Message de bienvenue automatique
        const welcomeMessage: ChatMessageType = {
          id: "welcome-" + Date.now(),
          content: `✅ Assistant IA prêt ! ${
            warmupResult.isInstant
              ? "Réponses instantanées."
              : `Initialisé en ${Math.round(
                  (warmupResult.warmupTime || 0) / 1000
                )}s.`
          }`,
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      } else if (warmupResult.status === "warming") {
        // ✅ NOUVEAU : Gestion du statut "warming"
        setChatbotState({
          status: "warming",
          isReady: false,
          message: warmupResult.message || "Initialisation en cours...",
          warmupTime: warmupResult.warmupTime,
          retry: true,
        });

        // ✅ NOUVEAU : Message informatif pour l'utilisateur
        const warmingMessage: ChatMessageType = {
          id: "warming-" + Date.now(),
          content: `🔄 ${
            warmupResult.message || "Le chatbot se prépare..."
          }\n\n💡 **Première connexion** : L'IA médicale prend quelques secondes à s'initialiser pour garantir la meilleure qualité de réponse.\n\n⏳ **Veuillez patienter** ou recharger la page dans 30 secondes.`,
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages([warmingMessage]);

        // ✅ NOUVEAU : Retry automatique après 30s
        setTimeout(() => {
          console.log("🔄 [UI] Retry automatique après warming...");
          checkChatbotReady();
        }, 30000);
      } else {
        setChatbotState({
          status: "error",
          isReady: false,
          message: warmupResult.message || "Erreur lors de l'initialisation",
          retry: true,
        });
      }
    } catch (error: any) {
      console.error("❌ [UI] Erreur init chatbot:", error);
      setChatbotState({
        status: "error",
        isReady: false,
        message: error.message || "Erreur de connexion au chatbot",
        retry: true,
      });
    }
  };

  // ✅ NOUVEAU : Fonction de vérification rapide (pour retry)
  const checkChatbotReady = async () => {
    try {
      const status = await ChatAPI.getChatbotStatus();

      if (status.isReady) {
        setChatbotState({
          status: "ready",
          isReady: true,
          message: "Chatbot prêt - Réponses rapides !",
        });

        const readyMessage: ChatMessageType = {
          id: "ready-" + Date.now(),
          content:
            "✅ Assistant IA maintenant prêt ! Vous pouvez poser vos questions.",
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, readyMessage]);
      }
    } catch (error) {
      console.log("⚠️ [UI] Retry check failed:", error);
    }
  };

  // ✅ NOUVEAU : Fonction de retry manuel
  const retryInitialization = () => {
    setMessages([]); // Effacer les anciens messages
    initializeChatbot();
  };

  const handleSendMessage = async (content: string) => {
    // ✅ NOUVEAU : Vérifications avancées avec patientId
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

    // ✅ NOUVEAU : Vérification patientId pour dentistes/admins
    const effectivePatientId = getEffectivePatientId();
    if (
      (user.role === "dentist" || user.role === "admin") &&
      !effectivePatientId
    ) {
      const errorMessage: ChatMessageType = {
        id: Date.now().toString(),
        content:
          "⚠️ Veuillez sélectionner un patient avant d'utiliser le chatbot médical.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // ✅ NOUVEAU : Vérifier que le chatbot est prêt
    if (!chatbotState.isReady) {
      const notReadyMessage: ChatMessageType = {
        id: Date.now().toString(),
        content: `⏳ ${chatbotState.message} Veuillez patienter ou recharger la page.`,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, notReadyMessage]);
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
      // ✅ NOUVEAU : Indicateurs RAG visuels
      setRagStatus("searching");
      setRelevantDocs([]);

      console.log(
        `🎯 [UI] Envoi message - User: ${user.id} (${user.role}) → Patient: ${effectivePatientId}`
      );
      const response = await ChatAPI.sendMessage(
        content,
        effectivePatientId || undefined
      );

      // ✅ NOUVEAU : Traitement réponse avec indicateurs RAG
      const hasDocuments = response.sources && response.sources.length > 0;
      setRagStatus(hasDocuments ? "found" : "fallback");
      setRelevantDocs(response.sources || []);

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

      // ✅ NOUVEAU : Gestion d'erreur avec suggestion de reinitialisation
      let errorContent = `❌ ${error.message || "Une erreur est survenue"}`;

      if (
        error.message?.includes("Timeout") ||
        error.message?.includes("504")
      ) {
        errorContent +=
          "\n\n💡 Le chatbot semble endormi. Recharger la page l'optimisera automatiquement.";
      }

      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // ✅ NOUVEAU : Reset état RAG après message
      setTimeout(() => setRagStatus("idle"), 3000);
    }
  };

  // Affichage conditionnel si pas d'utilisateur
  if (!user) {
    return (
      <div className="flex flex-col h-full border rounded-lg bg-white items-center justify-center">
        <p className="text-red-500">❌ Erreur d'authentification</p>
        <p className="text-sm text-gray-500">Veuillez vous reconnecter</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-lg bg-white shadow-sm overflow-hidden">
      {/* ✅ NOUVEAU : Sélecteur de patients */}
      <PatientSelector
        onPatientSelect={setCurrentPatient}
        selectedPatientId={currentPatientId}
      />

      {/* ✅ NOUVEAU : Indicateurs RAG */}
      {ragStatus !== "idle" && (
        <div
          className={`px-4 py-2 text-sm border-b ${
            ragStatus === "searching"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : ragStatus === "found"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-orange-50 text-orange-700 border-orange-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {ragStatus === "searching" && (
              <>
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>🔍 Recherche dans les documents médicaux...</span>
              </>
            )}
            {ragStatus === "found" && (
              <>
                <span>📄</span>
                <span>Documents utilisés : {relevantDocs.join(", ")}</span>
              </>
            )}
            {ragStatus === "fallback" && (
              <>
                <span>🤖</span>
                <span>Réponse générale - Aucun document spécifique trouvé</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ✅ NOUVEAU : Barre de status du chatbot */}
      <div
        className={`px-4 py-3 text-sm border-b ${
          chatbotState.status === "ready"
            ? "bg-green-50 text-green-700 border-green-200"
            : chatbotState.status === "warming"
            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
            : chatbotState.status === "error"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-blue-50 text-blue-700 border-blue-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center">
            {chatbotState.status === "ready" && "✅"}
            {chatbotState.status === "warming" && (
              <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            )}
            {chatbotState.status === "initializing" && "🔄"}
            {chatbotState.status === "error" && "❌"}
            <span className="ml-1">{chatbotState.message}</span>
          </span>
          <div className="flex items-center space-x-2">
            {chatbotState.warmupTime && (
              <span className="text-xs opacity-75">
                {Math.round(chatbotState.warmupTime / 1000)}s
              </span>
            )}
            {/* ✅ NOUVEAU : Bouton retry pour warming/error */}
            {(chatbotState.status === "warming" ||
              chatbotState.status === "error") &&
              chatbotState.retry && (
                <button
                  onClick={retryInitialization}
                  className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50 transition-colors"
                  title="Relancer l'initialisation"
                >
                  🔄 Retry
                </button>
              )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Assistant IA Médical
            </h3>
            <p className="text-sm">
              {chatbotState.isReady
                ? "Posez vos questions sur votre dossier médical"
                : "Préparation en cours..."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border">
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
        )}
      </div>
      {/* ✅ NOUVEAU : Input désactivé tant que le chatbot n'est pas prêt */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isLoading || !chatbotState.isReady}
        placeholder={
          chatbotState.isReady
            ? "Posez votre question..."
            : chatbotState.status === "warming"
            ? "Préparation du chatbot..."
            : "Chatbot non disponible"
        }
      />
    </div>
  );
}
