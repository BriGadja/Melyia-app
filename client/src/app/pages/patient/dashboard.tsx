import React from "react";
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

const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Melyia - Espace Patient
              </h1>
              <Badge variant="secondary" className="ml-3">
                Patient
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-medium text-green-900 mb-2">
              Bienvenue {user?.firstName} ! 😊
            </h2>
            <p className="text-green-800">
              Votre espace patient sécurisé est opérationnel. Vous pourrez
              bientôt consulter vos documents, rendez-vous et communiquer avec
              votre dentiste.
            </p>
          </div>

          {/* Grille de cards fonctionnalités */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Dossier médical */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  📋 Dossier Médical
                </CardTitle>
                <CardDescription>Vos informations médicales</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Consultez votre historique et vos traitements.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  À venir - Phase 2
                </Button>
              </CardContent>
            </Card>

            {/* Rendez-vous */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  📅 Rendez-vous
                </CardTitle>
                <CardDescription>Planning et réservations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Gérez vos rendez-vous et consultez votre planning.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  À venir - Phase 2
                </Button>
              </CardContent>
            </Card>

            {/* Chat avec dentiste */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  💬 Communication
                </CardTitle>
                <CardDescription>Messages avec votre dentiste</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Posez vos questions et recevez des réponses personnalisées.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  À venir - Phase 2
                </Button>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  📄 Documents
                </CardTitle>
                <CardDescription>Devis et plans de traitement</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Consultez vos devis, factures et documents médicaux.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  À venir - Phase 2
                </Button>
              </CardContent>
            </Card>

            {/* Historique */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  🕒 Historique
                </CardTitle>
                <CardDescription>Suivi de vos traitements</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Visualisez l'évolution de vos traitements dentaires.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  À venir - Phase 2
                </Button>
              </CardContent>
            </Card>

            {/* Profil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  👤 Mon Profil
                </CardTitle>
                <CardDescription>Informations personnelles</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Modifiez vos informations et préférences.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  À venir - Phase 2
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Informations techniques */}
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Informations de session
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Email: {user?.email}</p>
              <p>Rôle: {user?.role}</p>
              <p>ID: {user?.id}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
