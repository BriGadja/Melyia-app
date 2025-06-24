import React, { useState } from "react";
import { useAuth } from "../../context/auth-context";
import { ChatInterface } from "../../components/chatbot/chat-interface";

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

// Composants notifications
import { NotificationIcon } from "@shared/components/notifications";

type ActiveSection =
  | "chatbot"
  | "dossier"
  | "rdv"
  | "communication"
  | "documents"
  | "profil";

const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<ActiveSection>("chatbot");

  const menuItems = [
    {
      id: "chatbot" as ActiveSection,
      label: "Assistant IA",
      icon: "🤖",
      description: "Chat médical",
      gradient: "from-blue-500 to-cyan-400",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    {
      id: "dossier" as ActiveSection,
      label: "Dossier",
      icon: "📋",
      description: "Informations médicales",
      gradient: "from-emerald-500 to-teal-400",
      bgGradient: "from-emerald-50 to-teal-50",
    },
    {
      id: "rdv" as ActiveSection,
      label: "Rendez-vous",
      icon: "📅",
      description: "Planning",
      gradient: "from-purple-500 to-pink-400",
      bgGradient: "from-purple-50 to-pink-50",
    },
    {
      id: "communication" as ActiveSection,
      label: "Messages",
      icon: "💬",
      description: "Communication",
      gradient: "from-orange-500 to-red-400",
      bgGradient: "from-orange-50 to-red-50",
    },
    {
      id: "documents" as ActiveSection,
      label: "Documents",
      icon: "📄",
      description: "Devis & factures",
      gradient: "from-indigo-500 to-purple-400",
      bgGradient: "from-indigo-50 to-purple-50",
    },
    {
      id: "profil" as ActiveSection,
      label: "Mon Profil",
      icon: "👤",
      description: "Paramètres",
      gradient: "from-gray-500 to-slate-400",
      bgGradient: "from-gray-50 to-slate-50",
    },
  ];

  const activeMenuItem = menuItems.find((item) => item.id === activeSection);

  const renderChatbotSection = () => (
    <div className="h-full flex flex-col">
      {/* En-tête section */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 via-white to-cyan-50 backdrop-blur-sm p-8 border-b border-blue-100">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xl shadow-lg">
                🤖
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Assistant IA Médical
              </h2>
            </div>
            <p className="text-gray-600 ml-13">
              Chat intelligent sécurisé pour vos questions médicales
            </p>
          </div>
          <div className="bg-green-100 px-4 py-2 rounded-full">
            <span className="text-green-700 font-semibold text-sm">
              🔒 100% Local
            </span>
          </div>
        </div>
      </div>

      {/* Chatbot avec design moderne */}
      <div className="flex-1 overflow-hidden p-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="h-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border-0 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );

  const renderComingSoonSection = (
    title: string,
    description: string,
    icon: string,
    gradient: string
  ) => (
    <div className="h-full flex flex-col">
      {/* En-tête section */}
      <div
        className={`flex-shrink-0 bg-gradient-to-r ${
          activeMenuItem?.bgGradient
        } backdrop-blur-sm p-8 border-b ${
          activeMenuItem?.bgGradient.includes("blue")
            ? "border-blue-100"
            : activeMenuItem?.bgGradient.includes("emerald")
            ? "border-emerald-100"
            : activeMenuItem?.bgGradient.includes("purple")
            ? "border-purple-100"
            : activeMenuItem?.bgGradient.includes("orange")
            ? "border-orange-100"
            : activeMenuItem?.bgGradient.includes("indigo")
            ? "border-indigo-100"
            : "border-gray-100"
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center text-white text-xl shadow-lg`}
              >
                {icon}
              </div>
              <h2
                className={`text-3xl font-bold bg-gradient-to-r ${gradient
                  .replace("from-", "from-")
                  .replace("to-", "to-")
                  .replace("-500", "-600")
                  .replace("-400", "-500")} bg-clip-text text-transparent`}
              >
                {title}
              </h2>
            </div>
            <p className="text-gray-600 ml-13">{description}</p>
          </div>
          <Badge
            className={`bg-gradient-to-r ${gradient} text-white border-0 px-4 py-2 rounded-full shadow-lg`}
          >
            Bientôt disponible
          </Badge>
        </div>
      </div>

      {/* Contenu à venir */}
      <div
        className={`flex-1 overflow-hidden p-6 bg-gradient-to-br from-gray-50 ${
          activeMenuItem?.bgGradient
            ? `to-${activeMenuItem.bgGradient.split("to-")[1]}/30`
            : "to-gray-100"
        }`}
      >
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div
              className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center shadow-2xl`}
            >
              <span className="text-white text-6xl">{icon}</span>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                {description}
              </p>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-0">
                <h4 className="font-semibold text-gray-700 mb-3">
                  Fonctionnalités prévues :
                </h4>
                <ul className="text-gray-600 space-y-2 text-left">
                  {activeSection === "dossier" && (
                    <>
                      <li>• Historique médical complet</li>
                      <li>• Suivi des traitements</li>
                      <li>• Allergies et antécédents</li>
                      <li>• Radiographies et examens</li>
                    </>
                  )}
                  {activeSection === "rdv" && (
                    <>
                      <li>• Prise de rendez-vous en ligne</li>
                      <li>• Rappels automatiques</li>
                      <li>• Annulation/report facile</li>
                      <li>• Historique des consultations</li>
                    </>
                  )}
                  {activeSection === "communication" && (
                    <>
                      <li>• Messages sécurisés avec votre dentiste</li>
                      <li>• Notifications en temps réel</li>
                      <li>• Partage d'images</li>
                      <li>• Conseils personnalisés</li>
                    </>
                  )}
                  {activeSection === "documents" && (
                    <>
                      <li>• Devis et factures numériques</li>
                      <li>• Plans de traitement détaillés</li>
                      <li>• Téléchargement sécurisé</li>
                      <li>• Archivage automatique</li>
                    </>
                  )}
                  {activeSection === "profil" && (
                    <>
                      <li>• Informations personnelles</li>
                      <li>• Préférences de contact</li>
                      <li>• Gestion de la confidentialité</li>
                      <li>• Paramètres de notification</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Melyia
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Espace Patient
                </p>
              </div>
              <Badge
                variant="secondary"
                className="ml-4 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-0 rounded-full"
              >
                {user?.firstName} {user?.lastName}
              </Badge>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <span className="text-gray-800 font-semibold">
                  Bonjour {user?.firstName} ! 😊
                </span>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              {/* Composant Notifications */}
              <NotificationIcon
                className="mx-2"
                pollInterval={30000}
                maxNotifications={50}
                onNavigate={(link) => {
                  // Navigation personnalisée pour l'application patient
                  if (link.startsWith("/")) {
                    window.location.href = link;
                  } else {
                    window.open(link, "_blank", "noopener,noreferrer");
                  }
                }}
              />

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
                Votre espace
              </h3>
              <p className="text-gray-500 text-sm">
                Accédez à tous vos services dentaires
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
            {activeSection === "chatbot" && renderChatbotSection()}
            {activeSection === "dossier" &&
              renderComingSoonSection(
                "Dossier Médical",
                "Votre historique médical complet et sécurisé",
                "📋",
                "from-emerald-500 to-teal-400"
              )}
            {activeSection === "rdv" &&
              renderComingSoonSection(
                "Rendez-vous",
                "Gestion simplifiée de vos consultations",
                "📅",
                "from-purple-500 to-pink-400"
              )}
            {activeSection === "communication" &&
              renderComingSoonSection(
                "Messages",
                "Communication directe avec votre dentiste",
                "💬",
                "from-orange-500 to-red-400"
              )}
            {activeSection === "documents" &&
              renderComingSoonSection(
                "Documents",
                "Tous vos documents dentaires en un lieu",
                "📄",
                "from-indigo-500 to-purple-400"
              )}
            {activeSection === "profil" &&
              renderComingSoonSection(
                "Mon Profil",
                "Gérez vos informations personnelles",
                "👤",
                "from-gray-500 to-slate-400"
              )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;
