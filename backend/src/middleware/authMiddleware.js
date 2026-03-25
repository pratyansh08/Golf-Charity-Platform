const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "golf_charity_token";

const parseCookies = (cookieHeader) => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((accumulator, entry) => {
      const separatorIndex = entry.indexOf("=");

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
};

const readTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookies = parseCookies(req.headers.cookie || "");
  return cookies[AUTH_COOKIE_NAME] || null;
};

const protect = asyncHandler(async (req, res, next) => {
  const token = readTokenFromRequest(req);

  if (!token) {
    throw new ApiError(401, "Authorization token is missing.");
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token.");
  }

  const user = await userModel.findUserById(decodedToken.sub);

  if (!user) {
    throw new ApiError(401, "User attached to this token no longer exists.");
  }

  if (!user.is_active) {
    throw new ApiError(403, "This account is inactive.");
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication is required."));
  }

  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to access this resource."));
  }

  next();
};

module.exports = {
  protect,
  authorize,
};
