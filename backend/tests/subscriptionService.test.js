const subscriptionService = require("../src/services/subscriptionService");

describe("subscriptionService", () => {
  it("returns monthly and yearly plans", () => {
    const plans = subscriptionService.listPlans();

    expect(plans).toHaveLength(2);
    expect(plans.map((plan) => plan.type).sort()).toEqual(["monthly", "yearly"]);
  });

  it("calculates end dates using UTC days", () => {
    const startDate = new Date("2026-01-01T00:00:00.000Z");
    const endDate = subscriptionService.calculateEndDate(startDate, 30);

    expect(endDate.toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });

  it("returns null for unknown plans", () => {
    expect(subscriptionService.getPlan("weekly")).toBeNull();
  });
});
