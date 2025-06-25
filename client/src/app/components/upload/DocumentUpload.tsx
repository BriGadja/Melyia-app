import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as Progress from "@radix-ui/react-progress";
import * as Select from "@radix-ui/react-select";
import {
  CheckIcon,
  ChevronDownIcon,
  Cross2Icon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/auth-context";
import { PatientCreateModal } from "./PatientCreateModal";

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  documentsCount: number;
  registrationDate: string;
}

interface ApiResponse {
  success: boolean;
  patients: Patient[];
}

interface FilePreview {
  file: File;
  preview?: string; // Pour images
  size: string; // "2.5 MB"
  type: string; // "PDF Document"
  status: "pending" | "uploading" | "success" | "error";
  progress?: number; // Pourcentage individuel
}

interface UploadProgress {
  fileIndex: number;
  fileName: string;
  loaded: number;
  total: number;
  percentage: number;
}

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

const DOCUMENT_TYPES = [
  { value: "plan_traitement", label: "Plan de traitement" },
  { value: "note_operation", label: "Note d'opération" },
  { value: "remarque_patient", label: "Remarque patient" },
  { value: "protocole_soin", label: "Protocole de soin" },
  { value: "radiographie", label: "Radiographie" },
  { value: "autre", label: "Autre" },
] as const;

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

export const DocumentUpload = ({ onUploadComplete }: DocumentUploadProps) => {
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [currentUpload, setCurrentUpload] = useState<UploadProgress | null>(
    null
  );
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { token } = useAuth();

  // Configuration d'axios avec le token - utilise le proxy Vite en dev
  const api = axios.create({
    baseURL: import.meta.env.DEV ? "/api" : "https://app-dev.melyia.com/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const {
    data: patients = [],
    isLoading,
    isError,
    error: queryError,
    refetch: refetchPatients,
  } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse>("/patients");
        console.log("API Response:", response.data); // Debug log

        if (!response.data.success) {
          throw new Error("Erreur lors de la récupération des patients");
        }

        return response.data.patients;
      } catch (err) {
        console.error("Erreur API patients:", err);
        throw err;
      }
    },
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileType = (file: File): string => {
    const mimeType = file.type;
    if (mimeType === "application/pdf") return "PDF Document";
    if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
      return "Word Document";
    if (mimeType === "text/plain") return "Text Document";
    if (mimeType.startsWith("image/")) return "Image";
    return "Document";
  };

  const createFilePreview = async (file: File): Promise<FilePreview> => {
    let preview: string | undefined;

    // Créer preview pour les images
    if (file.type.startsWith("image/")) {
      preview = URL.createObjectURL(file);
    }

    return {
      file,
      preview,
      size: formatFileSize(file.size),
      type: getFileType(file),
      status: "pending",
    };
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (filePreviews.length + acceptedFiles.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} fichiers autorisés`);
        return;
      }

      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          setError(
            `Le fichier ${file.name} dépasse la taille maximale de 10MB`
          );
          return false;
        }
        return true;
      });

      // Créer les previews pour chaque fichier
      const newPreviews = await Promise.all(
        validFiles.map((file) => createFilePreview(file))
      );

      setFilePreviews((prev) => [...prev, ...newPreviews]);
    },
    [filePreviews]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
  });

  const handleUpload = async () => {
    if (!selectedType || !selectedPatient || !title) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (filePreviews.length === 0) {
      setError("Veuillez sélectionner au moins un fichier");
      return;
    }

    const formData = new FormData();
    filePreviews.forEach((filePreview) => {
      formData.append("documents", filePreview.file);
    });
    formData.append("type", selectedType);
    formData.append("patientId", selectedPatient);
    formData.append("title", title);

    try {
      setError(null);

      // Mettre à jour le statut des fichiers
      setFilePreviews((prev) =>
        prev.map((fp) => ({ ...fp, status: "uploading" as const }))
      );

      await api.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setGlobalProgress(progress);

          if (filePreviews.length > 0) {
            setCurrentUpload({
              fileIndex: 0,
              fileName: filePreviews[0].file.name,
              loaded: progressEvent.loaded || 0,
              total: progressEvent.total || 0,
              percentage: progress,
            });
          }
        },
      });

      // Succès
      setFilePreviews((prev) =>
        prev.map((fp) => ({ ...fp, status: "success" as const }))
      );

      // Nettoyer après succès
      setTimeout(() => {
        setFilePreviews([]);
        setGlobalProgress(0);
        setCurrentUpload(null);
        setTitle("");
        onUploadComplete?.();
      }, 1000);
    } catch (err) {
      // Erreur
      setFilePreviews((prev) =>
        prev.map((fp) => ({ ...fp, status: "error" as const }))
      );
      setError("Erreur lors de l'upload des fichiers");
      console.error("Erreur upload:", err);
    }
  };

  const removeFile = (index: number) => {
    setFilePreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Nettoyer les URLs d'objet pour éviter les fuites mémoire
      const removedPreview = prev[index];
      if (removedPreview?.preview) {
        URL.revokeObjectURL(removedPreview.preview);
      }
      return newPreviews;
    });
  };

  const handlePatientCreated = async (patientId: number) => {
    console.log("🎯 Patient créé avec ID:", patientId);

    // Rafraîchir la liste des patients
    await refetchPatients();

    // Sélectionner automatiquement le nouveau patient
    setSelectedPatient(patientId.toString());

    console.log("✅ Patient sélectionné automatiquement:", patientId);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Upload de documents
      </h2>

      <div className="space-y-6">
        {/* Type de document */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de document *
          </label>
          <Select.Root value={selectedType} onValueChange={setSelectedType}>
            <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 border rounded-md">
              <Select.Value placeholder="Sélectionner un type" />
              <Select.Icon>
                <ChevronDownIcon />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white rounded-md shadow-lg">
                <Select.Viewport className="p-2">
                  {DOCUMENT_TYPES.map((type) => (
                    <Select.Item
                      key={type.value}
                      value={type.value}
                      className="flex items-center px-2 py-1 rounded hover:bg-gray-100"
                    >
                      <Select.ItemText>{type.label}</Select.ItemText>
                      <Select.ItemIndicator>
                        <CheckIcon />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* Patient */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient *
          </label>
          <Select.Root
            value={selectedPatient}
            onValueChange={setSelectedPatient}
          >
            <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 border rounded-md">
              <Select.Value placeholder="Sélectionner un patient" />
              <Select.Icon>
                <ChevronDownIcon />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white rounded-md shadow-lg">
                <Select.Viewport className="p-2">
                  {/* Bouton Créer nouveau patient */}
                  <div className="border-b border-gray-200 mb-2 pb-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowCreateModal(true);
                      }}
                      className="w-full flex items-center px-2 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Créer nouveau patient
                    </button>
                  </div>

                  {/* Liste des patients existants */}
                  {isLoading ? (
                    <div className="px-2 py-1 text-sm text-gray-500">
                      Chargement des patients...
                    </div>
                  ) : isError ? (
                    <div className="px-2 py-1 text-sm text-red-500">
                      Erreur lors du chargement des patients
                    </div>
                  ) : Array.isArray(patients) && patients.length > 0 ? (
                    patients.map((patient) => (
                      <Select.Item
                        key={patient.id}
                        value={patient.id.toString()}
                        className="flex items-center px-2 py-1 rounded hover:bg-gray-100"
                      >
                        <Select.ItemText>{`${patient.firstName} ${patient.lastName}`}</Select.ItemText>
                        <Select.ItemIndicator>
                          <CheckIcon />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-sm text-gray-500">
                      Aucun patient trouvé
                    </div>
                  )}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Titre du document"
          />
        </div>

        {/* Zone de drop */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400"
            }`}
        >
          <input {...getInputProps()} />
          <p className="text-gray-600">
            {isDragActive
              ? "Déposez les fichiers ici..."
              : "Glissez-déposez des fichiers ici, ou cliquez pour sélectionner"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            PDF, DOCX, TXT, JPG, PNG (max 10MB par fichier)
          </p>
        </div>

        {/* Preview des fichiers avancé */}
        {filePreviews.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              Fichiers sélectionnés ({filePreviews.length})
            </h3>
            <div className="space-y-2">
              {filePreviews.map((filePreview, index) => (
                <div
                  key={index}
                  className={`flex items-center p-3 rounded-lg border transition-colors ${
                    filePreview.status === "success"
                      ? "bg-green-50 border-green-200"
                      : filePreview.status === "error"
                      ? "bg-red-50 border-red-200"
                      : filePreview.status === "uploading"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  {/* Preview image si disponible */}
                  {filePreview.preview && (
                    <img
                      src={filePreview.preview}
                      alt={filePreview.file.name}
                      className="w-12 h-12 object-cover rounded mr-3"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {filePreview.file.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{filePreview.type}</span>
                      <span>•</span>
                      <span>{filePreview.size}</span>
                      {filePreview.status === "uploading" &&
                        filePreview.progress && (
                          <>
                            <span>•</span>
                            <span>{filePreview.progress}%</span>
                          </>
                        )}
                    </div>
                  </div>

                  {/* Indicateur de statut */}
                  <div className="flex items-center space-x-2">
                    {filePreview.status === "uploading" && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {filePreview.status === "success" && (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckIcon className="w-2 h-2 text-white" />
                      </div>
                    )}
                    {filePreview.status === "error" && (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <Cross2Icon className="w-2 h-2 text-white" />
                      </div>
                    )}
                    {filePreview.status === "pending" && (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Cross2Icon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barre de progression globale */}
        {globalProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Progression globale
              </span>
              <span className="text-sm text-gray-600">{globalProgress}%</span>
            </div>
            <Progress.Root className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <Progress.Indicator
                className="h-full w-full bg-blue-500 transition-transform"
                style={{ transform: `translateX(-${100 - globalProgress}%)` }}
              />
            </Progress.Root>
            {currentUpload && (
              <p className="text-xs text-gray-500 text-center">
                Upload: {currentUpload.fileName} ({currentUpload.percentage}%)
              </p>
            )}
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Bouton d'upload */}
        <button
          onClick={handleUpload}
          disabled={filePreviews.length === 0 || globalProgress > 0}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {globalProgress > 0
            ? `Upload en cours... ${globalProgress}%`
            : `Uploader ${filePreviews.length} fichier${
                filePreviews.length > 1 ? "s" : ""
              }`}
        </button>
      </div>

      {/* Modal création patient */}
      <PatientCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPatientCreated={handlePatientCreated}
      />
    </div>
  );
};
