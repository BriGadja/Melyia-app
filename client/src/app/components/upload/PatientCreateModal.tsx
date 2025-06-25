import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import axios from "axios";
import { useAuth } from "../../context/auth-context";

interface PatientCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: (patientId: number) => void;
}

interface CreatePatientRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  emergencyContact?: string;
}

export const PatientCreateModal = ({
  isOpen,
  onClose,
  onPatientCreated,
}: PatientCreateModalProps) => {
  const [formData, setFormData] = useState<CreatePatientRequest>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    emergencyContact: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Configuration d'axios avec le token - utilise le proxy Vite en dev
  const api = axios.create({
    baseURL: import.meta.env.DEV ? "/api" : "https://app-dev.melyia.com/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const handleInputChange = (
    field: keyof CreatePatientRequest,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      setError("L'email est obligatoire");
      return false;
    }
    if (!formData.firstName.trim()) {
      setError("Le prénom est obligatoire");
      return false;
    }
    if (!formData.lastName.trim()) {
      setError("Le nom est obligatoire");
      return false;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Format d'email invalide");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("🆕 Création nouveau patient:", formData);

      const response = await api.post("/patients", formData);

      if (response.data.success) {
        console.log("✅ Patient créé avec succès:", response.data.patientId);
        onPatientCreated(response.data.patientId);

        // Reset form
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          phone: "",
          emergencyContact: "",
        });

        onClose();
      } else {
        setError("Erreur lors de la création du patient");
      }
    } catch (err: any) {
      console.error("❌ Erreur création patient:", err);

      if (err.response?.status === 409) {
        setError("Cette adresse email est déjà utilisée");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Erreur lors de la création du patient");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        emergencyContact: "",
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-semibold text-gray-800">
                Créer un nouveau patient
              </Dialog.Title>
              <Dialog.Close
                asChild
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <button aria-label="Fermer">
                  <Cross2Icon className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="patient@example.com"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jean"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dupont"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="06 12 34 56 78"
                  disabled={isLoading}
                />
              </div>

              {/* Contact d'urgence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact d'urgence
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    handleInputChange("emergencyContact", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom et téléphone du contact"
                  disabled={isLoading}
                />
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{isLoading ? "Création..." : "Créer le patient"}</span>
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
