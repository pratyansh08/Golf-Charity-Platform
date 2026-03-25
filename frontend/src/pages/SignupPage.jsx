import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCharities } from "../services/api";

function SignupPage() {
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const [charities, setCharities] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    charityId: "",
    contributionPercentage: 10,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCharities = async () => {
      try {
        const response = await getCharities();
        setCharities(response.charities);
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadCharities();
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await signup({
        ...form,
        charityId: form.charityId ? Number.parseInt(form.charityId, 10) : undefined,
        contributionPercentage: form.charityId
          ? Number.parseFloat(form.contributionPercentage)
          : undefined,
      });
      navigate("/login", {
        replace: true,
        state: {
          signupSuccess: "Account created successfully. Please log in with your email and password.",
          email: form.email,
        },
      });
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Signup</h1>
        <p className="muted-text">Create a member account to use the platform.</p>

        <label className="field">
          <span>Name</span>
          <input name="name" onChange={handleChange} required value={form.name} />
        </label>

        <label className="field">
          <span>Email</span>
          <input name="email" onChange={handleChange} required type="email" value={form.email} />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            minLength="8"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
        </label>

        <label className="field">
          <span>Charity</span>
          <select name="charityId" onChange={handleChange} value={form.charityId}>
            <option value="">Choose later</option>
            {charities.map((charity) => (
              <option key={charity.id} value={charity.id}>
                {charity.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Contribution Percentage</span>
          <input
            disabled={!form.charityId}
            max="100"
            min="10"
            name="contributionPercentage"
            onChange={handleChange}
            type="number"
            value={form.contributionPercentage}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="button" disabled={isLoading} type="submit">
          {isLoading ? "Creating account..." : "Signup"}
        </button>

        <p className="muted-text">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default SignupPage;
