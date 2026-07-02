import crypto from "crypto";

/**
 * Generate a random 6-digit OTP.
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash an OTP before storing it in the database.
 */
export function hashOTP(otp) {
  return crypto
    .createHash("sha256")
    .update(String(otp))
    .digest("hex");
}
