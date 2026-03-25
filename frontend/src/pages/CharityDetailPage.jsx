import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageSection from "../components/PageSection";
import { useAuth } from "../context/AuthContext";
import { createDonation, getCharityDetails } from "../services/api";

function CharityDetailPage() {
  const { charityId } = useParams();
  const { token } = useAuth();
  const [charity, setCharity] = useState(null);
  const [form, setForm] = useState({
    amount: "",
    message: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCharity = async () => {
      try {
        const response = await getCharityDetails(charityId);
        setCharity(response.charity);
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadCharity();
  }, [charityId]);

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
      const response = await createDonation(token, charityId, {
        amount: Number.parseFloat(form.amount),
        message: form.message,
      });
      setMessage(response.message);
      setForm({ amount: "", message: "" });
      const charityResponse = await getCharityDetails(charityId);
      setCharity(charityResponse.charity);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (!charity) {
    return <div className="page-status">Loading charity details...</div>;
  }

  return (
    <div className="page-stack">
      <PageSection title={charity.name} description={charity.description || "No description provided yet."}>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Donation total</span>
            <strong>${charity.donationTotal.toFixed(2)}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Donation count</span>
            <strong>{charity.donationCount}</strong>
          </div>
        </div>
      </PageSection>

      <PageSection title="Donate" description="Make an independent donation to support this charity.">
        <form className="stack-form" onSubmit={handleSubmit}>
          <input
            min="1"
            name="amount"
            onChange={handleChange}
            placeholder="Donation amount"
            type="number"
            value={form.amount}
          />
          <textarea
            name="message"
            onChange={handleChange}
            placeholder="Optional note"
            rows="4"
            value={form.message}
          />
          <button className="button" type="submit">
            Donate
          </button>
        </form>
        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </PageSection>
    </div>
  );
}

export default CharityDetailPage;
