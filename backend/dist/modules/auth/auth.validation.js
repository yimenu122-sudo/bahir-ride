"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.refreshTokenSchema = exports.verifyOtpSchema = exports.requestOtpSchema = void 0;
const zod_1 = require("zod");
const jwt_1 = require("../../config/jwt");
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
const phoneSchema = zod_1.z.string()
    .trim()
    .min(10, 'Phone number is too short') // e.g. 0912345678 is 10 chars
    .max(15, 'Phone number is too long')
    .regex(ethPhoneRegex, 'Invalid Ethiopian phone number format. Use 09... or +251...');
const otpSchema = zod_1.z.string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only numbers');
const headerSchema = zod_1.z.object({
    'accept-language': zod_1.z.enum(['en', 'am']).optional().default('en')
});
// --- Route Schemas ---
exports.requestOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        phoneNumber: phoneSchema,
        role: zod_1.z.nativeEnum(jwt_1.UserRole, {
            errorMap: () => ({ message: 'Invalid role provided' })
        }).optional().default(jwt_1.UserRole.PASSENGER)
    }),
    headers: headerSchema.passthrough() // Allow other headers
});
exports.verifyOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        phoneNumber: phoneSchema,
        otp: otpSchema
    }),
    headers: headerSchema.passthrough()
});
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(10, 'Invalid token format')
    }),
    headers: headerSchema.passthrough()
});
/**
 * Universal Validation Middleware
 *
 * Validates: Body, Query, Params, and Headers
 * Strips: Unknown fields from Body (security best practice)
 */
const validate = (schema) => (req, res, next) => {
    try {
        // 1. Parse and Validate
        // We use .parseAsync if needed, but sync is fine for standard payloads
        const parsed = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
            headers: req.headers // Headers are usually lowercased by Express
        });
        // 2. Replace req data with sanitized/validated data
        // This ensures downstream controllers only see safe data
        // Note: We don't replace headers as that might break internal express behavior, 
        // but we do replace body/query/params
        if (parsed.body)
            req.body = parsed.body;
        if (parsed.query)
            req.query = parsed.query;
        if (parsed.params)
            req.params = parsed.params;
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            // 3. Format Error Response
            // Group errors by field for easier frontend mapping
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code
            }));
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: formattedErrors
            });
        }
        next(error);
    }
};
exports.validate = validate;
