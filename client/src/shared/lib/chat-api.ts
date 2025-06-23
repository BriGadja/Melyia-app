import { ChatResponse } from "../types/chat";

export class ChatAPI {
  private static getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  private static getCurrentUser(): any | null {
    const userStr = localStorage.getItem("auth_user");
    return userStr ? JSON.parse(userStr) : null;
  }

  static async sendMessage(message: string): Promise<ChatResponse> {
    const token = this.getAuthToken();
    const user = this.getCurrentUser();

    if (!token) {
      throw new Error("Token d'authentification manquant");
    }

    if (!user || !user.id) {
      throw new Error("Utilisateur non trouvé");
    }

    console.log("Envoi message avec patientId:", user.id);

    try {
      const apiUrl = import.meta.env.DEV
        ? "/api/chat"
        : "https://app-dev.melyia.com/api/chat";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          patientId: user.id.toString(), // Obligatoire pour l'API
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      // L'API peut retourner différents formats, on s'adapte
      return {
        response: data.response || data.message || "Réponse reçue",
        confidence: data.confidence,
        sources: data.sources,
        conversationId: data.conversationId || "unknown",
      };
    } catch (error) {
      console.error("Erreur complète:", error);
      throw error;
    }
  }
}
