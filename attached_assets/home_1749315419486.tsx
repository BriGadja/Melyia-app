import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { WaitlistForm } from "@/components/waitlist-form";
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
  Star,
  Rocket,
  Play,
  Gift,
  Menu,
  X,
  Construction,
  Bell,
  ClipboardList,
} from "lucide-react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-background/95 backdrop-blur-sm fixed w-full top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-medical rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-xl font-bold text-medical-blue">Melyia</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("fonctionnalites")}
                className="text-muted-foreground hover:text-medical-blue transition-colors"
              >
                Fonctionnalités
              </button>
              <button
                onClick={() => scrollToSection("avantages")}
                className="text-muted-foreground hover:text-medical-blue transition-colors"
              >
                Avantages
              </button>
              <button
                onClick={() => scrollToSection("tarifs")}
                className="text-muted-foreground hover:text-medical-blue transition-colors"
              >
                Tarifs
              </button>
              <Button 
                onClick={openModal}
                className="bg-medical-blue text-white hover:bg-medical-blue/90 transition-all transform hover:scale-105"
              >
                Rejoindre la Liste d'Attente
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button
                  onClick={() => scrollToSection("fonctionnalites")}
                  className="block px-3 py-2 text-muted-foreground hover:text-medical-blue transition-colors w-full text-left"
                >
                  Fonctionnalités
                </button>
                <button
                  onClick={() => scrollToSection("avantages")}
                  className="block px-3 py-2 text-muted-foreground hover:text-medical-blue transition-colors w-full text-left"
                >
                  Avantages
                </button>
                <button
                  onClick={() => scrollToSection("tarifs")}
                  className="block px-3 py-2 text-muted-foreground hover:text-medical-blue transition-colors w-full text-left"
                >
                  Tarifs
                </button>
                <Button 
                  onClick={openModal}
                  className="w-full mt-2 bg-medical-blue text-white hover:bg-medical-blue/90 text-sm leading-tight py-3"
                >
                  <div className="text-center">
                    <div>Rejoindre la</div>
                    <div>Liste d'Attente</div>
                  </div>
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  L'Assistant IA qui
                  <span className="text-medical-blue"> Révolutionne </span>
                  votre Cabinet Dentaire
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Melyia automatise vos devis, optimise vos rendez-vous et améliore l'expérience patient 
                  grâce à l'intelligence artificielle. Rejoignez les cabinets dentaires qui font confiance à l'innovation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={openModal}
                  className="bg-medical-blue text-white px-8 py-4 rounded-xl font-semibold hover:bg-medical-blue/90 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  Rejoindre la Liste d'Attente
                </Button>
                <Button 
                  variant="outline"
                  className="border-2 border-medical-blue text-medical-blue px-8 py-4 rounded-xl font-semibold hover:bg-medical-blue hover:text-white transition-all"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Voir la Démo
                </Button>
              </div>

              <div className="flex items-center justify-center pt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  <div className="text-amber-800 text-sm font-medium">
                    🚧 Produit en cours de développement
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl shadow-2xl overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="Cabinet dentaire moderne" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Floating cards with animations */}
                <Card className="absolute bottom-4 left-4 shadow-lg border max-w-[180px] animate-bounce-slow bg-white">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-mint-green rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs">RDV Automatisés</div>
                        <div className="text-xs text-muted-foreground">Planification intelligente</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="absolute top-4 right-4 shadow-lg border max-w-[180px] animate-float bg-white">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-light-blue rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs">Devis Instantanés</div>
                        <div className="text-xs text-muted-foreground">Création rapide</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="absolute top-4 left-4 shadow-lg border max-w-[180px] animate-pulse-slow bg-white">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-success-green rounded-full flex items-center justify-center">
                        <Bell className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs">Rappels Post-Op</div>
                        <div className="text-xs text-muted-foreground">Suivi patient</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="absolute bottom-1/3 right-2 shadow-lg border max-w-[180px] animate-slide bg-white">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center">
                        <ClipboardList className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs">Plans de Traitement</div>
                        <div className="text-xs text-muted-foreground">Personnalisation facile</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Fonctionnalités Conçues pour les 
              <span className="text-medical-blue"> Professionnels Dentaires</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez comment Melyia transforme la gestion de votre cabinet avec des outils intelligents et intuitifs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-medical-blue rounded-xl flex items-center justify-center mb-6">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-foreground">Assistant IA Conversationnel</h3>
                  <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                    <Construction className="h-3 w-3 mr-1" />
                    En développement
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Chatbot intelligent qui comprend les demandes patients et fournit des réponses précises 24h/24.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Réponses personnalisées
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Apprentissage continu
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Support multilingue
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-mint-green rounded-xl flex items-center justify-center mb-6">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-foreground">Génération de Devis Automatique</h3>
                  <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                    <Construction className="h-3 w-3 mr-1" />
                    En développement
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Créez des devis précis et professionnels en quelques clics basés sur vos tarifs personnalisés.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Templates personnalisables
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Calculs automatiques
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Export PDF/Email
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-light-blue rounded-xl flex items-center justify-center mb-6">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-foreground">Gestion Intelligente des RDV</h3>
                  <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                    <Construction className="h-3 w-3 mr-1" />
                    En développement
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Optimisez votre planning avec un système de réservation intelligent et automatisé.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Réservation en ligne
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Rappels automatiques
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Gestion des annulations
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-medical-blue to-light-blue rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-foreground">Analytics & Reporting</h3>
                  <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                    <Construction className="h-3 w-3 mr-1" />
                    En développement
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Analysez les performances de votre cabinet avec des rapports détaillés et actionables.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Tableaux de bord
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Métriques clés
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Rapports personnalisés
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-success-green rounded-xl flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-foreground">Sécurité & Conformité RGPD</h3>
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                    Disponible
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Protection des données patients avec chiffrement de niveau médical et conformité totale.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Chiffrement AES-256
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Conformité RGPD
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Audits sécurité
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{animationDelay: '1s'}}>
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-light-blue to-mint-green rounded-xl flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-foreground">Intégrations Natives</h3>
                  <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                    <Construction className="h-3 w-3 mr-1" />
                    En développement
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Connectez Melyia à vos outils existants pour une expérience unifiée et fluide.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Logiciels dentaires
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Systèmes de paiement
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-2" />
                    Outils marketing
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="avantages" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Dentiste professionnel utilisant la technologie" 
                className="rounded-2xl shadow-xl w-full"
                loading="lazy"
              />
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  Transformez votre Cabinet en 
                  <span className="text-medical-blue"> Cabinet du Futur</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Melyia vous permet de vous concentrer sur ce qui compte vraiment : soigner vos patients. 
                  Laissez l'IA gérer l'administratif.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-mint-green rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Gagnez 3h par jour</h3>
                    <p className="text-muted-foreground">
                      Automatisez les tâches répétitives et concentrez-vous sur vos patients. 
                      Plus de temps pour ce qui compte vraiment.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-light-blue rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <Euro className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Augmentez votre CA de 25%</h3>
                    <p className="text-muted-foreground">
                      Optimisez vos rendez-vous, réduisez les no-shows et améliorez la satisfaction patient 
                      pour booster votre chiffre d'affaires.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-medical-blue rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Améliorez l'expérience patient</h3>
                    <p className="text-muted-foreground">
                      Réponses instantanées, devis transparents et rendez-vous simplifiés. 
                      Vos patients apprécieront la différence.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={openModal}
                className="bg-medical-blue text-white px-8 py-4 rounded-xl font-semibold hover:bg-medical-blue/90 transition-all transform hover:scale-105 shadow-lg"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Commencer Maintenant
              </Button>
            </div>
          </div>
        </div>
      </section>



      {/* Pricing Preview Section */}
      <section id="tarifs" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            Tarification Simple et 
            <span className="text-medical-blue"> Transparente</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Choisissez la formule qui correspond à la taille de votre cabinet
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-6 py-4 mb-12">
            <div className="text-amber-800 text-center">
              <strong>Tarifs en cours d'élaboration</strong> - Rejoignez la liste d'attente pour être informé en priorité
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-foreground mb-4">Starter</h3>
                  <div className="text-3xl font-bold text-medical-blue mb-2">
                    Bientôt disponible
                  </div>
                  <p className="text-muted-foreground">Pour les petits cabinets</p>
                </div>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    Accès au chatbot IA
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    Réponses automatisées
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    Interface intuitive
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    Support email
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-medical-blue text-white relative transform scale-105 shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-mint-green px-4 py-2 rounded-full text-sm font-semibold">
                Le Plus Populaire
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-4">Professional</h3>
                  <div className="text-3xl font-bold mb-2">Bientôt disponible</div>
                  <p className="opacity-75">Pour la plupart des cabinets</p>
                </div>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    Toutes les fonctions Starter
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    Génération de devis
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    Gestion RDV automatisée
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    Analytics avancées
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    Support prioritaire
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-foreground mb-4">Enterprise</h3>
                  <div className="text-3xl font-bold text-medical-blue mb-2">
                    Sur mesure
                  </div>
                  <p className="text-muted-foreground">Pour les grandes cliniques</p>
                </div>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    Toutes les fonctions Pro
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    Multi-cabinets
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    IA personnalisée
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    API & intégrations custom
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-mint-green mr-3" />
                    Tarification négociée
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12">
            <Button 
              onClick={openModal}
              className="bg-medical-blue text-white px-8 py-4 rounded-xl font-semibold hover:bg-medical-blue/90 transition-all transform hover:scale-105 shadow-lg text-sm md:text-base lg:text-lg"
            >
              <Star className="mr-2 h-5 w-5" />
              Offre de lancement -50%
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              ✨ Les 15 premiers inscrits bénéficient de 50% de réduction à vie
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 gradient-medical relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Prêt à Révolutionner votre Cabinet Dentaire ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Soyez parmi les premiers à découvrir l'avenir de la gestion dentaire avec l'IA.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={openModal}
              className="bg-white text-medical-blue px-12 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg text-lg"
            >
              <Rocket className="mr-2 h-5 w-5" />
              Rejoindre la Liste d'Attente
            </Button>
            <div className="text-center">
              <div className="text-sm text-blue-100">Offre de lancement limitée</div>
              <div className="text-xs text-blue-200 mt-1">Plus que 15 places disponibles</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-grey text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 gradient-medical rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-xl font-bold text-white">Melyia</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                L'assistant IA qui révolutionne la gestion des cabinets dentaires. 
                Automatisez, optimisez, excellez.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-medical-blue rounded-lg flex items-center justify-center hover:bg-medical-blue/80 transition-colors">
                  <span className="text-white text-sm">Li</span>
                </a>
                <a href="#" className="w-10 h-10 bg-medical-blue rounded-lg flex items-center justify-center hover:bg-medical-blue/80 transition-colors">
                  <span className="text-white text-sm">Tw</span>
                </a>
                <a href="#" className="w-10 h-10 bg-medical-blue rounded-lg flex items-center justify-center hover:bg-medical-blue/80 transition-colors">
                  <span className="text-white text-sm">Fb</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-white">Produit</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button onClick={() => scrollToSection("fonctionnalites")} className="hover:text-white transition-colors">Fonctionnalités</button></li>
                <li><button onClick={() => scrollToSection("tarifs")} className="hover:text-white transition-colors">Tarification</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Intégrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sécurité</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-white">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Formation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Melyia. Tous droits réservés.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
              <a href="#" className="hover:text-white transition-colors">CGU</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Rejoindre la Liste d'Attente">
        <WaitlistForm onSuccess={closeModal} />
      </Modal>
    </div>
  );
}