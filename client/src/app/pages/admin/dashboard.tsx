import React, { useState, useEffect } from "react";
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
import { LoadingSpinner } from "@shared/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@shared/components/ui/alert";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Textarea } from "@shared/components/ui/textarea";
import { Slider } from "@shared/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import {
  Users,
  FileText,
  BarChart3,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Settings,
  Save,
  RotateCcw,
} from "lucide-react";
import {
  useAdminStats,
  useAdminUsers,
  useAdminDocuments,
  useAdminConversations,
  useDeleteUser,
  useLLMConfig,
  useUpdateLLMConfig,
  type AdminUser,
  type AdminDocument,
  type AdminConversation,
  type LLMConfig,
} from "../../services/admin-api";
import { useToast } from "@shared/hooks/use-toast";
import { AdminDocumentUpload } from "../../components/upload/AdminDocumentUpload";

type ActiveSection =
  | "overview"
  | "users"
  | "documents"
  | "conversations"
  | "llm-config"
  | "upload-documents";

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");
  const { toast } = useToast();

  // ✅ NOUVEAU : États pour configuration LLM déplacés au niveau supérieur
  const [localConfig, setLocalConfig] = useState<Partial<LLMConfig> | null>(
    null
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

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

  // ✅ NOUVEAU : Hooks pour configuration LLM
  const {
    data: llmConfig,
    isLoading: llmConfigLoading,
    error: llmConfigError,
  } = useLLMConfig();

  const deleteUserMutation = useDeleteUser();
  const updateLLMConfigMutation = useUpdateLLMConfig();

  // ✅ NOUVEAU : Effect pour initialiser la config locale
  useEffect(() => {
    if (llmConfig && !localConfig) {
      setLocalConfig({ ...llmConfig });
    }
  }, [llmConfig, localConfig]);

  // ✅ NOUVEAU : Fonctions pour gestion LLM déplacées au niveau supérieur
  const handleConfigChange = (field: keyof LLMConfig, value: any) => {
    if (!localConfig) return;

    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    setHasUnsavedChanges(true);

    // Annuler le timeout précédent
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Nouveau timeout pour sauvegarde automatique (2 secondes)
    const newTimeout = setTimeout(() => {
      handleSaveConfig(newConfig);
    }, 2000);

    setSaveTimeout(newTimeout);
  };

  const handleSaveConfig = async (configToSave = localConfig) => {
    if (!configToSave) return;

    try {
      await updateLLMConfigMutation.mutateAsync(configToSave);
      setHasUnsavedChanges(false);
      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres IA ont été mis à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    }
  };

  const handleResetConfig = () => {
    if (llmConfig) {
      setLocalConfig({ ...llmConfig });
      setHasUnsavedChanges(false);
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      toast({
        title: "Configuration restaurée",
        description: "Les paramètres ont été remis aux valeurs sauvegardées.",
      });
    }
  };

  const menuItems = [
    {
      id: "overview" as ActiveSection,
      label: "Vue d'ensemble",
      icon: "📊",
      description: "Statistiques globales",
      gradient: "from-blue-500 to-cyan-400",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    {
      id: "users" as ActiveSection,
      label: "Utilisateurs",
      icon: "👥",
      description: "Gestion des comptes",
      gradient: "from-emerald-500 to-teal-400",
      bgGradient: "from-emerald-50 to-teal-50",
    },
    {
      id: "documents" as ActiveSection,
      label: "Documents",
      icon: "📄",
      description: "Fichiers système",
      gradient: "from-purple-500 to-pink-400",
      bgGradient: "from-purple-50 to-pink-50",
    },
    {
      id: "conversations" as ActiveSection,
      label: "Conversations",
      icon: "💬",
      description: "Chat IA",
      gradient: "from-orange-500 to-red-400",
      bgGradient: "from-orange-50 to-red-50",
    },
    {
      id: "llm-config" as ActiveSection,
      label: "Paramètres IA",
      icon: "🤖",
      description: "Configuration LLM",
      gradient: "from-indigo-500 to-purple-400",
      bgGradient: "from-indigo-50 to-purple-50",
    },
    {
      id: "upload-documents" as ActiveSection,
      label: "Upload Documents",
      icon: "📁",
      description: "Gestion upload fichiers",
      gradient: "from-pink-500 to-rose-400",
      bgGradient: "from-pink-50 to-rose-50",
    },
  ];

  const activeMenuItem = menuItems.find((item) => item.id === activeSection);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    isLoading,
    gradient = "from-blue-500 to-cyan-400",
  }: any) => (
    <Card className="group hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm border-0 rounded-3xl overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-500">Chargement...</span>
              </div>
            ) : (
              <p className="text-3xl font-bold text-gray-800">{value || 0}</p>
            )}
            {trend && !isLoading && (
              <p
                className={`text-sm font-medium flex items-center ${
                  trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                {trendValue}% ce mois
              </p>
            )}
          </div>
          <div
            className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}
          >
            <Icon className="h-8 w-8 text-white" />
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

  const renderOverviewSection = () => (
    <div className="h-full flex flex-col">
      {/* En-tête section */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 via-white to-cyan-50 backdrop-blur-sm p-8 border-b border-blue-100">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xl shadow-lg">
                📊
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Vue d'ensemble
              </h2>
            </div>
            <p className="text-gray-600 ml-13">
              Statistiques et monitoring de la plateforme
            </p>
          </div>
          <Button
            onClick={() => refetchStats()}
            className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques avec design moderne */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
        {statsError && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50/80 backdrop-blur-sm border-red-200 rounded-2xl"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              Erreur lors du chargement des statistiques : {statsError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Grille de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Utilisateurs totaux"
            value={stats?.total_users}
            icon={Users}
            trend="up"
            trendValue="12"
            isLoading={statsLoading}
            gradient="from-blue-500 to-cyan-400"
          />
          <StatCard
            title="Dentistes"
            value={stats?.total_dentists}
            icon={Users}
            trend="up"
            trendValue="8"
            isLoading={statsLoading}
            gradient="from-emerald-500 to-teal-400"
          />
          <StatCard
            title="Patients"
            value={stats?.total_patients}
            icon={Users}
            trend="up"
            trendValue="15"
            isLoading={statsLoading}
            gradient="from-purple-500 to-pink-400"
          />
          <StatCard
            title="Documents"
            value={stats?.total_documents}
            icon={FileText}
            trend="up"
            trendValue="23"
            isLoading={statsLoading}
            gradient="from-orange-500 to-red-400"
          />
        </div>

        {/* Informations système */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 rounded-3xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl">
                  <span className="text-sm text-gray-700">
                    Utilisateurs actifs
                  </span>
                  <span className="font-semibold text-blue-600">
                    {stats?.active_users || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl">
                  <span className="text-sm text-gray-700">
                    Conversations IA
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {stats?.total_conversations || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-2xl">
                  <span className="text-sm text-gray-700">Espace disque</span>
                  <span className="font-semibold text-purple-600">
                    {stats?.disk_usage_mb || 0} MB
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 rounded-3xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                État du système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl">
                  <span className="text-sm text-gray-700">Serveur</span>
                  <Badge className="bg-green-500 text-white">
                    ✅ Opérationnel
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl">
                  <span className="text-sm text-gray-700">Base de données</span>
                  <Badge className="bg-green-500 text-white">
                    ✅ Connectée
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl">
                  <span className="text-sm text-gray-700">IA Ollama</span>
                  <Badge className="bg-green-500 text-white">✅ Actif</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Dernière mise à jour:{" "}
                  {stats?.last_updated ? formatDate(stats.last_updated) : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderUsersSection = () => (
    <div className="h-full flex flex-col">
      {/* En-tête section */}
      <div className="flex-shrink-0 bg-gradient-to-r from-emerald-50 via-white to-teal-50 backdrop-blur-sm p-8 border-b border-emerald-100">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xl shadow-lg">
                👥
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Gestion des Utilisateurs
              </h2>
            </div>
            <p className="text-gray-600 ml-13">
              Supervision et administration des comptes utilisateurs
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white border-0 px-4 py-2 rounded-full shadow-lg">
            {users?.length || 0} utilisateurs
          </Badge>
        </div>
      </div>

      {/* Liste des utilisateurs avec design moderne */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-emerald-50/30">
        {usersError && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50/80 backdrop-blur-sm border-red-200 rounded-2xl"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              Erreur lors du chargement des utilisateurs : {usersError.message}
            </AlertDescription>
          </Alert>
        )}

        {usersLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-4">
            {users?.map((user: AdminUser, index: number) => (
              <Card
                key={user.id}
                className="group hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm border-0 rounded-3xl overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-semibold shadow-lg ${
                          user.role === "admin"
                            ? "bg-gradient-to-r from-red-500 to-pink-400"
                            : user.role === "dentist"
                            ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                            : "bg-gradient-to-r from-emerald-500 to-teal-400"
                        }`}
                      >
                        {user.role === "admin"
                          ? "👑"
                          : user.role === "dentist"
                          ? "👨‍⚕️"
                          : "👤"}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-emerald-600 transition-colors duration-300">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-gray-600 font-medium">
                          {user.email}
                        </p>
                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                          <span>📅 {formatDate(user.createdAt)}</span>
                          {user.lastLogin && (
                            <>
                              <span>•</span>
                              <span>🕒 {getTimeAgo(user.lastLogin)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          user.role === "admin"
                            ? "bg-gradient-to-r from-red-500 to-pink-400 text-white"
                            : user.role === "dentist"
                            ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white"
                            : "bg-gradient-to-r from-emerald-500 to-teal-400 text-white"
                        }`}
                      >
                        {user.role === "admin"
                          ? "👑 Admin"
                          : user.role === "dentist"
                          ? "👨‍⚕️ Dentiste"
                          : "👤 Patient"}
                      </Badge>
                      <Badge
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          user.isActive
                            ? "bg-gradient-to-r from-green-500 to-emerald-400 text-white"
                            : "bg-gradient-to-r from-gray-500 to-slate-400 text-white"
                        }`}
                      >
                        {user.isActive ? "✅ Actif" : "💤 Inactif"}
                      </Badge>
                      {user.role !== "admin" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={deleteUserMutation.isPending}
                          className="bg-gradient-to-r from-red-500 to-pink-400 hover:from-red-600 hover:to-pink-500 text-white border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDocumentsSection = () => (
    <div className="h-full flex flex-col">
      {/* En-tête section */}
      <div className="flex-shrink-0 bg-gradient-to-r from-purple-50 via-white to-pink-50 backdrop-blur-sm p-8 border-b border-purple-100">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-400 flex items-center justify-center text-white text-xl shadow-lg">
                📄
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                Gestion des Documents
              </h2>
            </div>
            <p className="text-gray-600 ml-13">
              Supervision des fichiers et documents système
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-400 text-white border-0 px-4 py-2 rounded-full shadow-lg">
            {documents?.length || 0} documents
          </Badge>
        </div>
      </div>

      {/* Liste des documents avec design moderne */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-purple-50/30">
        {documentsError && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50/80 backdrop-blur-sm border-red-200 rounded-2xl"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              Erreur lors du chargement des documents : {documentsError.message}
            </AlertDescription>
          </Alert>
        )}

        {documentsLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-4">
            {documents?.map((doc: AdminDocument, index: number) => (
              <Card
                key={doc.id}
                className="group hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm border-0 rounded-3xl overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                          doc.documentType === "radiography"
                            ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                            : doc.documentType === "treatment_plan"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : doc.documentType === "prescription"
                            ? "bg-gradient-to-r from-orange-500 to-red-400"
                            : "bg-gradient-to-r from-purple-500 to-pink-400"
                        }`}
                      >
                        <span className="text-white text-xl">
                          {doc.documentType === "radiography"
                            ? "🦷"
                            : doc.documentType === "treatment_plan"
                            ? "📋"
                            : doc.documentType === "prescription"
                            ? "💊"
                            : "📄"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                          {doc.title}
                        </h3>
                        <p className="text-gray-600 font-medium">
                          Patient: {doc.patientName}
                        </p>
                        <p className="text-gray-600 font-medium">
                          Dentiste: {doc.dentistName}
                        </p>
                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                          <span>📅 {formatDate(doc.uploadDate)}</span>
                          <span>•</span>
                          <span>📦 {doc.fileSize}</span>
                          <span>•</span>
                          <span>📂 {doc.mimeType}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          doc.processingStatus === "completed"
                            ? "bg-gradient-to-r from-green-500 to-emerald-400 text-white"
                            : doc.processingStatus === "processing"
                            ? "bg-gradient-to-r from-yellow-500 to-orange-400 text-white"
                            : "bg-gradient-to-r from-red-500 to-pink-400 text-white"
                        }`}
                      >
                        {doc.processingStatus === "completed"
                          ? "✅ Traité"
                          : doc.processingStatus === "processing"
                          ? "⏳ En cours"
                          : "❌ Erreur"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-pink-400 text-white border-0 hover:from-purple-600 hover:to-pink-500 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-0 hover:from-blue-600 hover:to-cyan-500 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderConversationsSection = () => (
    <div className="h-full flex flex-col">
      {/* En-tête section */}
      <div className="flex-shrink-0 bg-gradient-to-r from-orange-50 via-white to-red-50 backdrop-blur-sm p-8 border-b border-orange-100">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-orange-500 to-red-400 flex items-center justify-center text-white text-xl shadow-lg">
                💬
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                Conversations IA
              </h2>
            </div>
            <p className="text-gray-600 ml-13">
              Monitoring des interactions avec l'assistant IA
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-orange-500 to-red-400 text-white border-0 px-4 py-2 rounded-full shadow-lg">
            {conversations?.length || 0} conversations
          </Badge>
        </div>
      </div>

      {/* Liste des conversations avec design moderne */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-orange-50/30">
        {conversationsError && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50/80 backdrop-blur-sm border-red-200 rounded-2xl"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              Erreur lors du chargement des conversations :{" "}
              {conversationsError.message}
            </AlertDescription>
          </Alert>
        )}

        {conversationsLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-4">
            {conversations?.map((conv: AdminConversation, index: number) => (
              <Card
                key={conv.id}
                className="group hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm border-0 rounded-3xl overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-orange-500 to-red-400 flex items-center justify-center text-white text-lg shadow-lg">
                          🤖
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">
                            Patient: {conv.patientName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(conv.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            conv.confidenceScore >= 0.8
                              ? "bg-gradient-to-r from-green-500 to-emerald-400 text-white"
                              : conv.confidenceScore >= 0.6
                              ? "bg-gradient-to-r from-yellow-500 to-orange-400 text-white"
                              : "bg-gradient-to-r from-red-500 to-pink-400 text-white"
                          }`}
                        >
                          {Math.round(conv.confidenceScore * 100)}% confiance
                        </Badge>
                        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {conv.responseTimeMs}ms
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-blue-50 p-4 rounded-2xl">
                        <p className="text-sm text-gray-700 font-medium">
                          👤 Question :
                        </p>
                        <p className="text-gray-800 mt-1">{conv.message}</p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-2xl">
                        <p className="text-sm text-gray-700 font-medium">
                          🤖 Réponse :
                        </p>
                        <p className="text-gray-800 mt-1">{conv.response}</p>
                      </div>
                    </div>

                    {conv.feedbackRating && (
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-2xl">
                        <span className="text-sm text-gray-700">
                          Évaluation patient :
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-600 font-semibold">
                            {"⭐".repeat(conv.feedbackRating)}
                          </span>
                          <span className="text-gray-600">
                            ({conv.feedbackRating}/5)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ✅ NOUVEAU : Section configuration LLM
  const renderLLMConfigSection = () => {
    if (llmConfigLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (llmConfigError) {
      return (
        <div className="p-8">
          <Alert className="bg-red-50 border-red-200 rounded-2xl">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Erreur lors du chargement de la configuration:{" "}
              {llmConfigError.message}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    if (!localConfig) {
      return null;
    }

    return (
      <div className="h-full flex flex-col">
        {/* En-tête */}
        <div className="flex-shrink-0 p-8 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-400 flex items-center justify-center shadow-xl">
                <span className="text-white text-3xl">🤖</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Paramètres IA
                </h2>
                <p className="text-gray-500 mt-1">
                  Configuration du chatbot en temps réel
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 px-4 py-2 rounded-full border-0 animate-pulse">
                  🔄 Sauvegarde automatique...
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl px-4 py-2"
                onClick={handleResetConfig}
                disabled={!hasUnsavedChanges}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button
                size="sm"
                className="rounded-xl px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500"
                onClick={() => handleSaveConfig()}
                disabled={
                  !hasUnsavedChanges || updateLLMConfigMutation.isPending
                }
              >
                <Save className="h-4 w-4 mr-2" />
                {updateLLMConfigMutation.isPending
                  ? "Sauvegarde..."
                  : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Section Configuration Générale */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 rounded-3xl shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                  <Settings className="h-6 w-6 text-indigo-600" />
                  <span>Configuration Générale</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="modelName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Modèle IA
                  </Label>
                  <Select
                    value={localConfig.modelName}
                    onValueChange={(value) =>
                      handleConfigChange("modelName", value)
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choisir un modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llama3.2:3b">
                        Llama 3.2 3B (Rapide)
                      </SelectItem>
                      <SelectItem value="llama3.2:7b">
                        Llama 3.2 7B (Équilibré)
                      </SelectItem>
                      <SelectItem value="llama3.2:11b">
                        Llama 3.2 11B (Précis)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="keepAlive"
                    className="text-sm font-medium text-gray-700"
                  >
                    Keep Alive (minutes)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={localConfig.keepAliveMinutes}
                    onChange={(e) =>
                      handleConfigChange(
                        "keepAliveMinutes",
                        parseInt(e.target.value)
                      )
                    }
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="timeout"
                    className="text-sm font-medium text-gray-700"
                  >
                    Timeout (secondes)
                  </Label>
                  <Input
                    type="number"
                    min={10}
                    max={300}
                    value={localConfig.timeoutSeconds}
                    onChange={(e) =>
                      handleConfigChange(
                        "timeoutSeconds",
                        parseInt(e.target.value)
                      )
                    }
                    className="rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section Paramètres de Génération */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 rounded-3xl shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                  <span>Paramètres de Génération</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-gray-700">
                      Température
                    </Label>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {localConfig.temperature || 0}
                    </span>
                  </div>
                  <Slider
                    value={[localConfig.temperature || 0]}
                    onValueChange={([value]) =>
                      handleConfigChange("temperature", value)
                    }
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Plus bas = plus déterministe, plus haut = plus créatif
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-gray-700">
                      Top P
                    </Label>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {localConfig.topP || 0}
                    </span>
                  </div>
                  <Slider
                    value={[localConfig.topP || 0]}
                    onValueChange={([value]) =>
                      handleConfigChange("topP", value)
                    }
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="maxTokens"
                    className="text-sm font-medium text-gray-700"
                  >
                    Max Tokens
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={4096}
                    value={localConfig.maxTokens}
                    onChange={(e) =>
                      handleConfigChange("maxTokens", parseInt(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="numCtx"
                    className="text-sm font-medium text-gray-700"
                  >
                    Context Length
                  </Label>
                  <Input
                    type="number"
                    min={128}
                    max={32768}
                    value={localConfig.numCtx}
                    onChange={(e) =>
                      handleConfigChange("numCtx", parseInt(e.target.value))
                    }
                    className="rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section Prompts Système */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 rounded-3xl shadow-xl lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-green-600" />
                  <span>Prompts Système</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="systemPrompt"
                    className="text-sm font-medium text-gray-700"
                  >
                    Prompt Principal
                  </Label>
                  <Textarea
                    value={localConfig.systemPrompt}
                    onChange={(e) =>
                      handleConfigChange("systemPrompt", e.target.value)
                    }
                    className="rounded-xl min-h-[120px]"
                    placeholder="Instructions principales pour l'IA..."
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="systemPromptUrgence"
                    className="text-sm font-medium text-gray-700"
                  >
                    Prompt Urgence
                  </Label>
                  <Textarea
                    value={localConfig.systemPromptUrgence}
                    onChange={(e) =>
                      handleConfigChange("systemPromptUrgence", e.target.value)
                    }
                    className="rounded-xl min-h-[120px]"
                    placeholder="Instructions pour les situations d'urgence..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informations sur la dernière mise à jour */}
          {llmConfig && (
            <div className="mt-8 p-4 bg-gray-50 rounded-2xl">
              <p className="text-sm text-gray-600">
                Dernière mise à jour : {formatDate(llmConfig.updatedAt)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderUploadDocumentsSection = () => (
    <div className="h-full flex flex-col">
      {/* En-tête section */}
      <div className="flex-shrink-0 bg-gradient-to-r from-pink-50 via-white to-rose-50 backdrop-blur-sm p-8 border-b border-pink-100">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 flex items-center justify-center text-white text-xl shadow-lg">
                📁
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
                Upload Documents
              </h2>
            </div>
            <p className="text-gray-600 ml-13">
              Gestion complète de l'upload de documents généraux et personnels
            </p>
          </div>
        </div>
      </div>

      {/* Interface d'upload */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-pink-50/30">
        <AdminDocumentUpload
          onUploadComplete={() => {
            toast({
              title: "Upload terminé",
              description: "Les documents ont été uploadés avec succès !",
            });
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header moderne avec glassmorphism */}
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 z-10">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-pink-400 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Melyia Admin
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Dashboard administrateur
                </p>
              </div>
              <Badge
                variant="secondary"
                className="ml-4 px-4 py-2 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-0 rounded-full"
              >
                👑 {user?.firstName} {user?.lastName}
              </Badge>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <span className="text-gray-800 font-semibold">
                  Administrateur système
                </span>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="rounded-xl px-6 py-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-300"
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Corps principal avec sidebar moderne */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar navigation moderne */}
        <aside className="flex-shrink-0 w-80 bg-white/80 backdrop-blur-md border-r border-gray-200/50 shadow-xl">
          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Administration
              </h3>
              <p className="text-gray-500 text-sm">
                Gestion complète de la plateforme
              </p>
            </div>
            <nav className="space-y-4">
              {menuItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left p-6 rounded-3xl transition-all duration-500 transform hover:scale-105 ${
                    activeSection === item.id
                      ? `bg-gradient-to-r ${item.bgGradient} border-2 border-white shadow-2xl scale-105`
                      : "hover:bg-gray-50 text-gray-700 shadow-md hover:shadow-lg"
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-all duration-300 ${
                        activeSection === item.id
                          ? `bg-gradient-to-r ${item.gradient} text-white shadow-xl`
                          : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`font-bold text-lg transition-colors duration-300 ${
                          activeSection === item.id
                            ? "text-gray-800"
                            : "text-gray-700"
                        }`}
                      >
                        {item.label}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {item.description}
                      </div>
                    </div>
                    {activeSection === item.id && (
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 shadow-lg animate-pulse"></div>
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Contenu principal avec animation */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full transition-all duration-700 ease-in-out">
            {activeSection === "overview" && renderOverviewSection()}
            {activeSection === "users" && renderUsersSection()}
            {activeSection === "documents" && renderDocumentsSection()}
            {activeSection === "conversations" && renderConversationsSection()}
            {activeSection === "llm-config" && renderLLMConfigSection()}
            {activeSection === "upload-documents" &&
              renderUploadDocumentsSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
