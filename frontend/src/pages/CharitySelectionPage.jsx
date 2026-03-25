import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageSection from "../components/PageSection";
import { useAuth } from "../context/AuthContext";
import { getCharities, selectCharity } from "../services/api";

function CharitySelectionPage() {
  const { token, user, refreshUser } = useAuth();
  const [charities, setCharities] = useState([]);
  const [form, setForm] = useState({
    charityId: "",
    contributionPercentage: user?.contributionPercentage || 10,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCharities = async () => {
      try {
        const response = await getCharities();
        setCharities(response.charities);
        if (user?.selectedCharityId) {
          setForm((current) => ({
            ...current,
            charityId: String(user.selectedCharityId),
          }));
        }
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadCharities();
  }, [user]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await selectCharity(token, {
        charityId: Number.parseInt(form.charityId, 10),
        contributionPercentage: Number.parseFloat(form.contributionPercentage),
      });
      setMessage(response.message);
      await refreshUser();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="page-stack">
      <PageSection title="Choose Charity" description="Set your supported charity and contribution percentage.">
        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Charity</span>
            <select name="charityId" onChange={handleChange} required value={form.charityId}>
              <option value="">Select a charity</option>
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
              max="100"
              min="10"
              name="contributionPercentage"
              onChange={handleChange}
              required
              type="number"
              value={form.contributionPercentage}
            />
          </label>

          <button className="button" type="submit">
            Save preference
          </button>
        </form>

        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </PageSection>

      <PageSection title="Available Charities" description="Current options from the API.">
        <div className="list-grid">
          {charities.map((charity) => (
            <article className="list-card" key={charity.id}>
              <h3>{charity.name}</h3>
              <p>{charity.description || "No description provided."}</p>
              <Link className="button button-secondary" to={`/charities/${charity.id}`}>
                View details
              </Link>
            </article>
          ))}
        </div>
      </PageSection>
    </div>
  );
}

export default CharitySelectionPage;
