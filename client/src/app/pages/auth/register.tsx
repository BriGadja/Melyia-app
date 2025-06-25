import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@app/context/auth-context";
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
import { RadioGroup, RadioGroupItem } from "@shared/components/ui/radio-group";
import {
  Stethoscope,
  User,
  Mail,
  Lock,
  Phone,
  Building,
  Calendar,
} from "lucide-react";
import { LoadingSpinner } from "@shared/components/ui/loading-spinner";

const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : "https://app-dev.melyia.com/api";
console.log("🔗 API URL utilisée:", API_BASE_URL); // Debug

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // État du formulaire simplifié
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("patient");
  const [practiceName, setPracticeName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const validateForm = () => {
    const newErrors: any = {};

    // Validation email
    if (!email) {
      newErrors.email = "Email requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email invalide";
    }

    // Validation mot de passe
    if (!password) {
      newErrors.password = "Mot de passe requis";
    } else if (password.length < 8) {
      newErrors.password =
        "Le mot de passe doit contenir au moins 8 caractères";
    }

    // Validation confirmation mot de passe
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    // Validation prénom/nom
    if (!firstName.trim()) {
      newErrors.firstName = "Prénom requis";
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Nom requis";
    }

    // Validation spécifique dentiste
    if (role === "dentist" && !practiceName.trim()) {
      newErrors.practiceName = "Nom du cabinet requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Préparer les données selon le rôle
      const formData = {
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        phone: phone || undefined,
        role,
        birthDate: role === "patient" && birthDate ? birthDate : undefined,
        practiceInfo:
          role === "dentist"
            ? {
                practiceName,
                specializations: ["Dentisterie générale"],
              }
            : undefined,
      };

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'inscription");
      }

      // Connexion automatique avec le token reçu
      if (data.success && data.token) {
        login(data.token, data.user);
        setLocation(data.redirectUrl || "/dashboard");
      }
    } catch (error) {
      console.error("Erreur inscription:", error);
      setErrors({
        general: (error as Error).message || "Erreur lors de l'inscription",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Éléments de décoration en arrière-plan */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-10 right-10 w-80 h-80 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ animationDelay: "3s" }}
        ></div>
        <div
          className="absolute top-1/3 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-15 blur-3xl animate-pulse"
          style={{ animationDelay: "6s" }}
        ></div>
      </div>

      <Card className="w-full max-w-lg relative z-10 bg-white/80 backdrop-blur-md border-0 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center p-8 pb-6">
          {/* Logo moderne */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center shadow-2xl">
              <span className="text-white text-3xl font-bold">M</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Créer votre compte
          </CardTitle>
          <CardDescription className="text-gray-600 text-lg">
            Rejoignez Melyia pour une meilleure gestion dentaire
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélecteur de rôle modernisé */}
            <div className="space-y-4">
              <Label className="text-gray-700 font-semibold text-lg">
                👤 Je suis :
              </Label>
              <RadioGroup
                value={role}
                onValueChange={setRole}
                className="grid grid-cols-2 gap-4"
              >
                <div
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    role === "patient"
                      ? "border-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg"
                      : "border-gray-200 hover:border-emerald-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="patient"
                      id="patient"
                      className="text-emerald-500"
                    />
                    <Label
                      htmlFor="patient"
                      className="flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <span className="text-2xl">👤</span>
                      Patient
                    </Label>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    role === "dentist"
                      ? "border-blue-400 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg"
                      : "border-gray-200 hover:border-blue-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="dentist"
                      id="dentist"
                      className="text-blue-500"
                    />
                    <Label
                      htmlFor="dentist"
                      className="flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <span className="text-2xl">👨‍⚕️</span>
                      Dentiste
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Erreur générale */}
            {errors.general && (
              <div className="p-4 text-sm text-red-700 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl">
                {errors.general}
              </div>
            )}

            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                📝 Informations personnelles
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-gray-700 font-medium"
                  >
                    Prénom *
                  </Label>
                  <div className="relative">
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Marie"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        clearError("firstName");
                      }}
                      className="pl-10 py-3 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-md focus:shadow-lg focus:bg-white transition-all duration-300"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      👤
                    </div>
                  </div>
                  {errors.firstName && (
                    <p className="text-red-600 text-sm">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-gray-700 font-medium"
                  >
                    Nom *
                  </Label>
                  <div className="relative">
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Dupont"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        clearError("lastName");
                      }}
                      className="pl-10 py-3 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-md focus:shadow-lg focus:bg-white transition-all duration-300"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      📛
                    </div>
                  </div>
                  {errors.lastName && (
                    <p className="text-red-600 text-sm">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email *
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="marie.dupont@exemple.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError("email");
                    }}
                    className="pl-10 py-3 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-md focus:shadow-lg focus:bg-white transition-all duration-300"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    ✉️
                  </div>
                </div>
                {errors.email && (
                  <p className="text-red-600 text-sm">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-medium">
                  Téléphone
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 py-3 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-md focus:shadow-lg focus:bg-white transition-all duration-300"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    📞
                  </div>
                </div>
              </div>
            </div>

            {/* Informations spécifiques au rôle */}
            {role === "dentist" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  🏥 Informations du cabinet
                </h3>
                <div className="space-y-2">
                  <Label
                    htmlFor="practiceName"
                    className="text-gray-700 font-medium"
                  >
                    Nom du cabinet *
                  </Label>
                  <div className="relative">
                    <Input
                      id="practiceName"
                      type="text"
                      placeholder="Cabinet Dentaire Dr. Dupont"
                      value={practiceName}
                      onChange={(e) => {
                        setPracticeName(e.target.value);
                        clearError("practiceName");
                      }}
                      className="pl-10 py-3 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-md focus:shadow-lg focus:bg-white transition-all duration-300"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🏥
                    </div>
                  </div>
                  {errors.practiceName && (
                    <p className="text-red-600 text-sm">
                      {errors.practiceName}
                    </p>
                  )}
                </div>
              </div>
            )}

            {role === "patient" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  📅 Informations patient
                </h3>
                <div className="space-y-2">
                  <Label
                    htmlFor="birthDate"
                    className="text-gray-700 font-medium"
                  >
                    Date de naissance
                  </Label>
                  <div className="relative">
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="pl-10 py-3 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-md focus:shadow-lg focus:bg-white transition-all duration-300"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      📅
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sécurité */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                🔒 Sécurité
              </h3>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Mot de passe *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError("password");
                    }}
                    className="pl-10 py-3 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-md focus:shadow-lg focus:bg-white transition-all duration-300"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔒
                  </div>
                </div>
                {errors.password && (
                  <p className="text-red-600 text-sm">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-gray-700 font-medium"
                >
                  Confirmer le mot de passe *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError("confirmPassword");
                    }}
                    className="pl-10 py-3 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-md focus:shadow-lg focus:bg-white transition-all duration-300"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔐
                  </div>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-3" />
                  Création du compte...
                </>
              ) : (
                <>🚀 Créer mon compte</>
              )}
            </Button>
          </form>

          {/* Lien vers connexion */}
          <div className="text-center pt-6">
            <p className="text-gray-600">
              Déjà un compte ?{" "}
              <Button
                variant="link"
                onClick={() => setLocation("/login")}
                className="text-emerald-600 hover:text-emerald-700 font-semibold p-0 h-auto"
                disabled={isLoading}
              >
                Se connecter →
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
}
