import React from "react";
import { Router, Route, Switch, Redirect } from "wouter";
import { AuthProvider, useAuth } from "./context/auth-context";

// Composant de chargement
import { LoadingSpinner } from "@shared/components/ui/loading-spinner";

// Pages d'authentification (publiques)
import LoginPage from "./pages/auth/login";
import Register from "./pages/auth/register";

// Dashboards par rôle
import DentistDashboard from "./pages/dentist/dashboard";
import PatientDashboard from "./pages/patient/dashboard";
import AdminDashboard from "./pages/admin/dashboard";

// Composant pour protéger les routes authentifiées
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ("dentist" | "patient" | "admin")[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Chargement en cours
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Non authentifié -> redirection login
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Vérification des rôles si spécifiés
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Redirect to="/unauthorized" />;
  }

  return <>{children}</>;
};

// Composant pour rediriger selon le rôle après login
const RoleBasedRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Redirection selon le rôle
  if (user?.role === "admin") {
    return <Redirect to="/admin/dashboard" />;
  } else if (user?.role === "dentist") {
    return <Redirect to="/dentist/dashboard" />;
  } else if (user?.role === "patient") {
    return <Redirect to="/patient/dashboard" />;
  }

  return <Redirect to="/login" />;
};

// Page 404 simplifiée
const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Page non trouvée
      </h2>
      <p className="text-gray-600 mb-6">
        La page que vous cherchez n'existe pas.
      </p>
      <button
        onClick={() => window.history.back()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
      >
        Retour
      </button>
    </div>
  </div>
);

// Page d'accès non autorisé
const UnauthorizedPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-red-300 mb-4">403</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Accès non autorisé
      </h2>
      <p className="text-gray-600 mb-6">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <button
        onClick={() => window.history.back()}
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
      >
        Retour
      </button>
    </div>
  </div>
);

// Composant principal du Router
const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Switch>
        {/* Routes publiques */}
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={Register} />

        {/* Routes admin protégées */}
        <Route path="/admin/dashboard">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        </Route>

        {/* Routes dentiste protégées */}
        <Route path="/dentist/dashboard">
          <ProtectedRoute allowedRoles={["dentist"]}>
            <DentistDashboard />
          </ProtectedRoute>
        </Route>

        {/* Routes patient protégées */}
        <Route path="/patient/dashboard">
          <ProtectedRoute allowedRoles={["patient"]}>
            <PatientDashboard />
          </ProtectedRoute>
        </Route>

        {/* Page d'accès non autorisé */}
        <Route path="/unauthorized" component={UnauthorizedPage} />

        {/* Route racine avec redirection selon rôle */}
        <Route path="/" component={RoleBasedRedirect} />

        {/* Page 404 pour toutes les autres routes */}
        <Route component={NotFoundPage} />
      </Switch>
    </Router>
  );
};

// Composant App principal avec Provider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
