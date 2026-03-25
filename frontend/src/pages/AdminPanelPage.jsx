import { useEffect, useState } from "react";
import PageSection from "../components/PageSection";
import { useAuth } from "../context/AuthContext";
import {
  createAdminCharity,
  deleteAdminCharity,
  getAdminAnalytics,
  getAdminCharities,
  getAdminDonations,
  getAdminDraws,
  getAdminScores,
  getAdminSubscriptions,
  getAdminUsers,
  getAdminWinners,
  publishAdminDraw,
  reactivateAdminSubscription,
  reviewAdminWinner,
  runAdminDraw,
  simulateAdminDraw,
  suspendAdminSubscription,
  updateAdminCharity,
  updateAdminScore,
} from "../services/api";

function AdminPanelPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [scores, setScores] = useState([]);
  const [winners, setWinners] = useState([]);
  const [charities, setCharities] = useState([]);
  const [draws, setDraws] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [donations, setDonations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [drawMessage, setDrawMessage] = useState("");
  const [drawSimulation, setDrawSimulation] = useState(null);
  const [error, setError] = useState("");
  const [drawControlForm, setDrawControlForm] = useState({
    drawPeriod: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    mode: "random",
    drawNumbers: "",
  });
  const [scoreForm, setScoreForm] = useState({ scoreId: "", value: "", date: "" });
  const [charityForm, setCharityForm] = useState({ name: "", description: "" });

  const loadAdminData = async () => {
    try {
      const [
        usersResponse,
        scoresResponse,
        winnersResponse,
        charitiesResponse,
        drawsResponse,
        subscriptionsResponse,
        donationsResponse,
        analyticsResponse,
      ] =
        await Promise.all([
        getAdminUsers(token),
        getAdminScores(token),
        getAdminWinners(token),
        getAdminCharities(token),
        getAdminDraws(token),
        getAdminSubscriptions(token),
        getAdminDonations(token),
        getAdminAnalytics(token),
      ]);
      setUsers(usersResponse.users);
      setScores(scoresResponse.scores);
      setWinners(winnersResponse.winners);
      setCharities(charitiesResponse.charities);
      setDraws(drawsResponse.draws);
      setSubscriptions(subscriptionsResponse.subscriptions);
      setPayments(subscriptionsResponse.payments);
      setDonations(donationsResponse.donations);
      setAnalytics(analyticsResponse.analytics);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [token]);

  const handleRunDraw = async () => {
    setError("");
    setDrawMessage("");
    setDrawSimulation(null);

    try {
      const response = await runAdminDraw(token, buildDrawPayload());
      setDrawMessage(
        `${response.message} Numbers: ${response.draw.drawNumbers.join(", ")}. Winners: ${response.winners.length}. Period: ${response.draw.drawPeriod}`
      );
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const buildDrawPayload = () => {
    const payload = {
      drawPeriod: drawControlForm.drawPeriod,
    };

    if (drawControlForm.mode === "manual") {
      const numbers = drawControlForm.drawNumbers
        .split(",")
        .map((item) => Number.parseInt(item.trim(), 10))
        .filter((item) => Number.isInteger(item));
      const uniqueNumbers = new Set(numbers);

      if (
        numbers.length !== 5 ||
        uniqueNumbers.size !== 5 ||
        numbers.some((number) => number < 1 || number > 45)
      ) {
        throw new Error("Manual draw numbers must be 5 unique integers between 1 and 45.");
      }

      payload.drawNumbers = numbers;
    }

    return payload;
  };

  const handleSimulateDraw = async () => {
    setError("");
    setDrawMessage("");

    try {
      const response = await simulateAdminDraw(token, buildDrawPayload());
      setDrawSimulation({
        draw: response.draw,
        winners: response.winners,
      });
      setDrawMessage(
        `Simulation complete. Numbers: ${response.draw.drawNumbers.join(", ")}. Winners: ${response.winners.length}`
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDrawControlChange = (event) => {
    setDrawControlForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handlePublishDraw = async (drawId) => {
    setError("");
    setDrawMessage("");

    try {
      const response = await publishAdminDraw(token, drawId);
      setDrawMessage(response.message);
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleScoreChange = (event) => {
    setScoreForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleScoreUpdate = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await updateAdminScore(token, scoreForm.scoreId, {
        value: Number.parseInt(scoreForm.value, 10),
        date: scoreForm.date,
      });
      setScoreForm({ scoreId: "", value: "", date: "" });
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleWinnerReview = async (winnerId, action) => {
    setError("");

    try {
      await reviewAdminWinner(token, winnerId, {
        action,
        adminNote: action === "approve" ? "Approved by admin." : "Rejected by admin.",
      });
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleSubscriptionAction = async (subscriptionId, action) => {
    setError("");

    try {
      if (action === "suspend") {
        await suspendAdminSubscription(token, subscriptionId);
      } else {
        await reactivateAdminSubscription(token, subscriptionId);
      }

      await loadAdminData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleCharityFormChange = (event) => {
    setCharityForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleCreateCharity = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await createAdminCharity(token, charityForm);
      setCharityForm({ name: "", description: "" });
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleEditCharity = async (charity) => {
    setError("");

    try {
      await updateAdminCharity(token, charity.id, {
        name: charity.name,
        description: charity.description || "",
      });
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDeleteCharity = async (charityId) => {
    setError("");

    try {
      await deleteAdminCharity(token, charityId);
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="page-stack">
      <PageSection
        description="Run draws and manage platform data."
        title="Admin Actions"
      >
        <form className="inline-form" onSubmit={(event) => event.preventDefault()}>
          <label className="field">
            <span>Draw Period</span>
            <input
              name="drawPeriod"
              onChange={handleDrawControlChange}
              type="date"
              value={drawControlForm.drawPeriod}
            />
          </label>
          <label className="field">
            <span>Mode</span>
            <select name="mode" onChange={handleDrawControlChange} value={drawControlForm.mode}>
              <option value="random">Random</option>
              <option value="manual">Manual Numbers</option>
            </select>
          </label>
          <label className="field">
            <span>Manual Numbers</span>
            <input
              disabled={drawControlForm.mode !== "manual"}
              name="drawNumbers"
              onChange={handleDrawControlChange}
              placeholder="e.g. 3,11,18,27,40"
              value={drawControlForm.drawNumbers}
            />
          </label>
          <button className="button button-secondary" onClick={handleSimulateDraw} type="button">
            Simulate Draw
          </button>
          <button className="button" onClick={handleRunDraw} type="button">
            Run Draft Draw
          </button>
        </form>

        {drawMessage ? <p className="form-success">{drawMessage}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {drawSimulation ? (
          <div className="detail-list">
            <p>
              <strong>Simulated Period:</strong> {drawSimulation.draw.drawPeriod}
            </p>
            <p>
              <strong>Simulated Numbers:</strong> {drawSimulation.draw.drawNumbers.join(", ")}
            </p>
            <p>
              <strong>Participants:</strong> {drawSimulation.draw.totalParticipants}
            </p>
            <p>
              <strong>Winners:</strong> {drawSimulation.draw.totalWinners}
            </p>
            <p>
              <strong>Prize Pool:</strong> ${drawSimulation.draw.prizePoolAmount.toFixed(2)}
            </p>
          </div>
        ) : null}
      </PageSection>

      {analytics ? (
        <PageSection description="Live reporting snapshot." title="Analytics">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Users</span>
              <strong>{analytics.totalUsers}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Payment volume</span>
              <strong>${analytics.totalPaymentVolume.toFixed(2)}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Prize pool total</span>
              <strong>${analytics.totalPrizePool.toFixed(2)}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Published draws</span>
              <strong>{analytics.totalPublishedDraws}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Draft draws</span>
              <strong>{analytics.totalDraftDraws}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Charity contribution</span>
              <strong>${analytics.totalCharityContribution.toFixed(2)}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Independent donations</span>
              <strong>${analytics.totalDonationAmount.toFixed(2)}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Rollover reserved</span>
              <strong>${analytics.totalRolloverReserved.toFixed(2)}</strong>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Total</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {(analytics.subscriptionMix || []).map((entry) => (
                  <tr key={entry.planType}>
                    <td>{entry.planType}</td>
                    <td>{entry.totalCount}</td>
                    <td>{entry.activeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Winner Status</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {(analytics.winnerStatusMix || []).map((entry) => (
                  <tr key={entry.status}>
                    <td>{entry.status}</td>
                    <td>{entry.totalCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Top Charity</th>
                  <th>Donation Total</th>
                </tr>
              </thead>
              <tbody>
                {(analytics.topCharitiesByDonation || []).map((entry) => (
                  <tr key={entry.charityId}>
                    <td>{entry.charityName}</td>
                    <td>${entry.donationTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Prize Pool</th>
                  <th>Charity Total</th>
                  <th>Winners</th>
                </tr>
              </thead>
              <tbody>
                {(analytics.monthlyTrend || []).map((entry) => (
                  <tr key={entry.month}>
                    <td>{entry.month}</td>
                    <td>${entry.prizePoolTotal.toFixed(2)}</td>
                    <td>${entry.charityTotal.toFixed(2)}</td>
                    <td>{entry.winnerTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageSection>
      ) : null}

      <PageSection description="All registered users." title="Users">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Charity</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.selectedCharityName || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection description="View and edit stored scores." title="Scores">
        <form className="inline-form" onSubmit={handleScoreUpdate}>
          <input name="scoreId" onChange={handleScoreChange} placeholder="Score ID" required value={scoreForm.scoreId} />
          <input
            max="45"
            min="1"
            name="value"
            onChange={handleScoreChange}
            placeholder="Value"
            required
            type="number"
            value={scoreForm.value}
          />
          <input name="date" onChange={handleScoreChange} required type="date" value={scoreForm.date} />
          <button className="button" type="submit">
            Update score
          </button>
        </form>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Value</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score) => (
                <tr key={score.id}>
                  <td>{score.id}</td>
                  <td>{score.userName}</td>
                  <td>{score.value}</td>
                  <td>{score.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection description="Review subscriptions and the linked payment ledger." title="Subscriptions">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Ends</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>{subscription.userName}</td>
                  <td>{subscription.planType}</td>
                  <td>{subscription.status}</td>
                  <td>{subscription.endsAt ? new Date(subscription.endsAt).toLocaleDateString() : "N/A"}</td>
                  <td className="inline-actions">
                    <button
                      className="button button-secondary"
                      disabled={subscription.status !== "active"}
                      onClick={() => handleSubscriptionAction(subscription.id, "suspend")}
                      type="button"
                    >
                      Suspend
                    </button>
                    <button
                      className="button"
                      disabled={subscription.status === "active"}
                      onClick={() => handleSubscriptionAction(subscription.id, "reactivate")}
                      type="button"
                    >
                      Reactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
              {payments.map((payment) => (
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
      </PageSection>

      <PageSection description="Approve or reject submitted winner proof." title="Winners">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Match</th>
                <th>Prize</th>
                <th>Status</th>
                <th>Proof</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((winner) => (
                <tr key={winner.id}>
                  <td>{winner.id}</td>
                  <td>{winner.userName}</td>
                  <td>{winner.matchCount}</td>
                  <td>${(winner.prizeAmount || 0).toFixed(2)}</td>
                  <td>{winner.status}</td>
                  <td>
                    {winner.proofImageUrl ? (
                      <a href={winner.proofImageUrl} rel="noreferrer" target="_blank">
                        View proof
                      </a>
                    ) : (
                      "No proof"
                    )}
                  </td>
                  <td className="inline-actions">
                    <button
                      className="button"
                      disabled={winner.status !== "pending" || !winner.proofImageUrl}
                      onClick={() => handleWinnerReview(winner.id, "approve")}
                      type="button"
                    >
                      Approve
                    </button>
                    <button
                      className="button"
                      disabled={winner.status !== "approved" || !winner.proofImageUrl}
                      onClick={() => handleWinnerReview(winner.id, "pay")}
                      type="button"
                    >
                      Mark Paid
                    </button>
                    <button
                      className="button button-secondary"
                      disabled={winner.status !== "pending" || !winner.proofImageUrl}
                      onClick={() => handleWinnerReview(winner.id, "reject")}
                      type="button"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection description="Published draw history and recent outcomes." title="Draw History">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Period</th>
                <th>Status</th>
                <th>Numbers</th>
                <th>Participants</th>
                <th>Winners</th>
                <th>Prize Pool</th>
                <th>Rollover Out</th>
                <th>Triggered By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {draws.map((draw) => (
                <tr key={draw.id}>
                  <td>{draw.id}</td>
                  <td>{draw.drawPeriod || "-"}</td>
                  <td>{draw.status}</td>
                  <td>{draw.drawNumbers.join(", ")}</td>
                  <td>{draw.totalParticipants}</td>
                  <td>{draw.totalWinners}</td>
                  <td>${(draw.prizePoolAmount || 0).toFixed(2)}</td>
                  <td>${(draw.rolloverOutAmount || 0).toFixed(2)}</td>
                  <td>{draw.triggeredBy || "-"}</td>
                  <td>
                    <button
                      className="button button-secondary"
                      disabled={draw.status === "published"}
                      onClick={() => handlePublishDraw(draw.id)}
                      type="button"
                    >
                      {draw.status === "published" ? "Published" : "Publish"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection description="Independent donation activity across the platform." title="Donations">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Charity</th>
                <th>Amount</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id}>
                  <td>{donation.charityName}</td>
                  <td>${donation.amount.toFixed(2)}</td>
                  <td>{donation.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection description="Create, update, and delete charities." title="Charities">
        <form className="stack-form" onSubmit={handleCreateCharity}>
          <input
            name="name"
            onChange={handleCharityFormChange}
            placeholder="Charity name"
            required
            value={charityForm.name}
          />
          <textarea
            name="description"
            onChange={handleCharityFormChange}
            placeholder="Description"
            rows="3"
            value={charityForm.description}
          />
          <button className="button" type="submit">
            Create charity
          </button>
        </form>

        <div className="list-grid">
          {charities.map((charity) => (
            <article className="list-card" key={charity.id}>
              <input
                onChange={(event) =>
                  setCharities((current) =>
                    current.map((item) =>
                      item.id === charity.id ? { ...item, name: event.target.value } : item
                    )
                  )
                }
                value={charity.name}
              />
              <textarea
                onChange={(event) =>
                  setCharities((current) =>
                    current.map((item) =>
                      item.id === charity.id ? { ...item, description: event.target.value } : item
                    )
                  )
                }
                rows="3"
                value={charity.description || ""}
              />
              <div className="inline-actions">
                <button className="button" onClick={() => handleEditCharity(charity)} type="button">
                  Save
                </button>
                <button
                  className="button button-secondary"
                  onClick={() => handleDeleteCharity(charity.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </PageSection>
    </div>
  );
}

export default AdminPanelPage;
