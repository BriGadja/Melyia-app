import React, { useState } from "react";
import { useAuth } from "../../context/auth-context";
import { Button } from "@shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card";
import { Badge } from "@shared/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@shared/components/ui/tabs";
import { LoadingSpinner } from "@shared/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@shared/components/ui/alert";
import {
  Users,
  FileText,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  TrendingUp,
  Clock,
  UserPlus,
  FileCheck,
  MessageSquare,
  Activity,
  Zap,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  useAdminStats,
  useAdminUsers,
  useAdminDocuments,
  useAdminConversations,
  useDeleteUser,
  type AdminUser,
  type AdminDocument,
  type AdminConversation,
} from "../../services/admin-api";
import { useToast } from "@shared/hooks/use-toast";

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Hooks pour récupérer les données
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useAdminStats();
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useAdminUsers();
  const {
    data: documents,
    isLoading: documentsLoading,
    error: documentsError,
  } = useAdminDocuments();
  const {
    data: conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useAdminConversations();

  const deleteUserMutation = useDeleteUser();

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    isLoading,
  }: any) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <div className="flex items-center gap-2 mt-1">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-muted-foreground">
                  Chargement...
                </span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-foreground">{value || 0}</p>
            )}
            {trend && !isLoading && (
              <p
                className={`text-xs ${
                  trend === "up" ? "text-green-600" : "text-red-600"
                } flex items-center mt-1`}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {trendValue}% ce mois
              </p>
            )}
          </div>
          <div className="h-12 w-12 bg-[hsl(221,83%,53%)] rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ?`
      )
    ) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(userId);
      toast({
        title: "Utilisateur supprimé",
        description: `L'utilisateur ${userEmail} a été supprimé avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440)
      return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-[hsl(221,83%,53%)] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Dashboard Admin
                </h1>
                <p className="text-sm text-muted-foreground">
                  Melyia - Gestion Complète
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge
                variant="secondary"
                className="bg-[hsl(221,83%,53%)]/10 text-[hsl(221,83%,53%)]"
              >
                <Shield className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="bot" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">IA & Bot</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            {/* Gestion des erreurs */}
            {statsError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Erreur lors du chargement des statistiques:{" "}
                  {statsError.message}
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => refetchStats()}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Réessayer
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Utilisateurs Total"
                value={stats?.total_users}
                icon={Users}
                trend="up"
                trendValue={12}
                isLoading={statsLoading}
              />
              <StatCard
                title="Documents Stockés"
                value={stats?.total_documents}
                icon={FileText}
                trend="up"
                trendValue={8}
                isLoading={statsLoading}
              />
              <StatCard
                title="Conversations IA"
                value={stats?.total_conversations}
                icon={MessageSquare}
                trend="up"
                trendValue={24}
                isLoading={statsLoading}
              />
              <StatCard
                title="Utilisateurs Actifs"
                value={stats?.active_users}
                icon={Activity}
                trend="up"
                trendValue={16}
                isLoading={statsLoading}
              />
            </div>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[hsl(221,83%,53%)]" />
                  Actions Rapides
                </CardTitle>
                <CardDescription>
                  Accès rapide aux fonctionnalités principales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => setActiveTab("users")}
                    className="bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,48%)] text-white h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <UserPlus className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">Gérer Utilisateurs</div>
                      <div className="text-xs opacity-90">
                        {users?.length || 0} utilisateurs
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => setActiveTab("documents")}
                    variant="outline"
                    className="border-[hsl(221,83%,53%)] text-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,53%)] hover:text-white h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <FileCheck className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">Documents Globaux</div>
                      <div className="text-xs opacity-70">
                        {documents?.length || 0} documents
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => setActiveTab("bot")}
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Bot className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">Monitorer IA</div>
                      <div className="text-xs opacity-70">
                        {conversations?.length || 0} conversations
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Activité récente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[hsl(221,83%,53%)]" />
                  Activité Récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : conversations && conversations.length > 0 ? (
                  <div className="space-y-4">
                    {conversations.slice(0, 5).map((conv, index) => (
                      <div
                        key={conv.id}
                        className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Conversation IA</p>
                          <p className="text-xs text-muted-foreground">
                            {conv.patient_email} - {conv.response_length}{" "}
                            caractères
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(conv.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune activité récente
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section Utilisateurs */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[hsl(221,83%,53%)]" />
                  Gestion des Utilisateurs
                </CardTitle>
                <CardDescription>
                  Administrez tous les comptes utilisateurs de la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : usersError ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Erreur lors du chargement des utilisateurs:{" "}
                      {usersError.message}
                    </AlertDescription>
                  </Alert>
                ) : users && users.length > 0 ? (
                  <div className="space-y-4">
                    {users.map((user: AdminUser) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[hsl(221,83%,53%)] rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {user.firstName.charAt(0)}
                                {user.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge
                              variant={
                                user.role === "admin" ? "default" : "secondary"
                              }
                              className={
                                user.role === "admin"
                                  ? "bg-red-100 text-red-800"
                                  : ""
                              }
                            >
                              {user.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Inscrit le {formatDate(user.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user.role !== "admin" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeleteUser(user.id, user.email)
                              }
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur trouvé
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[hsl(221,83%,53%)]" />
                  Gestion des Documents
                </CardTitle>
                <CardDescription>
                  Consultez et gérez tous les documents stockés sur la
                  plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : documentsError ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Erreur lors du chargement des documents:{" "}
                      {documentsError.message}
                    </AlertDescription>
                  </Alert>
                ) : documents && documents.length > 0 ? (
                  <div className="space-y-4">
                    {documents.map((doc: AdminDocument) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {doc.fileName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Dentiste: {doc.dentistEmail} • Patient:{" "}
                            {doc.patientEmail}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Uploadé le {formatDate(doc.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun document trouvé
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section Bot */}
          <TabsContent value="bot" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-green-600" />
                  Monitoring IA & Chatbot
                </CardTitle>
                <CardDescription>
                  Surveillez l'intelligence artificielle Melyia en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent>
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : conversationsError ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Erreur lors du chargement des conversations:{" "}
                      {conversationsError.message}
                    </AlertDescription>
                  </Alert>
                ) : conversations && conversations.length > 0 ? (
                  <div className="space-y-4">
                    {conversations.map((conv: AdminConversation) => (
                      <div
                        key={conv.id}
                        className="p-4 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            Conversation #{conv.id}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(conv.created_at)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium">
                              Patient: {conv.patient_email}
                            </p>
                            {conv.dentist_email && (
                              <p className="text-sm text-muted-foreground">
                                Dentiste: {conv.dentist_email}
                              </p>
                            )}
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <p className="text-sm font-medium mb-1">Message:</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {conv.message}
                            </p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-sm font-medium mb-1">
                              Réponse IA ({conv.response_length} caractères):
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {conv.response}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune conversation trouvée
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section Paramètres */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[hsl(221,83%,53%)]" />
                  Paramètres Système
                </CardTitle>
                <CardDescription>
                  Configuration globale de la plateforme Melyia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <Settings className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Configuration Avancée
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Paramètres de sécurité, intégrations API, et configuration
                    serveur.
                  </p>
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    En développement - Phase 2
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
