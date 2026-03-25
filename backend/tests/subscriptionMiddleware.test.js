jest.mock("../src/models/subscriptionModel", () => ({
  getLatestSubscriptionByUserId: jest.fn(),
}));

const subscriptionModel = require("../src/models/subscriptionModel");
const { requireActiveSubscription } = require("../src/middleware/subscriptionMiddleware");

describe("subscriptionMiddleware.requireActiveSubscription", () => {
  it("blocks access when subscription is inactive", async () => {
    subscriptionModel.getLatestSubscriptionByUserId.mockResolvedValue({
      status: "inactive",
      endsAt: "2026-12-01T00:00:00.000Z",
    });

    const req = { user: { id: 99 } };
    const next = jest.fn();

    await requireActiveSubscription(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it("allows active non-expired subscriptions", async () => {
    subscriptionModel.getLatestSubscriptionByUserId.mockResolvedValue({
      status: "active",
      endsAt: "2099-12-01T00:00:00.000Z",
    });

    const req = { user: { id: 100 } };
    const next = jest.fn();

    await requireActiveSubscription(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.subscription.status).toBe("active");
  });
});
