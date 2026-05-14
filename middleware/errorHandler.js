const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with this information already exists",
    });
  }

  if (err.code === "P2025") {
    return res
      .status(404)
      .json({ success: false, message: "Record not found" });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ success: false, message: "File size exceeds 60 MB limit" });
  }

  // Handle Multer file count limit error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
