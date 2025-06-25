import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../context/auth-context";

// Composants du design system
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card";
import { Label } from "@shared/components/ui/label";
import { Alert, AlertDescription } from "@shared/components/ui/alert";
import { LoadingSpinner } from "@shared/components/ui/loading-spinner";

const LoginPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  // État du formulaire avec dentiste par défaut
  const [formData, setFormData] = useState({
    email: "dentiste@melyia.com",
    password: "test123",
  });

  // États UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Redirection si déjà connecté
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = (() => {
        switch (user.role) {
          case "admin":
            return "/admin/dashboard";
          case "dentist":
            return "/dentist/dashboard";
          case "patient":
            return "/patient/dashboard";
          default:
            return "/patient/dashboard";
        }
      })();
      console.log("🔄 Redirection vers:", redirectPath);
      setLocation(redirectPath);
    }
  }, [isAuthenticated, user, setLocation]);

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("🔐 Tentative de connexion:", formData.email);
      const result = await login(formData.email, formData.password);

      if (result.success) {
        console.log("✅ Connexion réussie !");
        // Le useEffect ci-dessus gèrera la redirection automatiquement
      } else {
        setError(result.error || "Identifiants invalides");
      }
    } catch (err) {
      console.error("❌ Erreur de connexion:", err);
      setError("Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion des changements de champs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fonction pour remplir rapidement les comptes test
  const fillTestAccount = (type: "dentist" | "patient" | "admin") => {
    if (type === "dentist") {
      setFormData({
        email: "dentiste@melyia.com",
        password: "test123",
      });
    } else if (type === "patient") {
      setFormData({
        email: "patient@melyia.com",
        password: "test123",
      });
    } else if (type === "admin") {
      setFormData({
        email: "brice@melyia.com",
        password: "password",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Éléments de décoration en arrière-plan */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-10 blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-md border-0 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center p-8 pb-6">
          {/* Logo moderne */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-2xl">
              <span className="text-white text-3xl font-bold">M</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Bienvenue sur Melyia
          </CardTitle>
          <CardDescription className="text-gray-600 text-lg">
            Plateforme dentaire nouvelle génération
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-8 pt-0">
          {/* Affichage des erreurs */}
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-50/80 backdrop-blur-sm border-red-200 rounded-2xl"
            >
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Boutons comptes test modernisés */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-sm p-6 rounded-3xl border border-blue-100 shadow-lg">
            <p className="text-sm font-semibold text-gray-700 mb-4 text-center">
              🧪 Comptes de démonstration
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillTestAccount("dentist")}
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-0 hover:from-blue-600 hover:to-cyan-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  disabled={isLoading}
                >
                  👨‍⚕️ Dr. Dupont
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillTestAccount("patient")}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white border-0 hover:from-emerald-600 hover:to-teal-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  disabled={isLoading}
                >
                  👤 Patient
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillTestAccount("admin")}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-400 text-white border-0 hover:from-purple-600 hover:to-pink-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                disabled={isLoading}
              >
                🔧 Administrateur
              </Button>
            </div>
          </div>

          {/* Formulaire de connexion moderne */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-semibold">
                ✉️ Adresse email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="dentiste@melyia.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="pl-12 py-3 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-md focus:shadow-lg focus:bg-white transition-all duration-300"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  ✉️
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-semibold">
                🔒 Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="pl-12 py-3 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-md focus:shadow-lg focus:bg-white transition-all duration-300"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔒
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-3" />
                  Connexion en cours...
                </>
              ) : (
                <>🚀 Se connecter</>
              )}
            </Button>
          </form>

          {/* Lien vers inscription */}
          <div className="text-center pt-4">
            <p className="text-gray-600">
              Pas encore de compte ?{" "}
              <Button
                variant="link"
                onClick={() => setLocation("/register")}
                className="text-blue-600 hover:text-blue-700 font-semibold p-0 h-auto"
                disabled={isLoading}
              >
                Créer un compte →
              </Button>
            </p>
          </div>

          {/* Informations de version */}
          <div className="text-center pt-4 border-t border-gray-200/50">
            <p className="text-xs text-gray-500">
              Melyia v2.0 • Plateforme dentaire sécurisée
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
