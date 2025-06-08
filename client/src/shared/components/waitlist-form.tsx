import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { CheckCircle, Loader2, Gift, AlertCircle } from "lucide-react";

// Types for the waitlist form
interface InsertWaitlistEntry {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  practiceName?: string;
  comments?: string;
}

interface WaitlistFormProps {
  onSuccess: () => void;
}

export function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<InsertWaitlistEntry>();

  const waitlistMutation = useMutation({
    mutationFn: async (data: InsertWaitlistEntry) => {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      reset();
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist"] });
      
      toast({
        title: "Inscription réussie !",
        description: "Vous avez été ajouté à notre liste d'attente. Nous vous contacterons bientôt.",
      });

      setTimeout(() => {
        onSuccess();
      }, 2000);
    },
    onError: (error) => {
      console.error("Erreur lors de l'inscription:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'inscription. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertWaitlistEntry) => {
    waitlistMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Merci pour votre inscription !
        </h3>
        <p className="text-gray-600 mb-4">
          Vous avez été ajouté à notre liste d'attente VIP.
        </p>
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <Gift className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-blue-800">
            🎁 <strong>Bonus exclusif :</strong> En tant que membre VIP, vous bénéficierez de 3 mois gratuits lors du lancement !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Rejoindre la liste d'attente
        </h3>
        <p className="text-gray-600">
          Soyez parmi les premiers à découvrir Melyia et bénéficiez d'avantages exclusifs.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Prénom *</Label>
            <Input
              id="firstName"
              {...register("firstName", { required: "Le prénom est requis" })}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName">Nom *</Label>
            <Input
              id="lastName"
              {...register("lastName", { required: "Le nom est requis" })}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email professionnel *</Label>
          <Input
            id="email"
            type="email"
            {...register("email", {
              required: "L'email est requis",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Adresse email invalide"
              }
            })}
            placeholder="contact@cabinet-dentaire.fr"
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            placeholder="01 23 45 67 89"
          />
        </div>

        <div>
          <Label htmlFor="practiceName">Nom du cabinet</Label>
          <Input
            id="practiceName"
            {...register("practiceName")}
            placeholder="Cabinet Dentaire du Centre"
          />
        </div>

        <div>
          <Label htmlFor="comments">Commentaires</Label>
          <Textarea
            id="comments"
            {...register("comments")}
            placeholder="Parlez-nous de vos besoins spécifiques..."
            rows={3}
          />
        </div>

        <Button
          type="submit"
          disabled={waitlistMutation.isPending}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {waitlistMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Inscription en cours...
            </>
          ) : (
            "Rejoindre la liste d'attente"
          )}
        </Button>

        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Engagement de confidentialité :</strong> Vos données sont protégées et ne seront jamais partagées avec des tiers.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}