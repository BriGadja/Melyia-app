import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as Progress from "@radix-ui/react-progress";
import * as Select from "@radix-ui/react-select";
import * as Tabs from "@radix-ui/react-tabs";
import {
  CheckIcon,
  ChevronDownIcon,
  Cross2Icon,
  FileTextIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import axios from "axios";
import { useAuth } from "../../context/auth-context";
import { DocumentUpload } from "./DocumentUpload";

interface AdminDocumentUploadProps {
  onUploadComplete?: () => void;
}

interface FilePreview {
  file: File;
  preview?: string;
  size: string;
  type: string;
  status: "pending" | "uploading" | "success" | "error";
  progress?: number;
}

interface UploadProgress {
  fileIndex: number;
  fileName: string;
  loaded: number;
  total: number;
  percentage: number;
}

enum UploadMode {
  GENERAL = "general",
  PERSONAL = "personal",
}

const GENERAL_CATEGORIES = [
  { value: "protocole", label: "Protocoles de soin" },
  { value: "terminologie", label: "Terminologie médicale" },
  { value: "referentiel", label: "Référentiels" },
  { value: "formation", label: "Formation" },
  { value: "reglementation", label: "Réglementation" },
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
const MAX_FILES = 10; // Plus de fichiers pour admin

const GeneralDocumentUpload: React.FC<{
  onUploadComplete?: () => void;
}> = ({ onUploadComplete }) => {
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [currentUpload, setCurrentUpload] = useState<UploadProgress | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const api = axios.create({
    baseURL: import.meta.env.DEV ? "/api" : "https://app-dev.melyia.com/api",
    headers: {
      Authorization: `Bearer ${token}`,
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

      const newPreviews = await Promise.all(
        validFiles.map((file) => createFilePreview(file))
      );

      setFilePreviews((prev) => [...prev, ...newPreviews]);
      setError(null);
    },
    [filePreviews]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
  });

  const handleUpload = async () => {
    if (!selectedCategory || !title) {
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
    formData.append("category", selectedCategory);
    formData.append("title", title);
    formData.append("description", description);

    try {
      setError(null);

      setFilePreviews((prev) =>
        prev.map((fp) => ({ ...fp, status: "uploading" as const }))
      );

      await api.post("/admin/documents/upload", formData, {
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

      setFilePreviews((prev) =>
        prev.map((fp) => ({ ...fp, status: "success" as const }))
      );

      setTimeout(() => {
        setFilePreviews([]);
        setGlobalProgress(0);
        setCurrentUpload(null);
        setTitle("");
        setDescription("");
        onUploadComplete?.();
      }, 1000);
    } catch (err) {
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
      const removedPreview = prev[index];
      if (removedPreview?.preview) {
        URL.revokeObjectURL(removedPreview.preview);
      }
      return newPreviews;
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1 rounded-xl">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FileTextIcon className="w-5 h-5 mr-2" />
            Upload Documents Généraux - Base de Connaissances
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Ces documents seront accessibles à tous les utilisateurs pour
            enrichir la base de connaissances commune.
          </p>

          <div className="space-y-4">
            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <Select.Root
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 border rounded-md bg-white">
                  <Select.Value placeholder="Sélectionner une catégorie" />
                  <Select.Icon>
                    <ChevronDownIcon />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white rounded-md shadow-lg border z-50">
                    <Select.Viewport className="p-1">
                      {GENERAL_CATEGORIES.map((category) => (
                        <Select.Item
                          key={category.value}
                          value={category.value}
                          className="flex items-center px-3 py-2 rounded hover:bg-gray-100 cursor-pointer"
                        >
                          <Select.ItemText>{category.label}</Select.ItemText>
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

            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white"
                placeholder="Titre du document"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white resize-vertical"
                rows={3}
                placeholder="Description optionnelle du document"
              />
            </div>

            {/* Zone de drop */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? "border-blue-500 bg-blue-50 scale-105"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-2">
                <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="text-gray-600 font-medium">
                  {isDragActive
                    ? "Déposez les fichiers ici..."
                    : "Glissez-déposez des fichiers ici, ou cliquez pour sélectionner"}
                </p>
                <p className="text-sm text-gray-500">
                  PDF, DOCX, TXT, JPG, PNG (max 10MB par fichier, {MAX_FILES}{" "}
                  fichiers max)
                </p>
              </div>
            </div>

            {/* Preview des fichiers */}
            {filePreviews.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Fichiers sélectionnés ({filePreviews.length}/{MAX_FILES})
                </h4>
                <div className="grid gap-2">
                  {filePreviews.map((filePreview, index) => (
                    <div
                      key={index}
                      className={`flex items-center p-3 rounded-lg border transition-all duration-200 ${
                        filePreview.status === "success"
                          ? "bg-green-50 border-green-200"
                          : filePreview.status === "error"
                          ? "bg-red-50 border-red-200"
                          : filePreview.status === "uploading"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      {filePreview.preview && (
                        <img
                          src={filePreview.preview}
                          alt={filePreview.file.name}
                          className="w-10 h-10 object-cover rounded mr-3"
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
                        </div>
                      </div>

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
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
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

            {/* Barre de progression */}
            {globalProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Progression globale
                  </span>
                  <span className="text-sm text-gray-600">
                    {globalProgress}%
                  </span>
                </div>
                <Progress.Root className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                  <Progress.Indicator
                    className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-600 transition-transform duration-300"
                    style={{
                      transform: `translateX(-${100 - globalProgress}%)`,
                    }}
                  />
                </Progress.Root>
                {currentUpload && (
                  <p className="text-xs text-gray-500 text-center">
                    Upload: {currentUpload.fileName} ({currentUpload.percentage}
                    %)
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
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
            >
              {globalProgress > 0
                ? `Upload en cours... ${globalProgress}%`
                : `📚 Uploader ${filePreviews.length} document${
                    filePreviews.length > 1 ? "s" : ""
                  } général${filePreviews.length > 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PersonalDocumentUpload: React.FC<{
  onUploadComplete?: () => void;
}> = ({ onUploadComplete }) => {
  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-1 rounded-xl">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <PersonIcon className="w-5 h-5 mr-2" />
          Upload Documents Personnels - Dossiers Patients
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Ces documents seront associés à des patients spécifiques et
          accessibles selon les autorisations.
        </p>

        <DocumentUpload onUploadComplete={onUploadComplete} />
      </div>
    </div>
  );
};

export const AdminDocumentUpload: React.FC<AdminDocumentUploadProps> = ({
  onUploadComplete,
}) => {
  const [mode, setMode] = useState<UploadMode>(UploadMode.GENERAL);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            🎯 Gestion Documents - Interface Admin
          </h2>
          <p className="text-gray-600">
            Gérez l'upload de documents généraux et personnels avec une
            interface unifiée
          </p>
        </div>

        <Tabs.Root
          value={mode}
          onValueChange={(value) => setMode(value as UploadMode)}
        >
          <Tabs.List className="grid w-full grid-cols-2 mb-8 p-1 bg-gray-100 rounded-lg">
            <Tabs.Trigger
              value={UploadMode.GENERAL}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 text-gray-600 hover:text-gray-800"
            >
              <FileTextIcon className="w-4 h-4" />
              <span>📚 Documents Généraux</span>
            </Tabs.Trigger>
            <Tabs.Trigger
              value={UploadMode.PERSONAL}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 text-gray-600 hover:text-gray-800"
            >
              <PersonIcon className="w-4 h-4" />
              <span>👤 Documents Personnels</span>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value={UploadMode.GENERAL} className="mt-6">
            <GeneralDocumentUpload onUploadComplete={onUploadComplete} />
          </Tabs.Content>

          <Tabs.Content value={UploadMode.PERSONAL} className="mt-6">
            <PersonalDocumentUpload onUploadComplete={onUploadComplete} />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
};
