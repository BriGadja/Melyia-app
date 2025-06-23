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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Créer votre compte
          </CardTitle>
          <CardDescription className="text-center">
            Rejoignez Melyia pour une meilleure gestion dentaire
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélecteur de rôle */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Je suis :</Label>
              <RadioGroup
                value={role}
                onValueChange={setRole}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="patient" id="patient" />
                  <Label
                    htmlFor="patient"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <User size={16} />
                    Patient
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dentist" id="dentist" />
                  <Label
                    htmlFor="dentist"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Stethoscope size={16} />
                    Dentiste
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Erreur générale */}
            {errors.general && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {errors.general}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError("email");
                  }}
                  className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError("password");
                  }}
                  className={`pl-10 ${errors.password ? "border-red-500" : ""}`}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearError("confirmPassword");
                  }}
                  className={`pl-10 ${
                    errors.confirmPassword ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Jean"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearError("firstName");
                  }}
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  placeholder="Dupont"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearError("lastName");
                  }}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone (optionnel)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+33 1 23 45 67 89"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Champs spécifiques Patient */}
            {role === "patient" && (
              <div className="space-y-2">
                <Label htmlFor="birthDate">Date de naissance (optionnel)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Champs spécifiques Dentiste */}
            {role === "dentist" && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 flex items-center gap-2">
                  <Building size={16} />
                  Informations du cabinet
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="practiceName">Nom du cabinet</Label>
                  <Input
                    id="practiceName"
                    placeholder="Cabinet Dentaire Dr. Dupont"
                    value={practiceName}
                    onChange={(e) => {
                      setPracticeName(e.target.value);
                      clearError("practiceName");
                    }}
                    className={errors.practiceName ? "border-red-500" : ""}
                  />
                  {errors.practiceName && (
                    <p className="text-sm text-red-600">
                      {errors.practiceName}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bouton de soumission */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner />
                  Inscription en cours...
                </div>
              ) : (
                "Créer mon compte"
              )}
            </Button>

            {/* Lien vers login */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/login")}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Se connecter
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
