import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    token: "fake-token",
    user: {
      name: "Test User",
      role: "user",
      selectedCharityId: null,
      contributionPercentage: null,
      stripeCustomerId: null,
    },
    refreshUser: vi.fn().mockResolvedValue(null),
  }),
}));

const apiMocks = vi.hoisted(() => ({
  getMySubscription: vi.fn(),
  getMyWinners: vi.fn(),
  getCharities: vi.fn(),
  getDraws: vi.fn(),
  getMySubscriptionHistory: vi.fn(),
  getMyDonations: vi.fn(),
  getMyScores: vi.fn(),
}));

vi.mock("../services/api", () => ({
  activateSubscription: vi.fn(),
  createStripeBillingPortalSession: vi.fn(),
  createStripeCheckoutSession: vi.fn(),
  deactivateSubscription: vi.fn(),
  getDraws: apiMocks.getDraws,
  getCharities: apiMocks.getCharities,
  getMyDonations: apiMocks.getMyDonations,
  getMyScores: apiMocks.getMyScores,
  getMySubscriptionHistory: apiMocks.getMySubscriptionHistory,
  getMySubscription: apiMocks.getMySubscription,
  getMyWinners: apiMocks.getMyWinners,
  uploadWinnerProof: vi.fn(),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getMySubscription.mockResolvedValue({ subscription: null });
    apiMocks.getMyWinners.mockResolvedValue({ winners: [] });
    apiMocks.getCharities.mockResolvedValue({ charities: [] });
    apiMocks.getDraws.mockResolvedValue({ draws: [] });
    apiMocks.getMySubscriptionHistory.mockResolvedValue({ subscriptions: [], payments: [] });
    apiMocks.getMyDonations.mockResolvedValue({ donations: [] });
  });

  it("shows guidance message when score API is blocked by subscription", async () => {
    apiMocks.getMyScores.mockRejectedValue({
      status: 403,
      message: "An active subscription is required.",
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText("Activate a subscription to access and store scores.")
      ).toBeInTheDocument();
    });
  });
});
