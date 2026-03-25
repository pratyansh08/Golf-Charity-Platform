import { useEffect, useState } from "react";
import PageSection from "../components/PageSection";
import { useAuth } from "../context/AuthContext";
import {
  changePassword,
  getCharities,
  getMyDonations,
  getMySubscriptionHistory,
  updateCurrentUser,
} from "../services/api";

function ProfilePage() {
  const { token, user, refreshUser } = useAuth();
  const [charities, setCharities] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [donations, setDonations] = useState([]);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    charityId: user?.selectedCharityId ? String(user.selectedCharityId) : "",
    contributionPercentage: user?.contributionPercentage || 10,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
      charityId: user?.selectedCharityId ? String(user.selectedCharityId) : "",
      contributionPercentage: user?.contributionPercentage || 10,
    });
  }, [user]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [charitiesResponse, historyResponse, donationsResponse] = await Promise.all([
          getCharities(),
          getMySubscriptionHistory(token),
          getMyDonations(token),
        ]);
        setCharities(charitiesResponse.charities);
        setSubscriptions(historyResponse.subscriptions);
        setPayments(historyResponse.payments);
        setDonations(donationsResponse.donations);
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadProfile();
  }, [token]);

  const handleProfileChange = (event) => {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handlePasswordChange = (event) => {
    setPasswordForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await updateCurrentUser(token, {
        name: profileForm.name,
        email: profileForm.email,
        charityId: profileForm.charityId ? Number.parseInt(profileForm.charityId, 10) : null,
        contributionPercentage: profileForm.charityId
          ? Number.parseFloat(profileForm.contributionPercentage)
          : null,
      });
      setMessage(response.message);
      await refreshUser();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await changePassword(token, passwordForm);
      setMessage(response.message);
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="page-stack">
      <PageSection title="Profile" description="Manage your account details and charity preference.">
        <form className="stack-form" onSubmit={handleProfileSubmit}>
          <input name="name" onChange={handleProfileChange} placeholder="Full name" value={profileForm.name} />
          <input
            name="email"
            onChange={handleProfileChange}
            placeholder="Email"
            type="email"
            value={profileForm.email}
          />
          <select name="charityId" onChange={handleProfileChange} value={profileForm.charityId}>
            <option value="">No charity selected</option>
            {charities.map((charity) => (
              <option key={charity.id} value={charity.id}>
                {charity.name}
              </option>
            ))}
          </select>
          <input
            disabled={!profileForm.charityId}
            max="100"
            min="10"
            name="contributionPercentage"
            onChange={handleProfileChange}
            type="number"
            value={profileForm.contributionPercentage}
          />
          <button className="button" type="submit">
            Save profile
          </button>
        </form>
      </PageSection>

      <PageSection title="Password" description="Update your password securely.">
        <form className="stack-form" onSubmit={handlePasswordSubmit}>
          <input
            name="currentPassword"
            onChange={handlePasswordChange}
            placeholder="Current password"
            type="password"
            value={passwordForm.currentPassword}
          />
          <input
            minLength="8"
            name="newPassword"
            onChange={handlePasswordChange}
            placeholder="New password"
            type="password"
            value={passwordForm.newPassword}
          />
          <button className="button" type="submit">
            Change password
          </button>
        </form>
        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </PageSection>

      <PageSection title="Subscription History" description="Your subscription timeline and payment records.">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Status</th>
                <th>Ends</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>{subscription.planType}</td>
                  <td>{subscription.status}</td>
                  <td>{subscription.endsAt ? new Date(subscription.endsAt).toLocaleDateString() : "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction</th>
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

      <PageSection title="Donations" description="Your independent charity donations.">
        {donations.length ? (
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
        ) : (
          <p className="muted-text">No donations recorded yet.</p>
        )}
      </PageSection>
    </div>
  );
}

export default ProfilePage;
