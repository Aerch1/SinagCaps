// middleware/verifyToken.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - no token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - invalid token",
      });
    }

    // ✅ Fix: make both available
    req.userId = decoded.userId;
    req.user = { id: decoded.userId }; // <— this line fixes your 401
    // middleware/verifyToken.js

    next();
  } catch (error) {
    console.error("Token verification error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - token expired",
        tokenExpired: true,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Unauthorized - invalid token",
    });
  }
};
