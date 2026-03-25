import { useEffect, useState } from "react";
import PageSection from "../components/PageSection";
import { useAuth } from "../context/AuthContext";
import {
  activateSubscription,
  createStripeBillingPortalSession,
  createStripeCheckoutSession,
  deactivateSubscription,
  getDraws,
  getCharities,
  getMyDonations,
  getMyScores,
  getMySubscriptionHistory,
  getMySubscription,
  getMyWinners,
  uploadWinnerProof,
} from "../services/api";

function DashboardPage() {
  const { token, user, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [winners, setWinners] = useState([]);
  const [scores, setScores] = useState([]);
  const [charities, setCharities] = useState([]);
  const [draws, setDraws] = useState([]);
  const [payments, setPayments] = useState([]);
  const [donations, setDonations] = useState([]);
  const [scoreAccessMessage, setScoreAccessMessage] = useState("");
  const [proofForms, setProofForms] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const isStripeManaged = subscription?.provider === "stripe" || Boolean(user?.stripeCustomerId);

  const loadScores = async () => {
    try {
      const scoresResponse = await getMyScores(token);
      setScores(scoresResponse.scores);
      setScoreAccessMessage("");
    } catch (scoresError) {
      setScores([]);
      setScoreAccessMessage(
        scoresError.status === 403
          ? "Activate a subscription to access and store scores."
          : scoresError.message
      );
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setError("");

      try {
        const [subscriptionResponse, winnersResponse, charitiesResponse, drawsResponse, historyResponse, donationsResponse] = await Promise.all([
          getMySubscription(token),
          getMyWinners(token),
          getCharities(),
          getDraws(token),
          getMySubscriptionHistory(token),
          getMyDonations(token),
        ]);

        setSubscription(subscriptionResponse.subscription);
        setWinners(winnersResponse.winners);
        setCharities(charitiesResponse.charities);
        setDraws(drawsResponse.draws);
        setPayments(historyResponse.payments);
        setDonations(donationsResponse.donations);
        await loadScores();
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadDashboard();
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutState = params.get("checkout");

    if (!checkoutState) {
      return;
    }

    if (checkoutState === "success") {
      setMessage("Stripe checkout completed. Refreshing your subscription status.");
      refreshUser().catch(() => {});
    } else if (checkoutState === "cancel") {
      setMessage("Stripe checkout was canceled before payment was completed.");
    }

    params.delete("checkout");
    params.delete("session_id");
    const queryString = params.toString();
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  const handleActivate = async (planType) => {
    setError("");
    setMessage("");
    setIsBusy(true);

    try {
      try {
        const response = await createStripeCheckoutSession(token, planType);
        if (response.url) {
          window.location.assign(response.url);
          return;
        }
      } catch (checkoutError) {
        if (
          checkoutError.status !== 503 &&
          checkoutError.status !== 400
        ) {
          throw checkoutError;
        }
      }

      const response = await activateSubscription(token, planType);
      setSubscription(response.subscription);
      setMessage(`${response.message} Demo payment flow was used.`);
      await refreshUser();
      await loadScores();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleManageBilling = async () => {
    setError("");
    setMessage("");
    setIsBusy(true);

    try {
      const response = await createStripeBillingPortalSession(token);
      if (response.url) {
        window.location.assign(response.url);
        return;
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleProofChange = (winnerId, value) => {
    setProofForms((current) => ({
      ...current,
      [winnerId]: value,
    }));
  };

  const handleProofSubmit = async (winnerId) => {
    const proofImageUrl = proofForms[winnerId]?.trim();

    if (!proofImageUrl) {
      setError("Enter a proof URL before submitting.");
      return;
    }

    setError("");
    setMessage("");
    setIsBusy(true);

    try {
      const response = await uploadWinnerProof(token, winnerId, { proofImageUrl });
      setWinners((current) =>
        current.map((winner) => (winner.id === winnerId ? response.winner : winner))
      );
      setProofForms((current) => ({
        ...current,
        [winnerId]: "",
      }));
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeactivate = async () => {
    setError("");
    setMessage("");
    setIsBusy(true);

    try {
      const response = await deactivateSubscription(token);
      setSubscription(response.subscription);
      setMessage(response.message);
      await refreshUser();
      await loadScores();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsBusy(false);
    }
  };

  const selectedCharity = charities.find((charity) => charity.id === user?.selectedCharityId);
  const totalWinnings = winners.reduce((sum, winner) => sum + (winner.prizeAmount || 0), 0);
  const totalDonations = donations.reduce((sum, donation) => sum + donation.amount, 0);

  return (
    <div className="page-stack">
      <PageSection title={`Welcome, ${user?.name}`} description="Your account overview.">
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Role</span>
            <strong>{user?.role}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Selected charity</span>
            <strong>{selectedCharity?.name || "Not selected"}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Contribution</span>
            <strong>
              {user?.contributionPercentage ? `${user.contributionPercentage}%` : "Not set"}
            </strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Stored scores</span>
            <strong>{scores.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Winners</span>
            <strong>{winners.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Published draws</span>
            <strong>{draws.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Winnings overview</span>
            <strong>${totalWinnings.toFixed(2)}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Independent donations</span>
            <strong>${totalDonations.toFixed(2)}</strong>
          </div>
        </div>
      </PageSection>

      <PageSection
        id="subscription-section"
        title="Subscription"
        description="Choose a plan to activate your subscription. Assignment mode uses a demo payment flow."
      >
        <div className="inline-actions">
          <button className="button" disabled={isBusy} onClick={() => handleActivate("monthly")} type="button">
            Activate Monthly (Demo)
          </button>
          <button className="button" disabled={isBusy} onClick={() => handleActivate("yearly")} type="button">
            Activate Yearly (Demo)
          </button>
          {isStripeManaged ? (
            <button
              className="button button-secondary"
              disabled={isBusy}
              onClick={handleManageBilling}
              type="button"
            >
              Manage Billing
            </button>
          ) : null}
          <button
            className="button button-secondary"
            disabled={isBusy || !subscription || isStripeManaged}
            onClick={handleDeactivate}
            type="button"
          >
            Cancel Local Plan
          </button>
        </div>

        {subscription ? (
          <div className="detail-list">
            <p>
              <strong>Status:</strong> {subscription.status}
            </p>
            {subscription.cancellationScheduled ? (
              <p>
                <strong>Cancellation:</strong> Scheduled for period end
              </p>
            ) : null}
            <p>
              <strong>Plan:</strong> {subscription.planType}
            </p>
            <p>
              <strong>Provider:</strong> {subscription.provider || "mock"}
            </p>
            <p>
              <strong>Ends:</strong> {subscription.endsAt ? new Date(subscription.endsAt).toLocaleString() : "N/A"}
            </p>
          </div>
        ) : (
          <p className="muted-text">No subscription active yet.</p>
        )}

        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </PageSection>

      <PageSection title="Score Access" description="Your score history depends on an active subscription.">
        {scoreAccessMessage ? (
          <p className="muted-text">{scoreAccessMessage}</p>
        ) : (
          <div className="detail-list">
            <p>
              <strong>Latest scores available:</strong> {scores.length}
            </p>
            <p>
              <strong>Status:</strong> {scores.length ? "Ready for draw entry" : "No scores saved yet"}
            </p>
          </div>
        )}
      </PageSection>

      <PageSection title="Winner History" description="Your draw outcomes and verification status.">
        {winners.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Matches</th>
                  <th>Prize</th>
                  <th>Status</th>
                  <th>Proof</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((winner) => (
                  <tr key={winner.id}>
                    <td>{winner.id}</td>
                    <td>{winner.matchCount}</td>
                    <td>${(winner.prizeAmount || 0).toFixed(2)}</td>
                    <td>{winner.status}</td>
                    <td>
                      {winner.proofImageUrl ? (
                        <a href={winner.proofImageUrl} rel="noreferrer" target="_blank">
                          View proof
                        </a>
                      ) : (
                        <div className="proof-upload">
                          <input
                            onChange={(event) => handleProofChange(winner.id, event.target.value)}
                            placeholder="https://example.com/proof.jpg"
                            type="url"
                            value={proofForms[winner.id] || ""}
                          />
                          <button
                            className="button button-secondary"
                            disabled={isBusy || winner.status === "paid"}
                            onClick={() => handleProofSubmit(winner.id)}
                            type="button"
                          >
                            Submit proof
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted-text">No winners yet.</p>
        )}
      </PageSection>

      <PageSection title="Payments" description="Your recent mock subscription and donation transactions.">
        {payments.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 5).map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.transactionType}</td>
                    <td>${payment.amount.toFixed(2)}</td>
                    <td>{payment.status}</td>
                    <td>{payment.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted-text">No payment activity yet.</p>
        )}
      </PageSection>

      <PageSection title="Draw Participation" description="Recent published draws on the platform.">
        {draws.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Draw</th>
                  <th>Numbers</th>
                  <th>Participants</th>
                  <th>Winners</th>
                </tr>
              </thead>
              <tbody>
                {draws.slice(0, 5).map((draw) => (
                  <tr key={draw.id}>
                    <td>{draw.id}</td>
                    <td>{draw.drawNumbers.join(", ")}</td>
                    <td>{draw.totalParticipants}</td>
                    <td>{draw.totalWinners}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted-text">No draws have been published yet.</p>
        )}
      </PageSection>
    </div>
  );
}

export default DashboardPage;
