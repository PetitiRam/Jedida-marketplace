import express from "express";
import { authLimiter } from "../middleware/rateLimit.js";
import {
  signup,
  signin,
  requestEmailCode,
  verifyEmailCode,
  verifySigninOtp,
 forgotPassword, 
requestPasswordReset,
  verifyResetToken,
  resetPassword
} from "../controllers/authController.js";

const router = express.Router();

/**
 * AUTH FLOW
 */

// Signup
router.post("/signup", signup);


// Email verification (account creation)
router.post("/signin", authLimiter, signin);
router.post("/request-email-code", requestEmailCode);
router.post("/verify-email-code", verifyEmailCode);

// Signin OTP verification (login completion)
router.post("/verify-signin-otp", verifySigninOtp);
router.post("/forgot-password", forgotPassword);
router.post("/request-password-reset", requestPasswordReset);

router.post("/verify-reset-token", verifyResetToken);

router.post("/reset-password", resetPassword);

export default router;
