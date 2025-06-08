import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../shared/components/ui/button";
import { Input } from "../../shared/components/ui/input";
import { Textarea } from "../../shared/components/ui/textarea";
import { Label } from "../../shared/components/ui/label";
import { useToast } from "../../shared/hooks/use-toast";
import { apiRequest } from "../../shared/lib/queryClient";
import { CheckCircle, Loader2, Gift, AlertCircle } from "lucide-react";

// Types locaux pour le formulaire waitlist (remplace @shared/schema)
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertWaitlistEntry>({
    // Validation basique sans Zod (pour éviter les dépendances @shared)
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      practiceName: "",
      comments: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertWaitlistEntry) => {
      try {
        // Validation basique côté client
        if (!data.firstName || !data.lastName || !data.email || !data.phone) {
          throw new Error("Veuillez remplir tous les champs obligatoires");
        }

        const response = await apiRequest("POST", "/api/waitlist", data);
        return response.json();
      } catch (error) {
        // For development: log the full URL being called
        console.log(
          "API Call failed. Expected endpoint: https://dev.melyia.com/api/waitlist",
        );
        console.log("Request data:", data);
        throw error;
      }
    },
    onSuccess: () => {
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist"] });
      toast({
        title: "Inscription réussie !",
        description: "Vous recevrez bientôt plus d'informations sur Melyia.",
      });
    },
    onError: (error) => {
      console.error("Subscription error:", error);
      setShowError(true);

      // More specific error message
      const errorMessage =
        error instanceof Error ? error.message : "Une erreur s'est produite";

      toast({
        title: "Erreur de connexion",
        description: `${errorMessage}. Vérifiez que l'endpoint API est configuré.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertWaitlistEntry) => {
    mutation.mutate(data);
  };

  const resetForm = () => {
    setShowSuccess(false);
    setShowError(false);
    form.reset();
  };

  if (showSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h4 className="text-xl font-bold text-foreground mb-2">
          Inscription Réussie !
        </h4>
        <p className="text-muted-foreground mb-4">
          Merci de rejoindre la liste d'attente Melyia. Vous recevrez bientôt
          plus d'informations.
        </p>
        <Button
          onClick={onSuccess}
          className="bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,48%)] text-white"
        >
          Fermer
        </Button>
      </div>
    );
  }

  if (showError) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-white" />
        </div>
        <h4 className="text-xl font-bold text-foreground mb-2">Erreur</h4>
        <p className="text-muted-foreground mb-4">
          Une erreur s'est produite lors de votre inscription. Veuillez
          réessayer.
        </p>
        <Button
          onClick={resetForm}
          className="bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,48%)] text-white"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="gradient-medical p-4 rounded-xl mb-6">
        <div className="flex items-center text-white">
          <Gift className="h-6 w-6 mr-3" />
          <div>
            <div className="font-semibold">Offre de Lancement</div>
            <div className="text-sm opacity-90">
              50% de réduction à vie pour les 15 premiers
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="firstName"
              className="text-sm font-medium text-foreground"
            >
              Prénom *
            </Label>
            <Input
              id="firstName"
              {...form.register("firstName", {
                required: "Le prénom est obligatoire",
              })}
              placeholder="Jean"
              className="mt-1"
            />
            {form.formState.errors.firstName && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="lastName"
              className="text-sm font-medium text-foreground"
            >
              Nom *
            </Label>
            <Input
              id="lastName"
              {...form.register("lastName", {
                required: "Le nom est obligatoire",
              })}
              placeholder="Dupont"
              className="mt-1"
            />
            {form.formState.errors.lastName && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            {...form.register("email", {
              required: "L'email est obligatoire",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Format d'email invalide",
              },
            })}
            placeholder="jean.dupont@cabinet-dentaire.fr"
            className="mt-1"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="phone"
            className="text-sm font-medium text-foreground"
          >
            Téléphone *
          </Label>
          <Input
            id="phone"
            type="tel"
            {...form.register("phone", {
              required: "Le téléphone est obligatoire",
            })}
            placeholder="06 12 34 56 78"
            className="mt-1"
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="practiceName"
            className="text-sm font-medium text-foreground"
          >
            Nom du Cabinet (optionnel)
          </Label>
          <Input
            id="practiceName"
            {...form.register("practiceName")}
            placeholder="Cabinet Dentaire Dupont"
            className="mt-1"
          />
        </div>

        <div>
          <Label
            htmlFor="comments"
            className="text-sm font-medium text-foreground"
          >
            Commentaires (optionnel)
          </Label>
          <Textarea
            id="comments"
            {...form.register("comments")}
            placeholder="Parlez-nous de vos besoins spécifiques..."
            rows={3}
            className="mt-1 resize-none"
          />
        </div>

        <div className="flex items-start space-x-3 pt-2">
          <input
            type="checkbox"
            id="consent"
            required
            className="w-5 h-5 text-[hsl(221,83%,53%)] border-gray-300 rounded focus:ring-[hsl(221,83%,53%)] focus:ring-2 mt-0.5"
          />
          <Label
            htmlFor="consent"
            className="text-sm text-muted-foreground leading-relaxed"
          >
            J'accepte de recevoir des informations sur Melyia et confirme avoir
            lu la{" "}
            <a href="#" className="text-[hsl(221,83%,53%)] hover:underline">
              politique de confidentialité
            </a>
            .
          </Label>
        </div>

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-[hsl(221,83%,53%)] text-white py-4 rounded-xl font-semibold hover:bg-[hsl(221,83%,48%)] transition-all shadow-lg mt-6"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Inscription en cours...
            </>
          ) : (
            <>
              <Gift className="mr-2 h-4 w-4" />
              Rejoindre la Liste d'Attente
            </>
          )}
        </Button>
      </form>
    </>
  );
}
