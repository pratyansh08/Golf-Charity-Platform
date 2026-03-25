const request = require("supertest");
const app = require("../src/app");

describe("GET /api/health", () => {
  it("returns API health payload", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("API is running.");
    expect(response.body.timestamp).toBeTruthy();
  });
});
