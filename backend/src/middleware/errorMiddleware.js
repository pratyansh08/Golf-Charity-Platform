const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

const errorHandler = (error, req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
