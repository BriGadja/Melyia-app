import { useState } from "react";
import { Button } from "../shared/components/ui/button";
import { Card, CardContent } from "../shared/components/ui/card";
import { WaitlistForm } from "../shared/components/waitlist-form";
import {
  MessageCircle,
  FileText,
  Calendar,
  BarChart3,
  Shield,
  Zap,
  Clock,
  Euro,
  Heart,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Globe,
  Smartphone
} from "lucide-react";

export default function Home() {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleWaitlistSuccess = () => {
    setIsSubmitted(true);
    setTimeout(() => {
      setShowWaitlist(false);
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Melyia</h1>
          </div>
          <Button 
            onClick={() => setShowWaitlist(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Rejoindre la liste d'attente
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            L'avenir des soins dentaires
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              commence ici
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Révolutionnez votre pratique dentaire avec notre plateforme intelligente. 
            Gestion simplifiée, diagnostic assisté par IA, et expérience patient optimisée.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setShowWaitlist(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-4"
            >
              Commencer l'essai gratuit
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Voir la démo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-gray-900 mb-4">
            Pourquoi choisir Melyia ?
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Une solution complète pensée par et pour les professionnels dentaires
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white">
          <h3 className="text-4xl font-bold mb-4">
            Prêt à transformer votre pratique ?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez les centaines de dentistes qui ont déjà choisi Melyia
          </p>
          <Button 
            size="lg" 
            onClick={() => setShowWaitlist(true)}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
          >
            Commencer maintenant
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Waitlist Modal */}
      {showWaitlist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <WaitlistForm onSuccess={handleWaitlistSuccess} />
            <Button 
              variant="ghost" 
              onClick={() => setShowWaitlist(false)}
              className="w-full mt-4"
            >
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const features = [
  {
    icon: MessageCircle,
    title: "Communication Patient",
    description: "Interface moderne pour échanger avec vos patients et programmer leurs rendez-vous"
  },
  {
    icon: FileText,
    title: "Dossiers Numériques",
    description: "Gestion complète des dossiers patients avec historique détaillé et documents"
  },
  {
    icon: Calendar,
    title: "Planning Intelligent",
    description: "Optimisation automatique de votre agenda et gestion des créneaux disponibles"
  },
  {
    icon: BarChart3,
    title: "Tableau de Bord",
    description: "Suivi en temps réel de votre activité avec KPIs et analyses personnalisées"
  },
  {
    icon: Shield,
    title: "Sécurité HDS",
    description: "Conformité totale aux normes de sécurité des données de santé"
  },
  {
    icon: Zap,
    title: "Performance",
    description: "Interface rapide et intuitive pour une utilisation quotidienne fluide"
  }
];