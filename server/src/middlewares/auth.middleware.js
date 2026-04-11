const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  try {
    const token = req.signedCookies?.auth_token;

    if (!token) {
      return res.status(401).json({
        message: "Non authentifié.",
        success: false,
        error: true,
      });
    }

    const publicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");

    const payload = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
    });

    req.userId = payload.userId;
    req.userRole = payload.userRole;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Session invalide ou expirée. Veuillez vous reconnecter.",
      success: false,
      error: true,
    });
  }
};

module.exports = requireAuth;
