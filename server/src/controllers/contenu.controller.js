const crypto = require("crypto");
const cloudinary = require("../libs/cloudinary");
const { Contenu, Chapitre, Module, Progression } = require("../models");

// ──────────────────────────────────────────────────
// Helpers d'autorisation
// ──────────────────────────────────────────────────
const canModifyContenus = async (userId, userRole, chapitreId) => {
  const chapitre = await Chapitre.findById(chapitreId);
  if (!chapitre) {
    return { ok: false, code: 404, message: "Chapitre introuvable." };
  }

  const moduleDoc = await Module.findById(chapitre.module);
  if (!moduleDoc) {
    return { ok: false, code: 404, message: "Module introuvable." };
  }

  const estAdmin = userRole === "admin";
  const estProprietaire = moduleDoc.enseignant.toString() === userId;

  if (!estAdmin && !estProprietaire) {
    return {
      ok: false,
      code: 403,
      message: "Vous n'êtes pas autorisé à modifier ce contenu.",
    };
  }

  if (moduleDoc.statut === "en_revision") {
    return {
      ok: false,
      code: 403,
      message:
        "Module en cours de révision. Attendez la validation avant de le modifier.",
    };
  }
  if (moduleDoc.statut === "archive") {
    return {
      ok: false,
      code: 403,
      message: "Un module archivé ne peut pas être modifié.",
    };
  }
  if (moduleDoc.statut === "publie" && !estAdmin) {
    return {
      ok: false,
      code: 403,
      message:
        "Module publié : contactez un administrateur pour toute modification.",
    };
  }

  return { ok: true, chapitre, module: moduleDoc };
};

const canReadContenus = async (userId, userRole, chapitreId) => {
  const chapitre = await Chapitre.findById(chapitreId);
  if (!chapitre) {
    return { ok: false, code: 404, message: "Chapitre introuvable." };
  }
  const moduleDoc = await Module.findById(chapitre.module).populate({
    path: "niveau",
    populate: { path: "filiere", populate: { path: "departement" } },
  });

  const estAdmin = userRole === "admin";
  const estProprietaire = moduleDoc?.enseignant?.toString() === userId;
  const estChefDep =
    userRole === "chef_departement" &&
    moduleDoc?.niveau?.filiere?.departement?.chefDepartement?.toString() ===
      userId;

  if (estAdmin || estProprietaire || estChefDep) {
    return { ok: true, fullAccess: true, chapitre, module: moduleDoc };
  }

  if (
    userRole === "etudiant" &&
    moduleDoc?.statut === "publie" &&
    chapitre.estPublie
  ) {
    return { ok: true, fullAccess: false, chapitre, module: moduleDoc };
  }

  return { ok: false, code: 403, message: "Accès non autorisé." };
};

// ──────────────────────────────────────────────────
// GET /api/chapitres/:chapitreId/contenus
// ──────────────────────────────────────────────────
const getContenusByChapitre = async (req, res) => {
  try {
    const { chapitreId } = req.params;

    const check = await canReadContenus(req.userId, req.userRole, chapitreId);
    if (!check.ok) {
      return res
        .status(check.code)
        .json({ message: check.message, success: false, error: true });
    }

    const filter = { chapitre: chapitreId };
    if (!check.fullAccess) filter.estPublie = true;

    const contenus = await Contenu.find(filter).sort({ ordre: 1 }).lean();

    return res.status(200).json({
      message: "Contenus récupérés.",
      success: true,
      error: false,
      data: contenus,
    });
  } catch (error) {
    console.error("Erreur GET contenus :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ──────────────────────────────────────────────────
// POST /api/upload/signature
// Génère une signature pour upload direct client → Cloudinary
// ──────────────────────────────────────────────────
const generateUploadSignature = async (req, res) => {
  try {
    const { type, moduleId } = req.body;

    if (!type || !["video", "image", "pdf", "audio"].includes(type)) {
      return res.status(422).json({
        message: "Type de fichier invalide.",
        success: false,
        error: true,
      });
    }

    if (!moduleId) {
      return res.status(422).json({
        message: "Module requis.",
        success: false,
        error: true,
      });
    }

    // Vérifier que l'utilisateur a le droit d'uploader sur ce module
    const moduleDoc = await Module.findById(moduleId);
    if (!moduleDoc) {
      return res.status(404).json({
        message: "Module introuvable.",
        success: false,
        error: true,
      });
    }

    const estAdmin = req.userRole === "admin";
    const estProprietaire = moduleDoc.enseignant.toString() === req.userId;
    if (!estAdmin && !estProprietaire) {
      return res.status(403).json({
        message: "Action non autorisée.",
        success: false,
        error: true,
      });
    }

    // Dossier : isi-learn/contenus/{moduleId}/{type}
    const folder = `isi-learn/contenus/${moduleId}/${type}`;
    const timestamp = Math.round(Date.now() / 1000);

    // resource_type pour Cloudinary
    let resourceType = "auto";
    if (type === "pdf") resourceType = "raw";
    if (type === "video") resourceType = "video";
    if (type === "audio") resourceType = "video"; // Cloudinary gère l'audio via video
    if (type === "image") resourceType = "image";

    // Paramètres à signer (ordre alphabétique obligatoire)
    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET,
    );

    return res.status(200).json({
      message: "Signature générée.",
      success: true,
      error: false,
      data: {
        signature,
        timestamp,
        folder,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        resourceType,
      },
    });
  } catch (error) {
    console.error("Erreur génération signature :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ──────────────────────────────────────────────────
// POST /api/chapitres/:chapitreId/contenus
// ──────────────────────────────────────────────────
const createContenu = async (req, res) => {
  try {
    const { chapitreId } = req.params;
    const {
      titre,
      type,
      texte,
      urlFichier,
      urlExterne,
      dureeMinutes,
      telechargeable,
      cloudinaryPublicId, // pour pouvoir supprimer plus tard
    } = req.body;

    if (!titre || !type) {
      return res.status(422).json({
        message: "Le titre et le type sont obligatoires.",
        success: false,
        error: true,
      });
    }

    const TYPES_VALIDES = ["texte", "video", "image", "pdf", "audio", "lien"];
    if (!TYPES_VALIDES.includes(type)) {
      return res.status(422).json({
        message: "Type invalide.",
        success: false,
        error: true,
      });
    }

    const check = await canModifyContenus(
      req.userId,
      req.userRole,
      chapitreId,
    );
    if (!check.ok) {
      return res
        .status(check.code)
        .json({ message: check.message, success: false, error: true });
    }

    // Validation selon le type
    if (type === "texte" && (!texte || texte.trim() === "")) {
      return res.status(422).json({
        message: "Le contenu texte est obligatoire.",
        success: false,
        error: true,
      });
    }
    if (
      ["video", "image", "pdf", "audio"].includes(type) &&
      !urlFichier
    ) {
      return res.status(422).json({
        message: "L'URL du fichier uploadé est obligatoire.",
        success: false,
        error: true,
      });
    }
    if (type === "lien" && !urlExterne) {
      return res.status(422).json({
        message: "L'URL externe est obligatoire.",
        success: false,
        error: true,
      });
    }

    // Calcul de l'ordre automatique
    const lastContenu = await Contenu.findOne({ chapitre: chapitreId }).sort({
      ordre: -1,
    });
    const nextOrdre = lastContenu ? lastContenu.ordre + 1 : 1;

    const data = {
      titre: titre.trim(),
      type,
      chapitre: chapitreId,
      ordre: nextOrdre,
      estPublie: false,
    };

    if (type === "texte") data.texte = texte;
    if (["video", "image", "pdf", "audio"].includes(type)) {
      data.urlFichier = urlFichier;
      data.cloudinaryPublicId = cloudinaryPublicId || null;
      if (type === "video" && dureeMinutes)
        data.dureeMinutes = Number(dureeMinutes);
      if (telechargeable !== undefined)
        data.telechargeable = !!telechargeable;
    }
    if (type === "lien") data.urlExterne = urlExterne;

    const contenu = await Contenu.create(data);

    return res.status(201).json({
      message: "Contenu créé.",
      success: true,
      error: false,
      data: contenu,
    });
  } catch (error) {
    console.error("Erreur POST contenu :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ──────────────────────────────────────────────────
// PUT /api/contenus/:id
// ──────────────────────────────────────────────────
const updateContenu = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titre,
      texte,
      urlFichier,
      urlExterne,
      dureeMinutes,
      telechargeable,
      cloudinaryPublicId,
    } = req.body;

    const contenu = await Contenu.findById(id);
    if (!contenu) {
      return res.status(404).json({
        message: "Contenu introuvable.",
        success: false,
        error: true,
      });
    }

    const check = await canModifyContenus(
      req.userId,
      req.userRole,
      contenu.chapitre,
    );
    if (!check.ok) {
      return res
        .status(check.code)
        .json({ message: check.message, success: false, error: true });
    }

    const data = {};
    if (titre) data.titre = titre.trim();

    // Si changement de fichier, supprimer l'ancien de Cloudinary
    if (urlFichier && urlFichier !== contenu.urlFichier) {
      if (contenu.cloudinaryPublicId) {
        const resourceType =
          contenu.type === "video" || contenu.type === "audio"
            ? "video"
            : contenu.type === "pdf"
              ? "raw"
              : "image";
        try {
          await cloudinary.uploader.destroy(contenu.cloudinaryPublicId, {
            resource_type: resourceType,
          });
        } catch (err) {
          console.warn("Impossible de supprimer l'ancien fichier :", err);
        }
      }
      data.urlFichier = urlFichier;
      data.cloudinaryPublicId = cloudinaryPublicId || null;
    }

    if (contenu.type === "texte" && texte !== undefined) data.texte = texte;
    if (contenu.type === "lien" && urlExterne !== undefined)
      data.urlExterne = urlExterne;
    if (dureeMinutes !== undefined) data.dureeMinutes = Number(dureeMinutes);
    if (telechargeable !== undefined) data.telechargeable = !!telechargeable;

    if (Object.keys(data).length === 0) {
      return res.status(422).json({
        message: "Aucune donnée à mettre à jour.",
        success: false,
        error: true,
      });
    }

    const updated = await Contenu.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      message: "Contenu mis à jour.",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PUT contenu :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ──────────────────────────────────────────────────
// PATCH /api/contenus/:id/toggle-publication
// ──────────────────────────────────────────────────
const toggleContenuPublication = async (req, res) => {
  try {
    const { id } = req.params;
    const contenu = await Contenu.findById(id);
    if (!contenu) {
      return res.status(404).json({
        message: "Contenu introuvable.",
        success: false,
        error: true,
      });
    }

    const check = await canModifyContenus(
      req.userId,
      req.userRole,
      contenu.chapitre,
    );
    if (!check.ok) {
      return res
        .status(check.code)
        .json({ message: check.message, success: false, error: true });
    }

    const updated = await Contenu.findByIdAndUpdate(
      id,
      { $set: { estPublie: !contenu.estPublie } },
      { new: true },
    );

    return res.status(200).json({
      message: `Contenu ${updated.estPublie ? "publié" : "dépublié"}.`,
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PATCH toggle contenu :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ──────────────────────────────────────────────────
// PATCH /api/chapitres/:chapitreId/contenus/reorder
// ──────────────────────────────────────────────────
const reorderContenus = async (req, res) => {
  try {
    const { chapitreId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(422).json({
        message: "Liste d'items invalide.",
        success: false,
        error: true,
      });
    }

    const check = await canModifyContenus(
      req.userId,
      req.userRole,
      chapitreId,
    );
    if (!check.ok) {
      return res
        .status(check.code)
        .json({ message: check.message, success: false, error: true });
    }

    const ids = items.map((i) => i.id);
    const count = await Contenu.countDocuments({
      _id: { $in: ids },
      chapitre: chapitreId,
    });
    if (count !== items.length) {
      return res.status(400).json({
        message: "Certains contenus n'appartiennent pas à ce chapitre.",
        success: false,
        error: true,
      });
    }

    const operations = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { ordre: item.ordre } },
      },
    }));
    await Contenu.bulkWrite(operations);

    return res.status(200).json({
      message: "Ordre mis à jour.",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Erreur reorder contenus :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ──────────────────────────────────────────────────
// DELETE /api/contenus/:id
// Supprime aussi le fichier sur Cloudinary si présent
// ──────────────────────────────────────────────────
const deleteContenu = async (req, res) => {
  try {
    const { id } = req.params;
    const contenu = await Contenu.findById(id);
    if (!contenu) {
      return res.status(404).json({
        message: "Contenu introuvable.",
        success: false,
        error: true,
      });
    }

    const check = await canModifyContenus(
      req.userId,
      req.userRole,
      contenu.chapitre,
    );
    if (!check.ok) {
      return res
        .status(check.code)
        .json({ message: check.message, success: false, error: true });
    }

    // Supprimer du Cloudinary si applicable
    if (contenu.cloudinaryPublicId) {
      const resourceType =
        contenu.type === "video" || contenu.type === "audio"
          ? "video"
          : contenu.type === "pdf"
            ? "raw"
            : "image";
      try {
        await cloudinary.uploader.destroy(contenu.cloudinaryPublicId, {
          resource_type: resourceType,
        });
      } catch (err) {
        console.warn("Impossible de supprimer le fichier Cloudinary :", err);
      }
    }

    await Contenu.findByIdAndDelete(id);

    // Nettoyer les progressions (retirer ce contenu des "contenusVus")
    await Progression.updateMany(
      {},
      { $pull: { contenusVus: id } },
    );

    return res.status(200).json({
      message: "Contenu supprimé.",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Erreur DELETE contenu :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

module.exports = {
  getContenusByChapitre,
  generateUploadSignature,
  createContenu,
  updateContenu,
  toggleContenuPublication,
  reorderContenus,
  deleteContenu,
};