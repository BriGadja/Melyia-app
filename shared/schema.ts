import { z } from "zod";

export const insertWaitlistEntrySchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(1, "Le nom est requis").min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().min(1, "L'email est requis").email("Veuillez entrer une adresse email valide"),
  phone: z.string().min(1, "Le téléphone est requis").regex(/^[\d\s\-\+\(\)]+$/, "Format de téléphone invalide"),
  practiceName: z.string().optional(),
  comments: z.string().optional(),
});

export type InsertWaitlistEntry = z.infer<typeof insertWaitlistEntrySchema>;
