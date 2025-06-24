import React, { useState } from "react";
import { useAuth } from "../../context/auth-context";
import { DocumentUpload } from "../../components/upload/DocumentUpload";

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
import { Input } from "@shared/components/ui/input";
import { Avatar, AvatarFallback } from "@shared/components/ui/avatar";

// Composants notifications
import { NotificationIcon } from "@shared/components/notifications";

type ActiveSection = "patients" | "planning" | "documents";

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  lastVisit: string;
  nextAppointment?: string;
  status: "active" | "pending" | "inactive";
}

interface Appointment {
  id: number;
  patientName: string;
  time: string;
  duration: string;
  type: string;
  status: "confirmed" | "pending" | "cancelled";
}

interface Document {
  id: number;
  name: string;
  type: string;
  patient: string;
  date: string;
  size: string;
}

const DentistDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<ActiveSection>("patients");
  const [searchTerm, setSearchTerm] = useState("");

  // Données mockées pour les exemples
  const mockPatients: Patient[] = [
    {
      id: 1,
      name: "Marie Dupont",
      email: "marie@example.com",
      phone: "06 12 34 56 78",
      lastVisit: "2024-01-15",
      nextAppointment: "2024-02-10",
      status: "active",
    },
    {
      id: 2,
      name: "Jean Martin",
      email: "jean@example.com",
      phone: "06 98 76 54 32",
      lastVisit: "2024-01-10",
      status: "active",
    },
    {
      id: 3,
      name: "Sophie Bernard",
      email: "sophie@example.com",
      phone: "06 11 22 33 44",
      lastVisit: "2023-12-20",
      nextAppointment: "2024-02-05",
      status: "pending",
    },
    {
      id: 4,
      name: "Pierre Durand",
      email: "pierre@example.com",
      phone: "06 55 66 77 88",
      lastVisit: "2024-01-08",
      status: "active",
    },
    {
      id: 5,
      name: "Anne Moreau",
      email: "anne@example.com",
      phone: "06 44 33 22 11",
      lastVisit: "2023-11-15",
      status: "inactive",
    },
  ];

  const mockAppointments: Appointment[] = [
    {
      id: 1,
      patientName: "Marie Dupont",
      time: "09:00",
      duration: "1h",
      type: "Contrôle",
      status: "confirmed",
    },
    {
      id: 2,
      patientName: "Jean Martin",
      time: "10:30",
      duration: "45min",
      type: "Détartrage",
      status: "confirmed",
    },
    {
      id: 3,
      patientName: "Sophie Bernard",
      time: "14:00",
      duration: "1h30",
      type: "Soins",
      status: "pending",
    },
    {
      id: 4,
      patientName: "Pierre Durand",
      time: "15:45",
      duration: "30min",
      type: "Consultation",
      status: "confirmed",
    },
  ];

  const mockDocuments: Document[] = [
    {
      id: 1,
      name: "Radiographie_Marie.pdf",
      type: "PDF",
      patient: "Marie Dupont",
      date: "2024-01-15",
      size: "2.3 MB",
    },
    {
      id: 2,
      name: "Devis_Jean.docx",
      type: "DOCX",
      patient: "Jean Martin",
      date: "2024-01-10",
      size: "1.1 MB",
    },
    {
      id: 3,
      name: "Plan_traitement_Sophie.pdf",
      type: "PDF",
      patient: "Sophie Bernard",
      date: "2024-01-08",
      size: "3.4 MB",
    },
    {
      id: 4,
      name: "Photo_Pierre.jpg",
      type: "JPG",
      patient: "Pierre Durand",
      date: "2024-01-05",
      size: "5.2 MB",
    },
  ];

  const filteredPatients = mockPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDocuments = mockDocuments.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const menuItems = [
    {
      id: "patients" as ActiveSection,
      label: "Patients",
      icon: "👥",
      description: "Gestion patientèle",
      gradient: "from-blue-500 to-cyan-400",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    {
      id: "planning" as ActiveSection,
      label: "Planning",
      icon: "📅",
      description: "Rendez-vous",
      gradient: "from-emerald-500 to-teal-400",
      bgGradient: "from-emerald-50 to-teal-50",
    },
    {
      id: "documents" as ActiveSection,
      label: "Documents",
      icon: "📄",
      description: "Fichiers patients",
      gradient: "from-purple-500 to-pink-400",
      bgGradient: "from-purple-50 to-pink-50",
    },
  ];

  const activeMenuItem = menuItems.find((item) => item.id === activeSection);

  const renderPatientsSection = () => (
    <div className="h-full flex flex-col">
      {/* En-tête section avec gradient moderne */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 via-white to-cyan-50 backdrop-blur-sm p-8 border-b border-blue-100">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xl shadow-lg">
                👥
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Gestion des Patients
              </h2>
            </div>
            <p className="text-gray-600 ml-13">
              Consultez et gérez votre patientèle avec élégance
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <span className="mr-2">+</span>
            Nouveau Patient
          </Button>
        </div>
        <div className="mt-6">
          <div className="relative max-w-md">
            <Input
              placeholder="🔍 Rechercher un patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-3 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-md focus:shadow-lg focus:bg-white transition-all duration-300"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
        </div>
      </div>

      {/* Liste des patients avec design moderne */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="grid gap-4">
          {filteredPatients.map((patient, index) => (
            <Card
              key={patient.id}
              className="group hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm border-0 rounded-3xl overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar className="w-16 h-16 ring-4 ring-blue-100 group-hover:ring-blue-200 transition-all duration-300">
                        <AvatarFallback className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-semibold text-lg">
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-white ${
                          patient.status === "active"
                            ? "bg-green-400"
                            : patient.status === "pending"
                            ? "bg-yellow-400"
                            : "bg-gray-400"
                        }`}
                      ></div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-xl text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                        {patient.name}
                      </h3>
                      <p className="text-gray-600 font-medium">
                        {patient.email}
                      </p>
                      <p className="text-gray-500 text-sm">{patient.phone}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-3">
                    <Badge
                      variant={
                        patient.status === "active"
                          ? "default"
                          : patient.status === "pending"
                          ? "secondary"
                          : "outline"
                      }
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        patient.status === "active"
                          ? "bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg"
                          : patient.status === "pending"
                          ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg"
                          : "bg-gradient-to-r from-gray-400 to-slate-400 text-white shadow-lg"
                      }`}
                    >
                      {patient.status === "active"
                        ? "✨ Actif"
                        : patient.status === "pending"
                        ? "⏳ En attente"
                        : "💤 Inactif"}
                    </Badge>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Dernière visite</p>
                      <p className="font-semibold text-gray-700">
                        {patient.lastVisit}
                      </p>
                      {patient.nextAppointment && (
                        <>
                          <p className="text-sm text-blue-500 font-medium">
                            Prochain RDV
                          </p>
                          <p className="font-semibold text-blue-600">
                            {patient.nextAppointment}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPlanningSection = () => (
    <div className="h-full flex flex-col">
      {/* En-tête section avec gradient vert */}
      <div className="flex-shrink-0 bg-gradient-to-r from-emerald-50 via-white to-teal-50 backdrop-blur-sm p-8 border-b border-emerald-100">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xl shadow-lg">
                📅
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Planning du Jour
              </h2>
            </div>
            <p className="text-gray-600 ml-13">
              Aujourd'hui -{" "}
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <span className="mr-2">+</span>
            Nouveau RDV
          </Button>
        </div>
      </div>

      {/* Planning avec design moderne */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-emerald-50/30">
        <div className="grid gap-4">
          {mockAppointments.map((appointment, index) => (
            <Card
              key={appointment.id}
              className="group hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm border-0 rounded-3xl overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">
                            {appointment.time}
                          </div>
                          <div className="text-xs text-emerald-100">
                            {appointment.duration}
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                        {appointment.type === "Contrôle"
                          ? "🔍"
                          : appointment.type === "Détartrage"
                          ? "🦷"
                          : appointment.type === "Soins"
                          ? "⚕️"
                          : "💬"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-xl text-gray-800 group-hover:text-emerald-600 transition-colors duration-300">
                        {appointment.patientName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 font-medium">
                          {appointment.type}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">
                          {appointment.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        appointment.status === "confirmed"
                          ? "default"
                          : appointment.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        appointment.status === "confirmed"
                          ? "bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg"
                          : appointment.status === "pending"
                          ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg"
                          : "bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-lg"
                      }`}
                    >
                      {appointment.status === "confirmed"
                        ? "✅ Confirmé"
                        : appointment.status === "pending"
                        ? "⏳ En attente"
                        : "❌ Annulé"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDocumentsSection = () => (
    <div className="h-full flex flex-col">
      {/* En-tête section avec gradient violet */}
      <div className="flex-shrink-0 bg-gradient-to-r from-purple-50 via-white to-pink-50 backdrop-blur-sm p-8 border-b border-purple-100">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-400 flex items-center justify-center text-white text-xl shadow-lg">
                📄
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                Documents Patients
              </h2>
            </div>
            <p className="text-gray-600 ml-13">
              Gestion des fichiers et documents numériques
            </p>
          </div>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <span className="mr-2">+</span>
            Upload Document
          </Button>
        </div>
        <div className="mt-6">
          <div className="relative max-w-md">
            <Input
              placeholder="🔍 Rechercher un document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-3 rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-md focus:shadow-lg focus:bg-white transition-all duration-300"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
        </div>
      </div>

      {/* Documents avec design moderne */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-purple-50/30">
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-0">
            <DocumentUpload
              onUploadComplete={() => {
                console.log("Upload terminé");
              }}
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredDocuments.map((document, index) => (
            <Card
              key={document.id}
              className="group hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm border-0 rounded-3xl overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 ${
                          document.type === "PDF"
                            ? "bg-gradient-to-r from-red-400 to-pink-400"
                            : document.type === "DOCX"
                            ? "bg-gradient-to-r from-blue-400 to-cyan-400"
                            : "bg-gradient-to-r from-purple-400 to-pink-400"
                        }`}
                      >
                        <span className="text-white font-bold text-sm">
                          {document.type}
                        </span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                        {document.type === "PDF"
                          ? "📄"
                          : document.type === "DOCX"
                          ? "📝"
                          : "🖼️"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                        {document.name}
                      </h3>
                      <p className="text-gray-600 font-medium">
                        Patient: {document.patient}
                      </p>
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <span>📦 {document.size}</span>
                        <span>•</span>
                        <span>📅 {document.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-pink-400 text-white border-0 hover:from-purple-600 hover:to-pink-500 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      ⬇️ Télécharger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header moderne avec glassmorphism */}
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 z-10">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Melyia
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Espace Dentiste
                </p>
              </div>
              <Badge
                variant="secondary"
                className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-0 rounded-full"
              >
                Dr. {user?.lastName}
              </Badge>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <span className="text-gray-800 font-semibold">
                  {user?.firstName} {user?.lastName}
                </span>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              {/* Composant Notifications */}
              <NotificationIcon
                className="mx-2"
                pollInterval={30000}
                maxNotifications={50}
                onNavigate={(link) => {
                  // Navigation personnalisée pour l'application dentiste
                  if (link.startsWith("/")) {
                    window.location.href = link;
                  } else {
                    window.open(link, "_blank", "noopener,noreferrer");
                  }
                }}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="rounded-xl px-6 py-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-300"
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Corps principal avec sidebar moderne */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar navigation moderne */}
        <aside className="flex-shrink-0 w-80 bg-white/80 backdrop-blur-md border-r border-gray-200/50 shadow-xl">
          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Navigation
              </h3>
              <p className="text-gray-500 text-sm">
                Choisissez votre espace de travail
              </p>
            </div>
            <nav className="space-y-4">
              {menuItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSearchTerm("");
                  }}
                  className={`w-full text-left p-6 rounded-3xl transition-all duration-500 transform hover:scale-105 ${
                    activeSection === item.id
                      ? `bg-gradient-to-r ${item.bgGradient} border-2 border-white shadow-2xl scale-105`
                      : "hover:bg-gray-50 text-gray-700 shadow-md hover:shadow-lg"
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-all duration-300 ${
                        activeSection === item.id
                          ? `bg-gradient-to-r ${item.gradient} text-white shadow-xl`
                          : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`font-bold text-lg transition-colors duration-300 ${
                          activeSection === item.id
                            ? "text-gray-800"
                            : "text-gray-700"
                        }`}
                      >
                        {item.label}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {item.description}
                      </div>
                    </div>
                    {activeSection === item.id && (
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 shadow-lg animate-pulse"></div>
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Contenu principal avec animation */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full transition-all duration-700 ease-in-out">
            {activeSection === "patients" && renderPatientsSection()}
            {activeSection === "planning" && renderPlanningSection()}
            {activeSection === "documents" && renderDocumentsSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DentistDashboard;
