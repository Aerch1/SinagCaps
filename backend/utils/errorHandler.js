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
      return await fn(req, res, next);
    } catch (error) {
      console.error(`Error in ${fn.name}:`, error);
      if (res.headersSent) return next(error);

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
        });
      }

      if (error.code === "ER_DUP_ENTRY") {
        // optionally inspect error.sqlMessage for column name
        return res.status(400).json({
          success: false,
          message: "Resource already exists",
          code: "DUPLICATE",
        });
      }

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
          code: "JWT_INVALID",
        });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
          code: "JWT_EXPIRED",
        });
      }

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
