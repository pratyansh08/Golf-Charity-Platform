const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const charityModel = require("../models/charityModel");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "golf_charity_token";

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.is_active,
  stripeCustomerId: user.stripe_customer_id || null,
  selectedCharityId: user.selected_charity_id,
  selectedCharityName: user.selected_charity_name || null,
  contributionPercentage: user.contribution_percentage,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

const generateToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

const getCookieSettings = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const maxAge = 7 * 24 * 60 * 60 * 1000;

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge,
  };
};

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieSettings());
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...getCookieSettings(),
    maxAge: undefined,
  });
};

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, charityId, contributionPercentage } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required.");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await userModel.findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists.");
  }

  let normalizedCharityId = null;
  let normalizedContributionPercentage = null;

  if (charityId !== undefined && charityId !== null && charityId !== "") {
    if (!Number.isInteger(charityId) || charityId <= 0) {
      throw new ApiError(400, "Charity ID must be a positive integer.");
    }

    const charity = await charityModel.findCharityById(charityId);

    if (!charity) {
      throw new ApiError(404, "Selected charity was not found.");
    }

    normalizedCharityId = charityId;
  }

  if (contributionPercentage !== undefined && contributionPercentage !== null && contributionPercentage !== "") {
    if (
      typeof contributionPercentage !== "number" ||
      Number.isNaN(contributionPercentage) ||
      contributionPercentage < 10 ||
      contributionPercentage > 100
    ) {
      throw new ApiError(400, "Contribution percentage must be between 10 and 100.");
    }

    normalizedContributionPercentage = contributionPercentage;
  }

  if (normalizedContributionPercentage !== null && normalizedCharityId === null) {
    throw new ApiError(400, "Select a charity before setting a contribution percentage.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await userModel.createUser({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: "user",
    selectedCharityId: normalizedCharityId,
    contributionPercentage: normalizedContributionPercentage,
  });

  const token = generateToken(user);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: "Signup successful.",
    token,
    user: sanitizeUser(user),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await userModel.findUserByEmail(normalizedEmail);

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!user.is_active) {
    throw new ApiError(403, "This account is inactive. Please contact support.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = generateToken(user);
  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    message: "Login successful.",
    token,
    user: sanitizeUser(user),
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

const updateCurrentUser = asyncHandler(async (req, res) => {
  const { name, email, charityId, contributionPercentage } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Name is required.");
  }

  if (typeof email !== "string" || !email.trim()) {
    throw new ApiError(400, "Email is required.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await userModel.findUserByEmail(normalizedEmail);

  if (existingUser && String(existingUser.id) !== String(req.user.id)) {
    throw new ApiError(409, "A user with this email already exists.");
  }

  let normalizedCharityId = null;
  let normalizedContributionPercentage = null;

  if (charityId !== undefined && charityId !== null && charityId !== "") {
    if (!Number.isInteger(charityId) || charityId <= 0) {
      throw new ApiError(400, "Charity ID must be a positive integer.");
    }

    const charity = await charityModel.findCharityById(charityId);

    if (!charity) {
      throw new ApiError(404, "Selected charity was not found.");
    }

    normalizedCharityId = charityId;
  }

  if (contributionPercentage !== undefined && contributionPercentage !== null && contributionPercentage !== "") {
    if (
      typeof contributionPercentage !== "number" ||
      Number.isNaN(contributionPercentage) ||
      contributionPercentage < 10 ||
      contributionPercentage > 100
    ) {
      throw new ApiError(400, "Contribution percentage must be between 10 and 100.");
    }

    normalizedContributionPercentage = contributionPercentage;
  }

  const updatedUser = await userModel.updateUserProfile({
    userId: req.user.id,
    name: name.trim(),
    email: normalizedEmail,
    selectedCharityId: normalizedCharityId,
    contributionPercentage: normalizedCharityId ? normalizedContributionPercentage || 10 : null,
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: sanitizeUser(updatedUser),
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required.");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters long.");
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, req.user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Current password is incorrect.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await userModel.updatePasswordHash({
    userId: req.user.id,
    passwordHash,
  });

  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
  });
});

const getAdminDashboard = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the admin dashboard.",
    user: sanitizeUser(req.user),
  });
});

const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

module.exports = {
  signup,
  login,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  getAdminDashboard,
  logout,
};
