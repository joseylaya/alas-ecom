import { z } from "zod";
export const cartLineSchema = z.object({ variantId: z.string().min(1), quantity: z.number().int().positive().max(20) });
export const checkoutValidationSchema = z.object({ items: z.array(cartLineSchema).min(1).max(25) });
export const customerDetailsSchema = checkoutValidationSchema.extend({ fullName: z.string().min(2).max(120), email: z.string().email(), mobile: z.string().min(7).max(25), country: z.literal("Philippines"), region: z.string().min(2), province: z.string().min(2), city: z.string().min(2), barangay: z.string().min(2), streetAddress: z.string().min(4), postalCode: z.string().max(12).optional() });
