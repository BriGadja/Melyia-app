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
        password: "test123",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">🦷</div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Connexion Melyia
          </CardTitle>
          <CardDescription className="text-gray-600">
            Plateforme dentaire sécurisée
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Affichage des erreurs */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Boutons comptes test */}
          <div className="bg-blue-50 p-3 rounded-lg space-y-2">
            <p className="text-sm text-blue-800 font-medium">
              Comptes de test :
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillTestAccount("dentist")}
                className="flex-1"
                disabled={isLoading}
              >
                👨‍⚕️ Dr. Dupont
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillTestAccount("patient")}
                className="flex-1"
                disabled={isLoading}
              >
                👤 Marie Martin
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillTestAccount("admin")}
              className="w-full"
              disabled={isLoading}
            >
              🔧 Admin - Brice
            </Button>
          </div>

          {/* Formulaire de connexion */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="dentiste@melyia.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="test123"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          {/* Lien vers inscription - NOUVEAU */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => setLocation("/register")}
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
                disabled={isLoading}
              >
                Créer un compte
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 pt-2">
            Environnement de développement v12.0
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
