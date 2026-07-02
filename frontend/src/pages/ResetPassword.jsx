import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import client from "../api/client";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const query = new URLSearchParams(location.search);
  const token = query.get("token");
  const email = query.get("email");

  // 🔥 STEP 1: verify link
  useEffect(() => {
    const verify = async () => {
      if (!token || !email) {
        setStatus("invalid");
        return;
      }

      try {
        await client.post("/auth/verify-reset-token", {
          token,
          email,
        });

        setStatus("valid");
      } catch (err) {
        setStatus("invalid");
      }
    };

    verify();
  }, [token, email]);

  // 🔥 STEP 2: reset password
  const handleReset = async (e) => {
    e.preventDefault();

    setStatus("resetting");

    try {
      await client.post("/auth/reset-password", {
        email,
        token,
        newPassword,
      });

      setStatus("success");

      setTimeout(() => {
        navigate("/signin");
      }, 1500);
    } catch (err) {
      setError("Failed to reset password");
      setStatus("valid");
    }
  };

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>

      {status === "loading" && <p>Checking reset link...</p>}

      {status === "invalid" && (
        <p style={{ color: "red" }}>
          Reset link is invalid or expired
        </p>
      )}

      {status === "valid" && (
        <form onSubmit={handleReset}>
          <label>New Password</label>

          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button type="submit">
            Reset Password
          </button>
        </form>
      )}

      {status === "resetting" && (
        <p>Resetting password...</p>
      )}

      {status === "success" && (
        <p style={{ color: "green" }}>
          Password reset successful. Redirecting...
        </p>
      )}
    </div>
  );
}
