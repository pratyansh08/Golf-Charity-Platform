import { useEffect, useState } from "react";
import PageSection from "../components/PageSection";
import { useAuth } from "../context/AuthContext";
import { addScore, getMyScores } from "../services/api";

function ScoreEntryPage() {
  const { token } = useAuth();
  const [scores, setScores] = useState([]);
  const [form, setForm] = useState({
    value: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadScores = async () => {
    try {
      const response = await getMyScores(token);
      setScores(response.scores);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    loadScores();
  }, [token]);

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
      const response = await addScore(token, {
        value: Number.parseInt(form.value, 10),
        date: form.date,
      });
      setScores(response.scores);
      setMessage(response.message);
      setForm((current) => ({ ...current, value: "" }));
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="page-stack">
      <PageSection title="Add Score" description="Store your latest draw numbers. Only the last 5 scores are kept.">
        <form className="inline-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Value</span>
            <input
              max="45"
              min="1"
              name="value"
              onChange={handleChange}
              required
              type="number"
              value={form.value}
            />
          </label>
          <label className="field">
            <span>Date</span>
            <input name="date" onChange={handleChange} required type="date" value={form.date} />
          </label>
          <button className="button" type="submit">
            Save score
          </button>
        </form>
        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </PageSection>

      <PageSection title="Your Scores" description="Latest scores shown first.">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Value</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score) => (
                <tr key={score.id}>
                  <td>{score.value}</td>
                  <td>{score.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>
    </div>
  );
}

export default ScoreEntryPage;
