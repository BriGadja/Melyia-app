import { ChatResponse } from "../types/chat";

// ✅ NOUVEAU : Interface pour le warm-up
export interface WarmupResponse {
  success: boolean;
  status: "ready" | "warming" | "error";
  warmupTime?: number;
  isInstant: boolean;
  message: string;
  userId?: number;
  timestamp?: string;
  error?: string;
}

// ✅ NOUVEAU : Interface pour le status
export interface ChatbotStatus {
  success: boolean;
  status: "warm" | "cold" | "error";
  isReady: boolean;
  message: string;
  timestamp: string;
}

export class ChatAPI {
  private static getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  private static getCurrentUser(): any | null {
    const userStr = localStorage.getItem("auth_user");
    return userStr ? JSON.parse(userStr) : null;
  }

  private static getApiUrl(endpoint: string): string {
    return import.meta.env.DEV
      ? `/api${endpoint}`
      : `https://app-dev.melyia.com/api${endpoint}`;
  }

  // ✅ NOUVEAU : Warm-up proactif du chatbot
  static async warmupChatbot(): Promise<WarmupResponse> {
    const token = this.getAuthToken();

    if (!token) {
      throw new Error("Token d'authentification manquant");
    }

    try {
      console.log("🔥 [WARMUP] Démarrage warm-up chatbot...");
      const startTime = Date.now();

      const response = await fetch(this.getApiUrl("/chat/warmup"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      const totalTime = Date.now() - startTime;

      console.log(`✅ [WARMUP] Terminé en ${totalTime}ms:`, data);

      if (!response.ok) {
        throw new Error(data.message || `Erreur warm-up ${response.status}`);
      }

      return {
        ...data,
        warmupTime: data.warmupTime || totalTime,
      };
    } catch (error: any) {
      console.error("❌ [WARMUP] Erreur:", error);
      return {
        success: false,
        status: "error",
        isInstant: false,
        message: error.message || "Erreur lors du warm-up",
        error: error.message,
      };
    }
  }

  // ✅ NOUVEAU : Vérification status temps réel
  static async getChatbotStatus(): Promise<ChatbotStatus> {
    const token = this.getAuthToken();

    if (!token) {
      throw new Error("Token d'authentification manquant");
    }

    try {
      const response = await fetch(this.getApiUrl("/chat/status"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erreur status ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error("❌ [STATUS] Erreur:", error);
      return {
        success: false,
        status: "error",
        isReady: false,
        message: error.message || "Impossible de vérifier l'état",
        timestamp: new Date().toISOString(),
      };
    }
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
      const response = await fetch(this.getApiUrl("/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          patientId: user.id.toString(), // Obligatoire pour l'API
        }),
        // ✅ NOUVEAU : Timeout étendu côté frontend
        signal: AbortSignal.timeout(60000), // 60s timeout côté frontend
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);

        // ✅ NOUVEAU : Gestion spéciale timeout avec suggestion de warm-up
        if (response.status === 504) {
          throw new Error(
            `${
              errorData.error || "Timeout chatbot"
            } - Le modèle IA se prépare encore. Réessayez dans 30 secondes.`
          );
        }

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
    } catch (error: any) {
      console.error("Erreur complète:", error);

      // ✅ NOUVEAU : Gestion spéciale pour AbortError (timeout fetch)
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        throw new Error(
          "Le chatbot prend plus de temps que prévu (>60s). Le modèle IA se charge probablement. Réessayez dans quelques instants."
        );
      }

      throw error;
    }
  }
}
