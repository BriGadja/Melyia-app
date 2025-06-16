import React, { useState } from "react";
import { useAuth } from "../../context/auth-context";
import { DocumentUpload } from "../../components/upload/DocumentUpload";

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
import * as Tabs from "@radix-ui/react-tabs";

const DentistDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Melyia - Espace Dentiste
              </h1>
              <Badge variant="secondary" className="ml-3">
                {user?.practiceInfo}
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-medium text-blue-900 mb-2">
              Bienvenue Dr. {user?.lastName} ! 👨‍⚕️
            </h2>
            <p className="text-blue-800">
              Votre espace dentiste est opérationnel. L'infrastructure
              d'authentification est maintenant complète et prête pour les
              fonctionnalités métier.
            </p>
          </div>

          {/* Navigation par onglets */}
          <Tabs.Root
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <Tabs.List className="flex space-x-2 border-b mb-6">
              <Tabs.Trigger
                value="overview"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-blue-600 hover:border-blue-600 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
              >
                Vue d'ensemble
              </Tabs.Trigger>
              <Tabs.Trigger
                value="documents"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:text-blue-600 hover:border-blue-600 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
              >
                Documents Patients
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="overview" className="mt-6">
              {/* Grille de cards fonctionnalités */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Gestion des patients */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      👥 Patients
                    </CardTitle>
                    <CardDescription>
                      Gestion de votre patientèle
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Consultez et gérez les dossiers de vos patients.
                    </p>
                    <Button variant="outline" className="w-full" disabled>
                      À venir - Phase 2
                    </Button>
                  </CardContent>
                </Card>

                {/* Base de connaissance IA */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      🤖 Assistant IA
                    </CardTitle>
                    <CardDescription>
                      Chatbot avec base de connaissance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Intelligence artificielle alimentée par vos données
                      patients.
                    </p>
                    <Button variant="outline" className="w-full" disabled>
                      À venir - Phase 2
                    </Button>
                  </CardContent>
                </Card>

                {/* Documents et devis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      📄 Documents
                    </CardTitle>
                    <CardDescription>
                      Gestion devis et plans de traitement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload PDF, DOCX, images. Création de devis interactifs.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveTab("documents")}
                    >
                      Accéder aux documents
                    </Button>
                  </CardContent>
                </Card>

                {/* Planning */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      📅 Planning
                    </CardTitle>
                    <CardDescription>Calendrier et rendez-vous</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Gestion des rendez-vous avec rappels automatiques.
                    </p>
                    <Button variant="outline" className="w-full" disabled>
                      À venir - Phase 2
                    </Button>
                  </CardContent>
                </Card>

                {/* Statistiques */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      📊 Statistiques
                    </CardTitle>
                    <CardDescription>
                      Tableau de bord analytique
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Métriques et analyses de votre activité.
                    </p>
                    <Button variant="outline" className="w-full" disabled>
                      À venir - Phase 2
                    </Button>
                  </CardContent>
                </Card>

                {/* Paramètres */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      ⚙️ Paramètres
                    </CardTitle>
                    <CardDescription>Configuration du cabinet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Personnalisation et paramètres du compte.
                    </p>
                    <Button variant="outline" className="w-full" disabled>
                      À venir - Phase 2
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </Tabs.Content>

            <Tabs.Content value="documents" className="mt-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    Gestion des Documents Patients
                  </h2>
                  <DocumentUpload
                    onUploadComplete={() => {
                      // TODO: Rafraîchir la liste des documents
                      console.log("Upload terminé");
                    }}
                  />
                </div>
              </div>
            </Tabs.Content>
          </Tabs.Root>

          {/* Informations techniques */}
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Informations de session
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Email: {user?.email}</p>
              <p>Rôle: {user?.role}</p>
              <p>ID: {user?.id}</p>
              <p>Cabinet: {user?.practiceInfo}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DentistDashboard;
