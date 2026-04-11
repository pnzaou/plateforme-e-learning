const isAdmin = (req, res, next) => {
  console.log("LE RÔLE", req.userRole);
  if (req.userRole !== "admin") {
    return res.status(403).json({
      message: "Vous n'êtes pas autorisé à réaliser cet action.",
      success: false,
      error: true,
    });
  }

  next();
};

const isTeacher = (req, res, next) => {
  if (req.userRole !== "enseignant") {
    return res.status(403).json({
      message: "Vous n'êtes pas autorisé à réaliser cet action.",
      success: false,
      error: true,
    });
  }

  next();
};

const isStudent = (req, res, next) => {
  if (req.userRole !== "etudiant") {
    return res.status(403).json({
      message: "Vous n'êtes pas autorisé à réaliser cet action.",
      success: false,
      error: true,
    });
  }

  next();
};

module.exports = { isAdmin, isTeacher, isStudent };
