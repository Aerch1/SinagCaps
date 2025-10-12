// middleware/verifyToken.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // ✅ token name remains backward compatible
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

    // ✅ Store both userId and email if available
    req.userId = decoded.userId;
    req.userEmail = decoded.email || null;

    // ⚠️ Keep this for compatibility with existing code
    req.user = { id: decoded.userId };

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
