import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "../config/db.js";
import {
  generateAccessToken,
  generateRefreshToken
} from "../utils/jwt.js";
import db from "../config/db.js";
import { sendEmail } from "../utils/mailer.js";
import jwt from "jsonwebtoken";
import { generateOTP, hashOTP } from "../utils/otp.js";
import { query } from "../config/db.js";


// ==========================
// SIGNUP
// ==========================
export const signup = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      phoneNumber,
      locationCountry,
      locationCity
    } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    // 2. Normalize email
const normalizedEmail = email?.trim().toLowerCase();
if (!normalizedEmail) {
  return res.status(400).json({ error: "Invalid email" });
}
if (password.length < 6) {
  return res.status(400).json({ error: "Password too weak" });
}
    // 3. Check if user exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "User already exists"
      });
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 10);
                                                    
const userResult = await pool.query(
  `INSERT INTO users (email, password_hash, role)
   VALUES ($1, $2, $3)
   RETURNING id, email, role`,
  [normalizedEmail, passwordHash, "buyer"]
);                                                                             

    const user = userResult.rows[0];

    // 6. Create buyer profile
    const profileResult = await pool.query(
      `INSERT INTO buyer_profiles
       (user_id, full_name, phone_number, location_country, location_city)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        user.id,
        fullName || "",
        phoneNumber || "",
        locationCountry || "",
        locationCity || ""
      ]
    );

    const profile = profileResult.rows[0];

    // 7. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 8. Response
    return res.status(201).json({
      message: "Signup successful",
      user,
      profile,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
};


export const requestEmailCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const code = generateOTP();
    const codeHash = await bcrypt.hash(code, 10);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Optional: delete old codes for same email
    await db.query(
      `DELETE FROM email_verification_codes WHERE email = $1`,
      [email]
    );

    await db.query(
      `INSERT INTO email_verification_codes (email, code_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [email, codeHash, expiresAt]
    );
console.log("User email:", user.email);
console.log("USER OBJECT:", user);
console.log("USER EMAIL:", user.email);
await sendEmail({
  to: user.email,
  subject: "Your JEDIDA OTP Code",
  html: `<p>Your OTP code is <b>${otp}</b>. It expires in 10 minutes.</p>`
});
    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code required" });
    }

    const result = await db.query(
      `SELECT * FROM email_verification_codes
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    const record = result.rows[0];

    if (!record) {
      return res.status(400).json({ error: "No OTP found" });
    }

    if (new Date() > record.expires_at) {
      return res.status(400).json({ error: "OTP expired" });
    }

    if (record.attempts >= 5) {
      return res.status(429).json({ error: "Too many attempts" });
    }

    const valid = await bcrypt.compare(code, record.code_hash);

    if (!valid) {
      await db.query(
        `UPDATE email_verification_codes
         SET attempts = attempts + 1
         WHERE id = $1`,
        [record.id]
      );

      return res.status(400).json({ error: "Invalid code" });
    }

    // delete used OTP
    await db.query(
      `DELETE FROM email_verification_codes WHERE email = $1`,
      [email]
    );

    // 🔐 ISSUE JWT
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      accessToken: token,
      user: { email }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
// ==========================
// SIGNIN
// ==========================
export async function signin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Find user
    const userRes = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [normalizedEmail]
    );

    const user = userRes.rows[0];

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // 2. Verify password
    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // 3. Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Store OTP in DB
    await db.query(
      `
      INSERT INTO login_otps
      (user_id, email, otp_hash, expires_at, attempts)
      VALUES ($1, $2, $3, $4, 0)
      `,
      [user.id, normalizedEmail, otpHash, expiresAt]
    );

    // 5. Send OTP email (safe fail)
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Your JEDIDA OTP Code",
        html: `
          <div style="font-family: Arial;">
            <h2>JEDIDA Login Verification</h2>
            <p>Your OTP code is:</p>
            <h1>${otp}</h1>
            <p>This code expires in 10 minutes.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Email failed:", emailErr.message);
      return res.status(500).json({
        error: "Failed to send OTP email. Try again later.",
      });
    }

    // 6. Response
    return res.status(200).json({
      requiresOtp: true,
      message: "OTP sent to email",
    });
  } catch (err) {
    console.error("Signin error:", err);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
export async function verifySigninOtp(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'OTP required' });
  }

  const userRes = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email.trim().toLowerCase()]
  );

  const user = userRes.rows[0];

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const otpHash = hashOTP(otp);

  const otpRes = await db.query(
    `SELECT * FROM login_otps
     WHERE user_id = $1
     AND otp_hash = $2
     AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [user.id, otpHash]
  );

  if (!otpRes.rows.length) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  await db.query('DELETE FROM login_otps WHERE user_id = $1', [user.id]);

  const token = generateAccessToken(user);

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.primary_role
    }
  });
}
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userResult = await query(
      "SELECT id, email FROM users WHERE email = $1",
      [normalizedEmail]
    );

    const user = userResult.rows[0];

    // always respond same (security)
    if (!user) {
      return res.json({
        message: "If account exists, reset link sent"
      });
    }

    // remove old tokens
    await query(
      "DELETE FROM password_resets WHERE user_id = $1",
      [user.id]
    );

    // generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // store token (PLAIN for now, can hash later)
    await query(
      `
      INSERT INTO password_resets
      (user_id, email, token_hash, expires_at, used, created_at)
      VALUES ($1, $2, $3, $4, false, NOW())
      `,
      [user.id, user.email, token, expiresAt]
    );

    // build reset link
    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your JEDIDA password",
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 15 minutes.</p>
      `
    });

    return res.json({
      message: "If account exists, reset link sent"
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
export async function requestPasswordReset(req, res) {
  const { email } = req.body;

  const userRes = await query(
    "SELECT id, email FROM users WHERE email = $1",
    [email?.trim().toLowerCase()]
  );

  const user = userRes.rows[0];

  // always respond same (security)
  if (!user) {
    return res.json({ message: "If email exists, reset link sent" });
  }

  // 🔥 generate secure token (THIS IS YOUR "LINK GENERATOR")
  const token = crypto.randomBytes(32).toString("hex");

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // store token
  await query(
    `
    INSERT INTO password_resets
    (user_id, email, token_hash, expires_at, used, created_at)
    VALUES ($1, $2, $3, $4, false, NOW())
    `,
    [user.id, user.email, token, expiresAt]
  );

  // 🔥 THIS IS THE RESET LINK
  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}&email=${user.email}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your JEDIDA password",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });

  return res.json({
    message: "If email exists, reset link sent"
  });
}
export async function verifyResetToken(req, res) {
  const { email, token } = req.body;

  if (!email || !token) {
    return res.status(400).json({ error: "Missing email or token" });
  }

  const result = await query(
    `SELECT * FROM password_resets
     WHERE email = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [email.trim().toLowerCase()]
  );

  const record = result.rows[0];

  if (!record) {
    return res.status(400).json({ error: "Invalid or expired link" });
  }

  // ❌ already used
  if (record.used) {
    return res.status(400).json({ error: "Link already used" });
  }

  // ❌ expired
  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: "Link expired" });
  }

  // ❌ token mismatch
  if (record.token_hash !== token) {
    return res.status(400).json({ error: "Invalid token" });
  }

  return res.json({ success: true });
}
export async function resetPassword(req, res) {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // 1. Get latest reset request
  const result = await query(
    `SELECT * FROM password_resets
     WHERE email = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [email.trim().toLowerCase()]
  );

  const record = result.rows[0];

  if (!record) {
    return res.status(400).json({ error: "Invalid reset request" });
  }

  // 2. Check if used
  if (record.used) {
    return res.status(400).json({ error: "Reset link already used" });
  }

  // 3. Check expiry
  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: "Reset link expired" });
  }

  // 4. Check token match
  if (record.token_hash !== token) {
    return res.status(400).json({ error: "Invalid token" });
  }

  // 5. Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 6. Update user password
  await query(
    `UPDATE users
     SET password_hash = $1, updated_at = NOW()
     WHERE email = $2`,
    [hashedPassword, email.trim().toLowerCase()]
  );

  // 7. Mark reset token as used
  await query(
    `UPDATE password_resets
     SET used = true
     WHERE id = $1`,
    [record.id]
  );

  return res.json({
    success: true,
    message: "Password reset successful"
  });
}
