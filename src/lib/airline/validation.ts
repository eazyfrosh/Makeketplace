import { z } from "zod";

export const passengerSchema = z.object({
  id: z.string(),
  type: z.enum(["adult", "child", "infant"]),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(1, "Nationality is required"),
  passportNumber: z
    .string()
    .min(5, "Passport number looks too short")
    .max(20, "Passport number looks too long"),
  gender: z.enum(["male", "female", "other"]),
  email: z.email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone number").max(20),
});

export const passengersFormSchema = z.object({
  passengers: z.array(passengerSchema).min(1),
});

export type PassengersFormValues = z.infer<typeof passengersFormSchema>;
