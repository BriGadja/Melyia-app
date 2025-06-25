import React, { createContext, useContext, useEffect, useState } from "react";

// Types pour l'authentification avec support admin
interface User {
  id: number;
  email: string;
  role: "dentist" | "patient" | "admin"; // ✅ Ajout du rôle admin
  firstName: string;
  lastName: string;
  practiceInfo?: string; // Pour les dentistes
  permissions?: AdminPermissions; // Pour les admins
}

// Types spécifiques aux admins
interface AdminPermissions {
  super_admin: boolean;
  manage_users: boolean;
  view_analytics: boolean;
  manage_documents: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  isAdmin: boolean; // ✅ Helper pour vérifier si l'utilisateur est admin
  hasPermission: (permission: keyof AdminPermissions) => boolean; // ✅ Vérification permissions
  // ✅ NOUVEAU : Gestion patientId pour chatbot RAG
  currentPatientId: number | null;
  setCurrentPatient: (patientId: number | null) => void;
  getEffectivePatientId: () => number | null;
}

// Création du Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// URL de base de l'API auth - utilise le proxy Vite en dev
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : "https://app-dev.melyia.com/api";

// Provider du Context d'authentification étendu
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true, // Loading au démarrage pour vérifier le token stocké
    isAuthenticated: false,
  });

  // ✅ NOUVEAU : State pour patientId sélectionné (RAG)
  const [currentPatientId, setCurrentPatientIdState] = useState<number | null>(
    null
  );

  // Fonction de connexion
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Stocker le token et les infos user
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_user", JSON.stringify(data.user));

        setAuthState({
          user: data.user,
          token: data.token,
          isLoading: false,
          isAuthenticated: true,
        });

        return { success: true };
      } else {
        return {
          success: false,
          error: data.message || "Identifiants invalides",
        };
      }
    } catch (error) {
      console.error("Erreur login:", error);
      return { success: false, error: "Erreur de connexion au serveur" };
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    // Supprimer le token et les infos user du localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");

    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  // Fonction d'inscription (à développer plus tard)
  const register = async (userData: any) => {
    // TODO: Implémenter l'inscription
    return { success: false, error: "Inscription non encore implémentée" };
  };

  // ✅ Helper pour vérifier si l'utilisateur est admin
  const isAdmin = authState.user?.role === "admin";

  // ✅ Fonction pour vérifier les permissions admin
  const hasPermission = (permission: keyof AdminPermissions): boolean => {
    if (!isAdmin || !authState.user?.permissions) return false;
    return authState.user.permissions[permission] === true;
  };

  // ✅ NOUVEAU : Fonction pour définir le patient courant
  const setCurrentPatient = (patientId: number | null) => {
    console.log("🎯 [AUTH] Changement patient courant:", patientId);
    setCurrentPatientIdState(patientId);
  };

  // ✅ NOUVEAU : Logique intelligente pour obtenir le patientId effectif
  const getEffectivePatientId = (): number | null => {
    if (!authState.user) return null;

    switch (authState.user.role) {
      case "patient":
        // ✅ Patient : toujours son propre ID
        return authState.user.id;

      case "dentist":
      case "admin":
        // ✅ Dentiste/Admin : patientId sélectionné ou null
        return currentPatientId;

      default:
        return null;
    }
  };

  // Vérification du token au chargement de l'app
  useEffect(() => {
    const checkAuthState = async () => {
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("auth_user");

      if (storedToken && storedUser) {
        try {
          // Vérifier si le token est encore valide
          const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${storedToken}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            // Token valide, restaurer la session
            setAuthState({
              user: JSON.parse(storedUser),
              token: storedToken,
              isLoading: false,
              isAuthenticated: true,
            });
          } else {
            // Token invalide, nettoyer le localStorage
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            setAuthState({
              user: null,
              token: null,
              isLoading: false,
              isAuthenticated: false,
            });
          }
        } catch (error) {
          console.error("Erreur vérification token:", error);
          // En cas d'erreur, déconnecter
          logout();
        }
      } else {
        // Pas de token stocké
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    checkAuthState();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    register,
    isAdmin, // ✅ Nouvelle propriété
    hasPermission, // ✅ Nouvelle méthode
    // ✅ NOUVEAU : Gestion patientId pour chatbot RAG
    currentPatientId,
    setCurrentPatient,
    getEffectivePatientId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
