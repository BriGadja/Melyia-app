import { Button } from "../../shared/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[hsl(221,83%,53%)] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Page non trouvée</h2>
        <p className="text-muted-foreground mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Button 
          onClick={() => setLocation("/")}
          className="bg-[hsl(221,83%,53%)] text-white hover:bg-[hsl(221,83%,48%)]"
        >
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
}