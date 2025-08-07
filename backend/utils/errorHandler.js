// Centralized error handling utility
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleAsyncError = (fn) => {
  return async (req, res, next) => {
    try {
      const result = await fn(req, res, next);
      return result;
    } catch (error) {
      console.error(`Error in ${fn.name}:`, error);

      // Handle different types of errors
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
        });
      }

      // Database errors
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          success: false,
          message: "Resource already exists",
        });
      }

      // JWT errors
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
        });
      }

      // Default server error
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        ...(process.env.NODE_ENV === "development" && {
          error: error.message,
          stack: error.stack,
        }),
      });
    }
  };
};

export const sendResponse = (
  res,
  statusCode,
  success,
  message,
  data = null
) => {
  const response = {
    success,
    message,
    ...(data && { ...data }),
  };

  return res.status(statusCode).json(response);
};
