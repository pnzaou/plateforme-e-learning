const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const resend = require("../libs/resend");

const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(422).json({
        message: "Tous les champs sont obligatoires.",
        success: false,
        error: true,
      });
    }

    const user = await User.findOne({ email }).select("+motDePasse");
    if (!user) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
        success: false,
        error: true,
      });
    }

    if (!user.estActif) {
      return res.status(403).json({
        message: "Compte désactivé. Contactez un administrateur.",
        success: false,
        error: true,
      });
    }

    const isPasswordValid = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
        success: false,
        error: true,
      });
    }

    await User.findByIdAndUpdate(user._id, {
      dernierConnexion: new Date(),
    });

    res.clearCookie("auth_token", {
      path: "/",
      domain: "localhost",
      httpOnly: true,
      signed: true,
    });

    const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, "\n");
    const token = jwt.sign(
      { userId: user._id, userRole: user.role },
      privateKey,
      {
        algorithm: "RS256",
        expiresIn: "8h",
      },
    );

    res.cookie("auth_token", token, {
      path: "/",
      domain: "localhost",
      maxAge: 8 * 60 * 60 * 1000,
      httpOnly: true,
      signed: true,
    });

    return res.status(200).json({
      message: "Connexion réussie.",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Erreur /api/auth/login :", error);
    return res.status(500).json({
      message: "Erreur lors de la connexion.",
      success: false,
      error: true,
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select(
        "-motDePasse -dernierConnexion -resetPasswordToken -resetPasswordExpire",
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "Compte introuvable.",
        success: false,
        error: true,
      });
    }


    if (!user.estActif) {
      return res.status(403).json({
        message: "Compte désactivé.",
        success: false,
        error: true,
      });
    }

    return res.status(200).json({
      message: "Utilisateur récupéré avec succès.",
      success: true,
      error: false,
      data: user,
    });
  } catch (error) {
    console.error("Erreur /api/auth/me :", error);
    return res.status(500).json({
      message: "Erreur serveur.",
      success: false,
      error: true,
    });
  }
};

const logout = async (req, res) => {
  res.clearCookie("auth_token", {
    path: "/",
    domain: "localhost",
    httpOnly: true,
    signed: true,
  });

  return res.status(200).json({
    message: "Déconnexion réussie.",
    success: true,
    error: false,
  });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(422).json({
        message: "l'email est obligatoire.",
        success: false,
        error: true,
      });
    }

    const genericResponse = () =>
      res.status(200).json({
        message:
          "Si cet email est associé à un compte, un lien de réinitialisation a été envoyé.",
        success: true,
        error: false,
      });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.estActif) return genericResponse();

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordToken = rawToken;
    user.resetPasswordExpire = expiresAt;
    await user.save();

    const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:5173";

    const resetLink = `${ADMIN_URL}/reset-password?token=${rawToken}`;
    const FROM = "ISI Learn <onboarding@resend.dev>";

    await resend.emails.send({
      from: FROM,
      to: user.email,
      subject: "Réinitialisation de votre mot de passe — ISI Learn",
      html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
            <h2 style="color:#0f172a;margin-bottom:8px">Réinitialisation du mot de passe</h2>
            <p style="color:#475569">Bonjour ${user.prenom},</p>
            <p style="color:#475569">Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable <strong>15 minutes</strong>.</p>
            <a href="${resetLink}"
                style="display:inline-block;margin:24px 0;padding:12px 28px;background:#0284c7;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">
                Réinitialiser mon mot de passe
            </a>
            <p style="color:#94a3b8;font-size:12px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe ne sera pas modifié.</p>
            </div>
        `,
    });

    return genericResponse();
  } catch (error) {
    console.log("Erreur /api/auth/forgot-password", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", success: false, error: true });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, motDePasse, confirmMotDePasse } = req.body;

    if (!token || !motDePasse || !confirmMotDePasse) {
      return res.status(422).json({
        message: "Tous les champs sont obligatoires.",
        success: false,
        error: true,
      });
    }

    if (motDePasse !== confirmMotDePasse) {
      return res.status(400).json({
        message: "Les mots de passe ne correspondent pas.",
        success: false,
        error: true,
      });
    }

    if (motDePasse.length < 8) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères.",
        success: false,
        error: true,
      });
    }

    const user = await User.findOne({ resetPasswordToken: token });
    if (!user || user.resetPasswordExpire < new Date()) {
      return res.status(400).json({
        message: "Lien invalide ou expiré.",
        success: false,
        error: true,
      });
    }

    if (!user.estActif) {
      return res.status(403).json({
        message: "Compte désactivé.",
        success: false,
        error: true,
      });
    }

    const salt = await bcrypt.genSalt(12);
    user.motDePasse = await bcrypt.hash(motDePasse, salt);
    user.isDefaultPasswordChanged = true;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const FROM = "ISI Learn <onboarding@resend.dev>";

    await resend.emails.send({
      from: FROM,
      to: user.email,
      subject: "Mot de passe modifié — ISI Learn",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#0f172a">Mot de passe modifié</h2>
        <p style="color:#475569">Bonjour ${user.prenom},</p>
        <p style="color:#475569">Votre mot de passe a été réinitialisé avec succès le <strong>${new Date().toLocaleString("fr-FR")}</strong>.</p>
        <p style="color:#475569">Si vous n'êtes pas à l'origine de cette action, contactez immédiatement votre équipe technique.</p>
        </div>
        `,
    });

    return res.status(200).json({
      message: "Mot de passe réinitialisé avec succès.",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Erreur /api/auth/reset-password :", error);
    return res.status(500).json({
      message: "Erreur serveur.",
      success: false,
      error: true,
    });
  }
};

const changedPassword = async (req, res) => {
  try {
    const { oldMotDePasse, newMotDePasse, confirmMotDePasse } = req.body;
    if (!oldMotDePasse || !newMotDePasse || !confirmMotDePasse) {
      return res.status(422).json({
        message: "Tous les champs sont obligatoires.",
        success: false,
        error: true,
      });
    }

    if (newMotDePasse !== confirmMotDePasse) {
      return res.status(400).json({
        message: "Les deux mots de passe ne correspondent pas.",
        success: false,
        error: true,
      });
    }

    if (newMotDePasse.length < 8) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères.",
        success: false,
        error: true,
      });
    }

    if (oldMotDePasse === newMotDePasse) {
      return res.status(400).json({
        message: "Le nouveau mot de passe doit être différent de l'ancien.",
        success: false,
        error: true,
      });
    }

    const user = await User.findById(req.userId, { motDePasse: 1 });
    if (!user) {
      return res.status(404).json({
        message: "Compte introuvable.",
        success: false,
        error: true,
      });
    }

    const isValid = await bcrypt.compare(oldMotDePasse, user.motDePasse);
    if (!isValid) {
      return res.status(401).json({
        message: "Ancien mot de passe incorrect.",
        success: false,
        error: true,
      });
    }

    const salt = await bcrypt.genSalt(12);
    user.motDePasse = await bcrypt.hash(newMotDePasse, salt);
    user.isDefaultPasswordChanged = true;
    await user.save();

    const FROM = "ISI Learn <onboarding@resend.dev>";

    await resend.emails.send({
      from: FROM,
      to: user.email,
      subject: "Mot de passe modifié — ISI Learn",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#0f172a">Mot de passe modifié</h2>
          <p style="color:#475569">Bonjour ${user.prenom},</p>
          <p style="color:#475569">Votre mot de passe a été modifié avec succès le <strong>${new Date().toLocaleString("fr-FR")}</strong>.</p>
          <p style="color:#475569">Si vous n'êtes pas à l'origine de cette action, contactez immédiatement votre équipe technique.</p>
        </div>
      `,
    });

    return res.status(200).json({
      message: "Mot de passe modifié avec succès.",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Erreur /api/auth/change-password :", error);
    return res.status(500).json({
      message: "Erreur serveur.",
      success: false,
      error: true,
    });
  }
};

module.exports = {
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  changedPassword
};
