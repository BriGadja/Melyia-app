import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/auth-context";

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
import { LoadingSpinner } from "@shared/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@shared/components/ui/alert";

// DEBUG VERSION v2 - Force rebuild with new hash
const AdminDashboard: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Configuration API
  const API_BASE_URL = import.meta.env.DEV
    ? "/api"
    : "https://app-dev.melyia.com/api";
  const token = localStorage.getItem("auth_token");

  // Test des routes admin
  useEffect(() => {
    const testAdminRoutes = async () => {
      try {
        setIsLoading(true);
        setError("");

        console.log("🔍 Test des routes admin...");
        console.log("Token:", token ? "présent" : "absent");
        console.log("User:", user);
        console.log("Is Admin:", isAdmin);

        const debugData: any = {
          token: token ? "présent" : "absent",
          user: user,
          isAdmin: isAdmin,
          apiBase: API_BASE_URL,
          tests: [],
        };

        // Test route stats
        try {
          const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          debugData.tests.push({
            route: "/admin/stats",
            status: response.status,
            success: response.ok,
            data: response.ok ? await response.json() : await response.text(),
          });
        } catch (err) {
          debugData.tests.push({
            route: "/admin/stats",
            error: err.message,
          });
        }

        // Test route users
        try {
          const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          debugData.tests.push({
            route: "/admin/users",
            status: response.status,
            success: response.ok,
            data: response.ok ? await response.json() : await response.text(),
          });
        } catch (err) {
          debugData.tests.push({
            route: "/admin/users",
            error: err.message,
          });
        }

        setDebugInfo(debugData);
      } catch (err) {
        console.error("Erreur test admin:", err);
        setError(`Erreur: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && user) {
      testAdminRoutes();
    }
  }, [token, user, isAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Melyia - Administration (Debug)
              </h1>
              <Badge
                variant="secondary"
                className="ml-3 bg-red-100 text-red-800"
              >
                Mode Debug
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Affichage d'erreur */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Informations de debug */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>🔍 Informations de Debug</CardTitle>
              <CardDescription>
                Diagnostic des routes et authentification admin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {debugInfo ? (
                <div className="space-y-4">
                  <div>
                    <strong>Token:</strong> {debugInfo.token}
                  </div>
                  <div>
                    <strong>Utilisateur:</strong>{" "}
                    {JSON.stringify(debugInfo.user, null, 2)}
                  </div>
                  <div>
                    <strong>Est Admin:</strong>{" "}
                    {debugInfo.isAdmin ? "Oui" : "Non"}
                  </div>
                  <div>
                    <strong>API Base:</strong> {debugInfo.apiBase}
                  </div>
                  <div>
                    <strong>Timestamp Build:</strong> {new Date().toISOString()}
                  </div>

                  <div>
                    <strong>Tests des routes:</strong>
                    <div className="mt-2 space-y-2">
                      {debugInfo.tests.map((test, index) => (
                        <div key={index} className="border p-2 rounded">
                          <div>
                            <strong>Route:</strong> {test.route}
                          </div>
                          {test.error ? (
                            <div className="text-red-600">
                              <strong>Erreur:</strong> {test.error}
                            </div>
                          ) : (
                            <>
                              <div>
                                <strong>Status:</strong> {test.status}
                              </div>
                              <div>
                                <strong>Succès:</strong>{" "}
                                {test.success ? "Oui" : "Non"}
                              </div>
                              <div>
                                <strong>Réponse:</strong>{" "}
                                <pre className="text-xs">
                                  {JSON.stringify(test.data, null, 2)}
                                </pre>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>Chargement des informations de debug...</div>
              )}
            </CardContent>
          </Card>

          {/* Message temporaire */}
          <Card>
            <CardHeader>
              <CardTitle>🚧 Dashboard Admin en Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Le dashboard admin est temporairement en mode debug pour
                identifier les problèmes de connexion aux APIs. Les informations
                ci-dessus permettront de diagnostiquer et corriger les erreurs.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
