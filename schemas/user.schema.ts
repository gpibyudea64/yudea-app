import { APP_ROLES } from "@/lib/rbac";
import { z } from "zod";

export const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  role: z.enum(APP_ROLES),
  regionId: z.string().optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
