jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

jest.mock("../src/models/userModel", () => ({
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
}));

jest.mock("../src/models/charityModel", () => ({
  findCharityById: jest.fn(),
}));

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../src/models/userModel");
const charityModel = require("../src/models/charityModel");
const { signup } = require("../src/controllers/authController");

describe("authController.signup", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    userModel.findUserByEmail.mockResolvedValue(null);
    charityModel.findCharityById.mockResolvedValue({
      id: 1,
      name: "Test Charity",
    });
    bcrypt.hash.mockResolvedValue("hashed-password");
    jwt.sign.mockReturnValue("fake-token");
  });

  it("forces user role even when role is sent in payload", async () => {
    userModel.createUser.mockResolvedValue({
      id: 10,
      name: "Audit User",
      email: "audit@example.com",
      role: "user",
      is_active: true,
      selected_charity_id: 1,
      selected_charity_name: "Test Charity",
      contribution_percentage: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const req = {
      body: {
        name: "Audit User",
        email: "audit@example.com",
        password: "Password123!",
        role: "admin",
        charityId: 1,
        contributionPercentage: 15,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await signup(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(userModel.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "user",
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
