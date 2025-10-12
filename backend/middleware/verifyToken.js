// middleware/verifyToken.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // ✅ Support both cookie names (your system sometimes uses token or accessToken)
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

    // ✅ Attach both userId and email (if available)
    req.userId = decoded.userId;
    req.userEmail = decoded.email || null;

    // ✅ Keep your existing req.user structure to avoid breaking dependencies
    req.user = {
      id: decoded.userId,
      email: decoded.email || null,
    };

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
