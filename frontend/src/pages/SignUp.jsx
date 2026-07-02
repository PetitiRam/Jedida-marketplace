import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import client from '../api/client';
import { useEffect, useState } from 'react';
import { getCountries, getCitiesByCountry } from '../api/geo';

export default function SignUp() {
  const navigate = useNavigate();
const [countries, setCountries] = useState([]);
const [cities, setCities] = useState([]);

const [form, setForm] = useState({
  fullName: '',
  email: '',
  phoneNumber: '',
  dialCode: '',
  locationCountry: '',
  locationCity: '',
  password: '',
  confirmPassword: ''
});

const [loadingCities, setLoadingCities] = useState(false);
 

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
const fullPhoneNumber = `${form.dialCode}${form.phoneNumber}`;      
const { data } = await client.post('/auth/signup', {
        fullName: form.fullName,
        email: form.email,
        phoneNumber: fullPhoneNumber,
        locationCountry: form.locationCountry,
        locationCity: form.locationCity,
        password: form.password
      });
      localStorage.setItem('jedida_access_token', data.accessToken);
     navigate('/signin');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const loadCountries = async () => {
    try {
      const res = await fetch(
        "https://countriesnow.space/api/v0.1/countries/iso"
      );

      const json = await res.json();

      console.log("RAW API:", json);

      const list = json?.data?.map((c) => c.name) || [];

      console.log("COUNTRY LIST:", list);

      setCountries(list);
    } catch (err) {
      console.error("Country load failed:", err);
    }
  };

  loadCountries();
}, []);
useEffect(() => {
  const loadCities = async () => {
    if (!form.locationCountry) return;

    try {
      const data = await getCitiesByCountry(form.locationCountry);
      setCities(data);
    } catch (err) {
      console.error("Cities failed to load:", err);
      setCities([]);
    }
  };

  loadCities();
}, [form.locationCountry]);

  return (
    <AuthLayout>
      <div className="eyebrow">Get started</div>
      <h1>Create your buyer account</h1>
      <p className="hint">Every account starts as a buyer — you can upgrade to seller or delivery partner later.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" placeholder="e.g. Joe Doe" value={form.fullName} onChange={update('fullName')} required />
        </div>
                                                                
         <div className="field-group">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} required />
        </div>

        <div className="field-group">
          <label htmlFor="phoneNumber">Phone number</label>

<div className="phone-group">
  <input
    type="tel"
    placeholder="Phone number"
    value={form.phoneNumber}
    onChange={update('phoneNumber')}
    required
  />
</div>
<select
  value={form.locationCountry}
  onChange={(e) =>
    setForm({
      ...form,
      locationCountry: e.target.value,
      locationCity: ""
    })
  }
>
  <option value="">Select country</option>

  {countries.map((country) => (
    <option key={country} value={country}>
      {country}
    </option>
  ))}
</select>

<select
  value={form.locationCity}
  onChange={(e) =>
    setForm({ ...form, locationCity: e.target.value })
  }
  disabled={!form.locationCountry}
>
  <option value="">
    {form.locationCountry ? "Select city" : "Select country first"}
  </option>

  {cities?.map((city) => (
    <option key={city} value={city}>
      {city}
    </option>
  ))}
</select>

        </div>

        <div className="field-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" placeholder="At least 8 characters" value={form.password} onChange={update('password')} required minLength={8} />
        </div>

        <div className="field-group">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" type="password" placeholder="Re-enter your password" value={form.confirmPassword} onChange={update('confirmPassword')} required minLength={8} />
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Creating your account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-footer-note">
        Already have an account? <Link to="/signin" className="btn-link">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
