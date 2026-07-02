import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import client from '../api/client';
import { useAuth } from "../context/AuthContext";

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);


const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
  const { data } = await client.post('/auth/signin', {
      email: email.trim().toLowerCase(),
      password
    });

    if (data.requiresOtp) {
      setStep(2);
      return;
    }

  } catch (err) {
    setError(err.response?.data?.error || 'Login failed');
  } finally {
    setLoading(false);
  }
};
const handleVerifyOtp = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const { data } = await client.post('/auth/verify-signin-otp', {
  email: email.trim().toLowerCase(),
  otp
});
                                           
    login(data); // store JWT + user
    navigate('/marketplace');

  } catch (err) {
    setError(err.response?.data?.error || 'Invalid OTP');
  } finally {
    setLoading(false);
  }
};

return (
  <AuthLayout>
    <div className="eyebrow">Welcome back</div>
    <h1>Sign in to JEDIDA</h1>
    <p className="hint">Buy, sell or manage deliveries — all in one account.</p>

    {error && <div className="alert alert-error">{error}</div>}

    <form onSubmit={step === 1 ? handleLogin : handleVerifyOtp}>

      {/* STEP 1: EMAIL + PASSWORD */}
      {step === 1 && (
        <>
          <div className="field-group">
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              required
            />
          </div>

          <div className="field-group">
            <label>Password</label>

            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="remember-row">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
          </div>
                     <Link to="/forgot-password">
              Forgot password?
            </Link>  

          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Continue"}
          </button>
        </>
      )}

      {/* STEP 2: OTP */}
      {step === 2 && (
        <>
          <p>Enter the OTP sent to your email</p>

          <div className="field-group">
            <label>Verification code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Login"}
          </button>

          <button type="button" onClick={() => setStep(1)}>
            Back
          </button>
        </>
      )}

    </form>

    <p className="auth-footer-note">
      New to JEDIDA? <Link to="/signup">Create an account</Link>
    </p>
  </AuthLayout>
);
}
