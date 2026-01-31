import { z, ZodError, ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";
import { UserRole } from "../../config/jwt";

/**
 * Auth Validation Layer (Security Shield)
 *
 * Responsibilities:
 * 1. Sanitization: Trimming, cleaning inputs
 * 2. Structure Validation: Ensuring required fields exist
 * 3. Format Validation: Regex checks for secure formats
 * 4. Header Validation: Enforcing localization headers
 */

// --- Reusable Validation Patterns ---

// Ethiopian Phone Regex: Matches 09.., 07.., +2519.., +2517..
// Allows flexible input but ensures it looks like a phone number
const ethPhoneRegex = /^(?:\+251|251|0)?(9|7)\d{8}$/;

const phoneSchema = z.preprocess(
  (val) => String(val).replace(/\s+/g, ""),
  z
    .string()
    .trim()
    .min(10, "Phone number is too short") // e.g. 0912345678 is 10 chars
    .max(20, "Phone number is too long")
    .regex(
      ethPhoneRegex,
      "Invalid Ethiopian phone number format. Use 09... or +251...",
    ),
);

const otpSchema = z
  .string()
  .trim()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^[0-9]+$/, "OTP must contain only numbers");

const headerSchema = z.object({
  "accept-language": z.string().optional().default("en"),
});

// --- Route Schemas ---

export const requestOtpSchema = z.object({
  body: z.object({
    phoneNumber: phoneSchema,
    role: z
      .nativeEnum(UserRole, {
        errorMap: () => ({ message: "Invalid role provided" }),
      })
      .optional()
      .default(UserRole.PASSENGER),
  }),
  headers: headerSchema.passthrough(), // Allow other headers
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phoneNumber: phoneSchema,
    otp: otpSchema,
  }),
  headers: headerSchema.passthrough(),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10, "Invalid token format"),
  }),
  headers: headerSchema.passthrough(),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(3, "Identifier too short"), // phone or email
    password: z.string().min(4, "Password too short"),
  }),
  headers: headerSchema.passthrough(),
});

export const registerSchema = z.object({
  body: z
    .object({
      first_name: z.string().min(2, "First name required"),
      last_name: z.string().min(2, "Last name required"),
      email: z.string().email("Invalid email").optional().or(z.literal("")),
      phone: phoneSchema,
      password: z.string().min(6, "Password too short"),
      role: z.nativeEnum(UserRole).default(UserRole.PASSENGER),
      city: z.string().optional(),
      fayda_id: z.string().optional(),
      date_of_birth: z.string().optional(),
      gender: z.string().optional(),
    })
    .passthrough(), // Allow other fields like images
  headers: headerSchema.passthrough(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    identifier: z.string().min(3, "Identifier required"), // phone or email
  }),
  headers: headerSchema.passthrough(),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    identifier: z.string().min(3, "Identifier required"),
    code: otpSchema,
    new_password: z.string().min(8, "Password too short"), // Changed to 8 to match mobile valid
  }),
  headers: headerSchema.passthrough(),
});
export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Parse and Validate
      // We use .parseAsync if needed, but sync is fine for standard payloads
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers, // Headers are usually lowercased by Express
      });

      // 2. Replace req data with sanitized/validated data
      // This ensures downstream controllers only see safe data
      // Note: We don't replace headers as that might break internal express behavior,
      // but we do replace body/query/params
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // 3. Format Error Response
        // Group errors by field for easier frontend mapping
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };

// Helper type for the schema
type AnyZodObject = z.ZodObject<any, any, any, any>;
