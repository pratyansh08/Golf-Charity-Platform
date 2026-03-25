const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

class ApiRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  try {
    const headers = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiRequestError(data.message || "Request failed.", response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    throw new ApiRequestError(
      "Unable to connect to the server. Please check that the backend is running.",
      0
    );
  }
}

function authHeaders(token) {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export function signupUser(payload) {
  return request("/auth/signup", { body: payload, method: "POST" });
}

export function loginUser(payload) {
  return request("/auth/login", { body: payload, method: "POST" });
}

export function getCurrentUser(token) {
  return request("/auth/me", { headers: authHeaders(token) });
}

export function logoutUser() {
  return request("/auth/logout", { method: "POST" });
}

export function updateCurrentUser(token, payload) {
  return request("/auth/me", {
    body: payload,
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function changePassword(token, payload) {
  return request("/auth/me/password", {
    body: payload,
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function getMySubscription(token) {
  return request("/subscriptions/me", { headers: authHeaders(token) });
}

export function getMySubscriptionHistory(token) {
  return request("/subscriptions/history", { headers: authHeaders(token) });
}

export function activateSubscription(token, planType) {
  return request("/subscriptions/activate", {
    body: { planType },
    headers: authHeaders(token),
    method: "POST",
  });
}

export function createStripeCheckoutSession(token, planType) {
  return request("/subscriptions/checkout-session", {
    body: { planType },
    headers: authHeaders(token),
    method: "POST",
  });
}

export function createStripeBillingPortalSession(token) {
  return request("/subscriptions/billing-portal", {
    headers: authHeaders(token),
    method: "POST",
  });
}

export function deactivateSubscription(token) {
  return request("/subscriptions/deactivate", {
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function getMyWinners(token) {
  return request("/winners/me", { headers: authHeaders(token) });
}

export function uploadWinnerProof(token, winnerId, payload) {
  return request(`/winners/${winnerId}/proof`, {
    body: payload,
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function getMyScores(token) {
  return request("/scores/me", { headers: authHeaders(token) });
}

export function addScore(token, payload) {
  return request("/scores", {
    body: payload,
    headers: authHeaders(token),
    method: "POST",
  });
}

export function getCharities() {
  return request("/charities");
}

export function getCharityDetails(charityId) {
  return request(`/charities/${charityId}`);
}

export function getMyDonations(token) {
  return request("/charities/my-donations", { headers: authHeaders(token) });
}

export function getDraws(token) {
  return request("/draws", { headers: authHeaders(token) });
}

export function selectCharity(token, payload) {
  return request("/charities/select", {
    body: payload,
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function createDonation(token, charityId, payload) {
  return request(`/charities/${charityId}/donate`, {
    body: payload,
    headers: authHeaders(token),
    method: "POST",
  });
}

export function getAdminUsers(token) {
  return request("/admin/users", { headers: authHeaders(token) });
}

export function getAdminScores(token) {
  return request("/admin/scores", { headers: authHeaders(token) });
}

export function getAdminSubscriptions(token) {
  return request("/admin/subscriptions", { headers: authHeaders(token) });
}

export function suspendAdminSubscription(token, subscriptionId) {
  return request(`/admin/subscriptions/${subscriptionId}/suspend`, {
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function reactivateAdminSubscription(token, subscriptionId) {
  return request(`/admin/subscriptions/${subscriptionId}/reactivate`, {
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function getAdminAnalytics(token) {
  return request("/admin/analytics", { headers: authHeaders(token) });
}

export function getAdminDonations(token) {
  return request("/admin/donations", { headers: authHeaders(token) });
}

export function updateAdminScore(token, scoreId, payload) {
  return request(`/admin/scores/${scoreId}`, {
    body: payload,
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function simulateAdminDraw(token, payload) {
  return request("/admin/draws/simulate", {
    body: payload,
    headers: authHeaders(token),
    method: "POST",
  });
}

export function runAdminDraw(token, payload = {}) {
  return request("/admin/draws/run", {
    body: payload,
    headers: authHeaders(token),
    method: "POST",
  });
}

export function publishAdminDraw(token, drawId) {
  return request(`/admin/draws/${drawId}/publish`, {
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function getAdminDraws(token) {
  return request("/admin/draws", { headers: authHeaders(token) });
}

export function getAdminWinners(token) {
  return request("/admin/winners", { headers: authHeaders(token) });
}

export function reviewAdminWinner(token, winnerId, payload) {
  return request(`/admin/winners/${winnerId}/review`, {
    body: payload,
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function getAdminCharities(token) {
  return request("/admin/charities", { headers: authHeaders(token) });
}

export function createAdminCharity(token, payload) {
  return request("/admin/charities", {
    body: payload,
    headers: authHeaders(token),
    method: "POST",
  });
}

export function updateAdminCharity(token, charityId, payload) {
  return request(`/admin/charities/${charityId}`, {
    body: payload,
    headers: authHeaders(token),
    method: "PATCH",
  });
}

export function deleteAdminCharity(token, charityId) {
  return request(`/admin/charities/${charityId}`, {
    headers: authHeaders(token),
    method: "DELETE",
  });
}
