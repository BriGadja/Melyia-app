import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/auth-context";

// Composants du design system
import { Button } from "@shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card";
import { Badge } from "@shared/components/ui/badge";
import { LoadingSpinner } from "@shared/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@shared/components/ui/alert";
import * as Tabs from "@radix-ui/react-tabs";

// Types pour les données admin
interface AdminStats {
  total_dentists: number;
  total_patients: number;
  total_admins: number;
  total_documents: number;
  total_conversations: number;
  new_users_30d: number;
  recent_activity: Array<{
    date: string;
    conversations: number;
  }>;
  last_updated: string;
}

interface User {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  created_at: string;
  profile_info?: string;
}

interface Document {
  id: number;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  dentist_email: string;
  patient_email: string;
  metadata: any;
}

interface Conversation {
  id: number;
  message: string;
  response: string;
  created_at: string;
  patient_email: string;
  dentist_email?: string;
  response_length: number;
}

const AdminDashboard: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // États pour les données
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // États UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Configuration API - utilise le proxy Vite en dev
  const API_BASE_URL = import.meta.env.DEV
    ? "/api"
    : "https://app-dev.melyia.com/api";
  const token = localStorage.getItem("auth_token");

  // Fonction pour faire des requêtes API authentifiées
  const apiRequest = async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  // Chargement des données au montage du composant
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setIsLoading(true);
        setError("");

        // Charger les statistiques
        if (hasPermission("view_analytics")) {
          const statsData = await apiRequest("/admin/stats");
          setStats(statsData.data);
        }

        // Charger les utilisateurs
        if (hasPermission("manage_users")) {
          const usersData = await apiRequest("/admin/users");
          setUsers(usersData.data);
        }

        // Charger les documents
        if (hasPermission("manage_documents")) {
          const documentsData = await apiRequest("/admin/documents");
          setDocuments(documentsData.data);
        }

        // Charger les conversations récentes
        if (hasPermission("view_analytics")) {
          const conversationsData = await apiRequest("/admin/conversations");
          setConversations(conversationsData.data);
        }
      } catch (err) {
        console.error("Erreur chargement données admin:", err);
        setError("Erreur lors du chargement des données administrateur");
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, [hasPermission, token]);

  // Fonction pour supprimer un utilisateur
  const deleteUser = async (userId: number, userName: string) => {
    if (
      !confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userName} ?`)
    ) {
      return;
    }

    try {
      await apiRequest(`/admin/users/${userId}`);
      // Rafraîchir la liste des utilisateurs
      const usersData = await apiRequest("/admin/users");
      setUsers(usersData.data);
      alert("Utilisateur supprimé avec succès");
    } catch (err) {
      console.error("Erreur suppression utilisateur:", err);
      alert("Erreur lors de la suppression de l'utilisateur");
    }
  };

  // Formatage des dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Melyia - Administration
              </h1>
              <Badge
                variant="secondary"
                className="ml-3 bg-red-100 text-red-800"
              >
                Super Admin
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Message de bienvenue */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-medium text-red-900 mb-2">
              🔐 Tableau de Bord Administrateur
            </h2>
            <p className="text-red-800">
              Accès complet aux données et paramètres de l'application Melyia.
              Toutes les actions sont tracées et auditées.
            </p>
          </div>

          {/* Affichage d'erreur */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation par onglets */}
          <Tabs.Root
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <Tabs.List className="flex space-x-2 border-b mb-6">
              <Tabs.Trigger
                value="overview"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-red-600 hover:border-red-600 data-[state=active]:border-red-600 data-[state=active]:text-red-600"
              >
                📊 Vue d'ensemble
              </Tabs.Trigger>
              <Tabs.Trigger
                value="users"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-red-600 hover:border-red-600 data-[state=active]:border-red-600 data-[state=active]:text-red-600"
              >
                👥 Utilisateurs
              </Tabs.Trigger>
              <Tabs.Trigger
                value="documents"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-red-600 hover:border-red-600 data-[state=active]:border-red-600 data-[state=active]:text-red-600"
              >
                📄 Documents
              </Tabs.Trigger>
              <Tabs.Trigger
                value="conversations"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-red-600 hover:border-red-600 data-[state=active]:border-red-600 data-[state=active]:text-red-600"
              >
                💬 Conversations IA
              </Tabs.Trigger>
            </Tabs.List>

            {/* Onglet Vue d'ensemble */}
            <Tabs.Content value="overview" className="mt-6">
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Statistiques principales */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        👨‍⚕️ Dentistes
                      </CardTitle>
                      <CardDescription>Praticiens inscrits</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {stats.total_dentists}
                      </div>
                      <p className="text-sm text-gray-600">
                        Comptes dentistes actifs
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        👤 Patients
                      </CardTitle>
                      <CardDescription>Patients inscrits</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {stats.total_patients}
                      </div>
                      <p className="text-sm text-gray-600">
                        Comptes patients actifs
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        📄 Documents
                      </CardTitle>
                      <CardDescription>Fichiers stockés</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">
                        {stats.total_documents}
                      </div>
                      <p className="text-sm text-gray-600">
                        Documents médicaux
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        💬 Conversations IA
                      </CardTitle>
                      <CardDescription>Interactions chatbot</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">
                        {stats.total_conversations}
                      </div>
                      <p className="text-sm text-gray-600">Messages traités</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        📈 Nouveaux utilisateurs
                      </CardTitle>
                      <CardDescription>30 derniers jours</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-600">
                        {stats.new_users_30d}
                      </div>
                      <p className="text-sm text-gray-600">
                        Inscriptions récentes
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        🔐 Administrateurs
                      </CardTitle>
                      <CardDescription>Comptes admin</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">
                        {stats.total_admins}
                      </div>
                      <p className="text-sm text-gray-600">
                        Super-administrateurs
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Activité récente */}
              {stats?.recent_activity && stats.recent_activity.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>📊 Activité des 7 derniers jours</CardTitle>
                    <CardDescription>Conversations IA par jour</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.recent_activity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-600">
                            {formatDate(activity.date)}
                          </span>
                          <div className="flex items-center">
                            <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                              <div
                                className="bg-orange-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (activity.conversations /
                                      Math.max(
                                        ...stats.recent_activity.map(
                                          (a) => a.conversations
                                        )
                                      )) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {activity.conversations}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </Tabs.Content>

            {/* Onglet Utilisateurs */}
            <Tabs.Content value="users" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>👥 Gestion des Utilisateurs</CardTitle>
                  <CardDescription>
                    Liste complète des comptes inscrits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2">Email</th>
                          <th className="text-left py-3 px-2">Nom</th>
                          <th className="text-left py-3 px-2">Rôle</th>
                          <th className="text-left py-3 px-2">Inscription</th>
                          <th className="text-left py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-gray-100"
                          >
                            <td className="py-3 px-2">
                              <span className="font-medium">{user.email}</span>
                            </td>
                            <td className="py-3 px-2">
                              {user.first_name} {user.last_name}
                            </td>
                            <td className="py-3 px-2">
                              <Badge
                                variant={
                                  user.role === "admin"
                                    ? "destructive"
                                    : user.role === "dentist"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {user.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-gray-600">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="py-3 px-2">
                              {user.role !== "admin" &&
                                hasPermission("manage_users") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      deleteUser(
                                        user.id,
                                        `${user.first_name} ${user.last_name}`
                                      )
                                    }
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    Supprimer
                                  </Button>
                                )}
                              {user.role === "admin" && (
                                <span className="text-xs text-gray-500">
                                  Protégé
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </Tabs.Content>

            {/* Onglet Documents */}
            <Tabs.Content value="documents" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>📄 Documents Médicaux</CardTitle>
                  <CardDescription>
                    Derniers documents uploadés par les dentistes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2">
                            Nom du fichier
                          </th>
                          <th className="text-left py-3 px-2">Dentiste</th>
                          <th className="text-left py-3 px-2">Patient</th>
                          <th className="text-left py-3 px-2">Upload</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => (
                          <tr key={doc.id} className="border-b border-gray-100">
                            <td className="py-3 px-2">
                              <span className="font-medium">
                                {doc.file_name}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-blue-600">
                              {doc.dentist_email}
                            </td>
                            <td className="py-3 px-2 text-green-600">
                              {doc.patient_email}
                            </td>
                            <td className="py-3 px-2 text-gray-600">
                              {formatDate(doc.uploaded_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </Tabs.Content>

            {/* Onglet Conversations IA */}
            <Tabs.Content value="conversations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>💬 Conversations IA Récentes</CardTitle>
                  <CardDescription>
                    Monitoring des interactions avec le chatbot médical
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-green-600">
                              {conv.patient_email}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDate(conv.created_at)}
                            </span>
                          </div>
                          <Badge variant="secondary">
                            {conv.response_length} chars
                          </Badge>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Question patient:
                          </p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {conv.message.length > 200
                              ? `${conv.message.substring(0, 200)}...`
                              : conv.message}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Réponse IA:
                          </p>
                          <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                            {conv.response.length > 300
                              ? `${conv.response.substring(0, 300)}...`
                              : conv.response}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Tabs.Content>
          </Tabs.Root>

          {/* Informations techniques */}
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              🔧 Informations Système
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Admin: {user?.email}</p>
              <p>Permissions: Super Admin</p>
              <p>
                Dernière mise à jour:{" "}
                {stats?.last_updated
                  ? formatDate(stats.last_updated)
                  : "Inconnue"}
              </p>
              <p>Backend: app-dev.melyia.com (PM2 + PostgreSQL + Ollama)</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
