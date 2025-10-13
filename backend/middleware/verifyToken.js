import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // 🧠 Support both naming conventions for the access token cookie
    const token = req.cookies?.accessToken || req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - no token provided",
      });
    }

    // 🔐 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - invalid token",
      });
    }

    // ✅ Assign decoded values
    req.userId = decoded.userId;
    req.userEmail = decoded.email || null; // 👈 Backward compatible: null if not in token
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
