import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth-context";

// ✅ Interface pour les patients
interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  birthDate?: string;
}

interface PatientSelectorProps {
  onPatientSelect: (patientId: number | null) => void;
  selectedPatientId: number | null;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({
  onPatientSelect,
  selectedPatientId,
}) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Récupération des patients du dentiste
  useEffect(() => {
    const fetchPatients = async () => {
      if (!user || user.role === "patient") {
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("auth_token");

        // ✅ NOUVEAU : API différente pour admin vs dentiste
        const apiUrl = import.meta.env.DEV
          ? user.role === "admin"
            ? "/api/admin/users?role=patient"
            : "/api/patients"
          : user.role === "admin"
          ? "https://app-dev.melyia.com/api/admin/users?role=patient"
          : "https://app-dev.melyia.com/api/patients";

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ [SELECTOR] Patients récupérés:", data);

        // ✅ NOUVEAU : Adapter format réponse selon API
        let patientsList = [];
        if (user.role === "admin") {
          // API admin retourne data.users
          patientsList = data.users || [];
        } else {
          // API dentiste retourne data.patients
          patientsList = data.patients || [];
        }

        setPatients(patientsList);
        setError(null);
      } catch (err: any) {
        console.error("❌ [SELECTOR] Erreur patients:", err);
        setError(err.message || "Erreur de récupération des patients");
        setPatients([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [user]);

  // ✅ Gestion de la sélection
  const handleSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const patientId = event.target.value ? Number(event.target.value) : null;
    console.log("🎯 [SELECTOR] Patient sélectionné:", patientId);
    onPatientSelect(patientId);
  };

  // ✅ Patient connecté : pas de sélecteur nécessaire
  if (user?.role === "patient") {
    return (
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">👤</span>
          <span className="font-medium">
            Patient : {user.firstName} {user.lastName}
          </span>
        </div>
        <p className="text-sm text-blue-600 mt-1">
          Vos documents médicaux seront automatiquement utilisés
        </p>
      </div>
    );
  }

  // ✅ Dentiste/Admin : sélecteur de patients
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-600">🏥</span>
        <span className="font-medium text-gray-800">
          {user?.role === "admin"
            ? "Sélection patient (Admin)"
            : "Mes patients"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span>Chargement des patients...</span>
        </div>
      ) : error ? (
        <div className="text-red-600 bg-red-50 p-2 rounded border">
          ❌ {error}
        </div>
      ) : (
        <>
          <select
            value={selectedPatientId || ""}
            onChange={handleSelection}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">
              -- Sélectionner un patient pour le chatbot --
            </option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName} ({patient.email})
              </option>
            ))}
          </select>

          {patients.length === 0 && (
            <p className="text-gray-500 text-sm mt-2">Aucun patient trouvé</p>
          )}

          {selectedPatientId && (
            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
              <span className="text-green-700 text-sm">
                ✅ Patient sélectionné - Documents médicaux de{" "}
                {patients.find((p) => p.id === selectedPatientId)?.firstName}{" "}
                seront utilisés
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
