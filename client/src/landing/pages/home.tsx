import { useState } from "react";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent } from "@shared/components/ui/card";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@shared/components/ui/modal";
import { WaitlistForm } from "../components/waitlist-form";
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
              <span className="text-xl font-bold" style={{ color: 'hsl(221, 83%, 53%)' }}>Melyia</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("fonctionnalites")}
                className="text-muted-foreground hover:text-[hsl(221,83%,53%)] transition-colors"
              >
                Fonctionnalités
              </button>
              <button
                onClick={() => scrollToSection("avantages")}
                className="text-muted-foreground hover:text-[hsl(221,83%,53%)] transition-colors"
              >
                Avantages
              </button>
              <button
                onClick={() => scrollToSection("tarifs")}
                className="text-muted-foreground hover:text-[hsl(221,83%,53%)] transition-colors"
              >
                Tarifs
              </button>
              <Button 
                onClick={() => window.open('https://app-dev.melyia.com/login', '_blank')}
                variant="outline"
                className="border-[hsl(221,83%,53%)] text-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,53%)] hover:text-white transition-all"
              >
                Se connecter
              </Button>
              <Button 
                onClick={openModal}
                className="bg-[hsl(221,83%,53%)] text-white hover:bg-[hsl(221,83%,48%)] transition-all transform hover:scale-105"
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
                  className="block px-3 py-2 text-muted-foreground hover:text-[hsl(221,83%,53%)] transition-colors w-full text-left"
                >
                  Fonctionnalités
                </button>
                <button
                  onClick={() => scrollToSection("avantages")}
                  className="block px-3 py-2 text-muted-foreground hover:text-[hsl(221,83%,53%)] transition-colors w-full text-left"
                >
                  Avantages
                </button>
                <button
                  onClick={() => scrollToSection("tarifs")}
                  className="block px-3 py-2 text-muted-foreground hover:text-[hsl(221,83%,53%)] transition-colors w-full text-left"
                >
                  Tarifs
                </button>
                <Button 
                  onClick={() => window.open('https://app-dev.melyia.com/login', '_blank')}
                  variant="outline"
                  className="w-full mt-2 border-[hsl(221,83%,53%)] text-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,53%)] hover:text-white transition-all"
                >
                  Se connecter
                </Button>
                <Button 
                  onClick={openModal}
                  className="w-full mt-2 bg-[hsl(221,83%,53%)] text-white hover:bg-[hsl(221,83%,48%)] text-sm leading-tight py-3"
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
                  <span className="text-[hsl(221,83%,53%)]"> Révolutionne </span>
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
                  className="bg-[hsl(221,83%,53%)] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[hsl(221,83%,48%)] transition-all transform hover:scale-105 shadow-lg"
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  Rejoindre la Liste d'Attente
                </Button>
                <Button 
                  variant="outline"
                  className="border-2 border-[hsl(221,83%,53%)] text-[hsl(221,83%,53%)] px-8 py-4 rounded-xl font-semibold hover:bg-[hsl(221,83%,53%)] hover:text-white transition-all"
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
                      <div className="w-8 h-8 bg-[hsl(142,71%,45%)] rounded-full flex items-center justify-center">
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
                      <div className="w-8 h-8 bg-[hsl(213,94%,68%)] rounded-full flex items-center justify-center">
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
                      <div className="w-8 h-8 bg-[hsl(142,76%,36%)] rounded-full flex items-center justify-center">
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
                      <div className="w-8 h-8 bg-[hsl(221,83%,53%)] rounded-full flex items-center justify-center">
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
              <span className="text-[hsl(221,83%,53%)]"> Professionnels Dentaires</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez comment Melyia transforme la gestion de votre cabinet avec des outils intelligents et intuitifs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-[hsl(221,83%,53%)] rounded-xl flex items-center justify-center mb-6">
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
                    <CheckCircle className="h-4 w-4 text-[hsl(142,71%,45%)] mr-2" />
                    Réponses personnalisées
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[hsl(142,71%,45%)] mr-2" />
                    Apprentissage continu
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-[hsl(142,71%,45%)] rounded-xl flex items-center justify-center mb-6">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Génération de Devis Automatique</h3>
                <p className="text-muted-foreground mb-4">
                  Créez des devis personnalisés en quelques clics grâce à notre système intelligent de tarification.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[hsl(142,71%,45%)] mr-2" />
                    Templates personnalisables
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[hsl(142,71%,45%)] mr-2" />
                    Calcul automatique des tarifs
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Gestion Intelligente des RDV</h3>
                <p className="text-muted-foreground mb-4">
                  Optimisez votre planning avec notre système de prise de rendez-vous intelligent et automatisé.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[hsl(142,71%,45%)] mr-2" />
                    Réservation en ligne
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[hsl(142,71%,45%)] mr-2" />
                    Rappels automatiques
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Analyses et Rapports</h3>
                <p className="text-muted-foreground mb-4">
                  Suivez les performances de votre cabinet avec des tableaux de bord détaillés et intuitifs.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[hsl(142,71%,45%)] mr-2" />
                    Métriques en temps réel
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[hsl(142,71%,45%)] mr-2" />
                    Rapports personnalisables
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Sécurité des Données</h3>
                <p className="text-muted-foreground mb-4">
                  Protection maximale des données patients avec chiffrement de bout en bout et conformité RGPD.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[hsl(142,71%,45%)] mr-2" />
                    Conformité RGPD
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[hsl(142,71%,45%)] mr-2" />
                    Chiffrement sécurisé
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Automatisation Avancée</h3>
                <p className="text-muted-foreground mb-4">
                  Automatisez les tâches répétitives pour vous concentrer sur ce qui compte vraiment : vos patients.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[hsl(142,71%,45%)] mr-2" />
                    Workflows personnalisés
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-[hsl(142,71%,45%)] mr-2" />
                    Gain de temps significatif
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
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Pourquoi Choisir <span className="text-[hsl(221,83%,53%)]">Melyia</span> ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez les avantages concrets que Melyia apporte à votre cabinet dentaire.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[hsl(221,83%,53%)] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Gain de Temps Considérable</h3>
                  <p className="text-muted-foreground">
                    Réduisez de 70% le temps consacré aux tâches administratives grâce à l'automatisation intelligente.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[hsl(142,76%,36%)] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Euro className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Augmentation du Chiffre d'Affaires</h3>
                  <p className="text-muted-foreground">
                    Optimisez vos revenus avec une meilleure gestion des rendez-vous et des relances automatiques.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[hsl(142,71%,45%)] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Amélioration de l'Expérience Patient</h3>
                  <p className="text-muted-foreground">
                    Offrez un service premium avec des réponses instantanées et un suivi personnalisé.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Dentiste utilisant la technologie moderne" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="tarifs" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Tarifs <span className="text-[hsl(221,83%,53%)]">Transparents</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choisissez l'offre qui correspond le mieux à la taille de votre cabinet.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">Starter</h3>
                <div className="text-4xl font-bold text-foreground mb-2">
                  49€
                  <span className="text-lg font-normal text-muted-foreground">/mois</span>
                </div>
                <p className="text-muted-foreground">Parfait pour débuter</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[hsl(142,71%,45%)] mr-3" />
                  <span className="text-muted-foreground">Jusqu'à 100 patients</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[hsl(142,71%,45%)] mr-3" />
                  <span className="text-muted-foreground">Assistant IA de base</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[hsl(142,71%,45%)] mr-3" />
                  <span className="text-muted-foreground">Génération de devis</span>
                </li>
              </ul>
              <Button 
                onClick={openModal}
                className="w-full bg-slate-100 text-slate-900 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
              >
                Rejoindre la liste d'attente
              </Button>
            </div>

            {/* Professional Plan - Popular */}
            <div className="bg-white border-2 border-[hsl(221,83%,53%)] rounded-2xl p-8 hover:shadow-lg transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-[hsl(221,83%,53%)] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Populaire
                </div>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">Professional</h3>
                <div className="text-4xl font-bold text-foreground mb-2">
                  99€
                  <span className="text-lg font-normal text-muted-foreground">/mois</span>
                </div>
                <p className="text-muted-foreground">Le plus choisi</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[hsl(142,71%,45%)] mr-3" />
                  <span className="text-muted-foreground">Jusqu'à 500 patients</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[hsl(142,71%,45%)] mr-3" />
                  <span className="text-muted-foreground">Assistant IA avancé</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[hsl(142,71%,45%)] mr-3" />
                  <span className="text-muted-foreground">Gestion des RDV</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[hsl(142,71%,45%)] mr-3" />
                  <span className="text-muted-foreground">Analyses détaillées</span>
                </li>
              </ul>
              <Button 
                onClick={openModal}
                className="w-full bg-[hsl(221,83%,53%)] text-white py-3 rounded-lg font-semibold hover:bg-[hsl(221,83%,48%)] transition-colors"
              >
                Rejoindre la liste d'attente
              </Button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-foreground mb-2">
                  199€
                  <span className="text-lg font-normal text-muted-foreground">/mois</span>
                </div>
                <p className="text-muted-foreground">Pour les grands cabinets</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[hsl(142,71%,45%)] mr-3" />
                  <span className="text-muted-foreground">Patients illimités</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[hsl(142,71%,45%)] mr-3" />
                  <span className="text-muted-foreground">Toutes les fonctionnalités</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[hsl(142,71%,45%)] mr-3" />
                  <span className="text-muted-foreground">Support prioritaire</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-[hsl(142,71%,45%)] mr-3" />
                  <span className="text-muted-foreground">Personnalisation avancée</span>
                </li>
              </ul>
              <Button 
                onClick={openModal}
                className="w-full bg-slate-100 text-slate-900 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
              >
                Rejoindre la liste d'attente
              </Button>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-block">
              <div className="flex items-center text-yellow-800">
                <Gift className="h-5 w-5 mr-2" />
                <span className="font-semibold">Offre de lancement : 50% de réduction à vie pour les 15 premiers inscrits</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-medical text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Prêt à Révolutionner votre Cabinet ?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez les dentistes innovants qui transforment déjà leur pratique avec Melyia.
          </p>
          <Button 
            onClick={openModal}
            className="bg-white text-[hsl(221,83%,53%)] px-8 py-4 rounded-xl font-semibold hover:bg-slate-100 transition-all transform hover:scale-105 shadow-lg"
          >
            <Star className="mr-2 h-5 w-5" />
            Rejoindre la Liste d'Attente Maintenant
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 gradient-medical rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-xl font-bold">Melyia</span>
              </div>
              <p className="text-slate-400 mb-4 max-w-md">
                L'assistant IA qui révolutionne la gestion des cabinets dentaires en France.
              </p>
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
                🚧 En cours de développement
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Melyia. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Waitlist Modal */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>Rejoindre la Liste d'Attente</ModalTitle>
          </ModalHeader>
          <WaitlistForm onSuccess={closeModal} />
        </ModalContent>
      </Modal>
    </div>
  );
}
