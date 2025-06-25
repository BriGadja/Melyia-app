// Services API pour l'administration
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types TypeScript pour les données admin - CORRIGÉS v26.1
export interface AdminStats {
  total_users: number;
  total_dentists: number; // ✅ AJOUTÉ
  total_patients: number; // ✅ AJOUTÉ
  total_admins: number; // ✅ AJOUTÉ
  total_documents: number;
  total_conversations: number;
  active_users: number;
  disk_usage_mb: number; // ✅ AJOUTÉ
  recent_activity: RecentActivity[];
  last_updated: string;
}

export interface RecentActivity {
  date: string;
  conversations: number;
}

// ✅ CORRECTION MAJEURE : Interface alignée avec backend
export interface AdminUser {
  id: number;
  email: string;
  role: "admin" | "dentist" | "patient";
  firstName: string; // ✅ CAMELCASE comme backend
  lastName: string; // ✅ CAMELCASE comme backend
  createdAt: string; // ✅ CAMELCASE comme backend
  isActive: boolean; // ✅ AJOUTÉ
  lastLogin: string | null; // ✅ AJOUTÉ
  displayName: string; // ✅ AJOUTÉ
}

// ✅ CORRECTION MAJEURE : Interface alignée avec backend
export interface AdminDocument {
  id: number;
  fileName: string; // ✅ CAMELCASE comme backend
  filePath: string; // ✅ CAMELCASE comme backend
  createdAt: string; // ✅ CORRIGÉ (était uploaded_at)
  uploadDate: string; // ✅ AJOUTÉ pour compatibilité dashboard
  title: string; // ✅ AJOUTÉ pour titre document
  documentType: string; // ✅ AJOUTÉ
  fileSize: number; // ✅ AJOUTÉ
  mimeType: string; // ✅ AJOUTÉ pour type MIME
  processingStatus: string; // ✅ AJOUTÉ pour statut traitement
  dentistEmail: string; // ✅ CAMELCASE comme backend
  dentistName: string; // ✅ AJOUTÉ pour affichage nom
  patientEmail: string; // ✅ CAMELCASE comme backend
  patientName: string; // ✅ AJOUTÉ
}

export interface AdminConversation {
  id: number;
  message: string;
  response: string;
  created_at: string;
  createdAt: string; // ✅ AJOUTÉ pour compatibilité frontend
  patient_email: string;
  patientName: string; // ✅ AJOUTÉ pour affichage
  dentist_email?: string;
  response_length: number;
  confidenceScore: number; // ✅ AJOUTÉ pour badge confiance
  responseTimeMs: number; // ✅ AJOUTÉ pour badge temps
  feedbackRating?: number; // ✅ AJOUTÉ pour évaluation
}

// ✅ NOUVEAU : Interface configuration LLM (CORRIGÉE - camelCase backend)
export interface LLMConfig {
  id: number;
  modelName: string; // ✅ camelCase comme backend
  systemPrompt: string; // ✅ camelCase comme backend
  systemPromptUrgence: string; // ✅ camelCase comme backend
  temperature: number;
  topP: number; // ✅ camelCase comme backend
  maxTokens: number; // ✅ camelCase comme backend
  numCtx: number; // ✅ camelCase comme backend
  keepAliveMinutes: number; // ✅ camelCase comme backend
  timeoutSeconds: number; // ✅ camelCase comme backend
  stopSequences: string[]; // ✅ camelCase comme backend
  createdAt: string; // ✅ camelCase comme backend
  updatedAt: string; // ✅ camelCase comme backend
}

// URL de base API - utilise le proxy en dev
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : "https://app-dev.melyia.com/api";

// Helper pour les appels API authentifiés
async function adminApiCall<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    throw new Error("Token d'authentification manquant");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur API: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Erreur API inconnue");
  }

  return data.data;
}

// Hook pour récupérer les statistiques admin
export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApiCall<AdminStats>("/admin/stats"),
    refetchInterval: 30000, // Refresh toutes les 30 secondes
    staleTime: 10000, // Données considérées comme fresh pendant 10s
  });
}

// Hook pour récupérer la liste des utilisateurs
export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => adminApiCall<AdminUser[]>("/admin/users"),
    staleTime: 60000, // Refresh moins fréquent
  });
}

// Hook pour récupérer les documents
export function useAdminDocuments() {
  return useQuery<AdminDocument[]>({
    queryKey: ["admin", "documents"],
    queryFn: () => adminApiCall<AdminDocument[]>("/admin/documents"),
    staleTime: 60000,
  });
}

// Hook pour récupérer les conversations
export function useAdminConversations() {
  return useQuery<AdminConversation[]>({
    queryKey: ["admin", "conversations"],
    queryFn: () => adminApiCall<AdminConversation[]>("/admin/conversations"),
    refetchInterval: 20000, // Refresh fréquent pour le monitoring
    staleTime: 10000,
  });
}

// Hook pour supprimer un utilisateur
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur lors de la suppression`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalider le cache pour recharger la liste
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

// ✅ NOUVEAU : Hook pour récupérer la configuration LLM
export function useLLMConfig() {
  return useQuery<LLMConfig>({
    queryKey: ["admin", "llm-config"],
    queryFn: () => adminApiCall<LLMConfig>("/admin/llm-config"),
    staleTime: 30000, // Config change moins souvent
  });
}

// ✅ NOUVEAU : Hook pour mettre à jour la configuration LLM
export function useUpdateLLMConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<LLMConfig>) => {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      const response = await fetch(`${API_BASE_URL}/admin/llm-config`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur lors de la mise à jour`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      return data.data;
    },
    onSuccess: () => {
      // Invalider le cache pour recharger la config
      queryClient.invalidateQueries({ queryKey: ["admin", "llm-config"] });
    },
  });
}
