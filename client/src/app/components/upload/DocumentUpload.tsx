import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as Progress from "@radix-ui/react-progress";
import * as Select from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, Cross2Icon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/auth-context";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ApiResponse {
  success: boolean;
  patients: Patient[];
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
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Configuration d'axios avec le token
  const api = axios.create({
    baseURL: "https://app-dev.melyia.com/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const {
    data: patients = [],
    isLoading,
    isError,
    error: queryError,
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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > MAX_FILES) {
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

      setFiles((prev) => [...prev, ...validFiles]);
    },
    [files]
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

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("documents", file);
    });
    formData.append("type", selectedType);
    formData.append("patientId", selectedPatient);
    formData.append("title", title);

    try {
      setError(null);
      await api.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      setFiles([]);
      setUploadProgress(0);
      setTitle("");
      onUploadComplete?.();
    } catch (err) {
      setError("Erreur lors de l'upload des fichiers");
      console.error("Erreur upload:", err);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
                        value={patient.id}
                        className="flex items-center px-2 py-1 rounded hover:bg-gray-100"
                      >
                        <Select.ItemText>{`${patient.first_name} ${patient.last_name}`}</Select.ItemText>
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

        {/* Liste des fichiers */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span className="text-sm truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Cross2Icon />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Barre de progression */}
        {uploadProgress > 0 && (
          <div className="space-y-2">
            <Progress.Root className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <Progress.Indicator
                className="h-full w-full bg-blue-500 transition-transform"
                style={{ transform: `translateX(-${100 - uploadProgress}%)` }}
              />
            </Progress.Root>
            <p className="text-sm text-gray-600 text-center">
              {uploadProgress}%
            </p>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Bouton d'upload */}
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploadProgress > 0}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Uploader les documents
        </button>
      </div>
    </div>
  );
};
