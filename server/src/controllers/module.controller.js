const {
  Module,
  Niveau,
  Filiere,
  Departement,
  User,
  Chapitre,
} = require("../models");

// Helper : vérifier qu'un chef de dep gère le département d'un module
const verifierChefSurModule = async (userId, moduleDoc) => {
  const niveau = await Niveau.findById(moduleDoc.niveau).populate({
    path: "filiere",
    populate: { path: "departement" },
  });
  if (!niveau) return { ok: false, code: 404, message: "Niveau introuvable." };
  const depId = niveau.filiere?.departement?._id?.toString();
  const chefId = niveau.filiere?.departement?.chefDepartement?.toString();
  if (chefId !== userId) {
    return {
      ok: false,
      code: 403,
      message: "Ce module n'appartient pas à votre département.",
    };
  }
  return { ok: true, depId };
};

// ─────────────────────────────────────────────
// GET /api/modules
// ─────────────────────────────────────────────
const getModules = async (req, res) => {
  try {
    const { statut, niveau, enseignant, search, page = 1, limit = 20 } =
      req.query;

    const filter = {};
    if (statut) filter.statut = statut;
    if (niveau) filter.niveau = niveau;
    if (enseignant) filter.enseignant = enseignant;
    if (search) {
      filter.$or = [
        { titre: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    // ── Restrictions par rôle ──
    if (req.userRole === "enseignant") {
      // L'enseignant ne voit que ses propres modules
      filter.enseignant = req.userId;
    } else if (req.userRole === "chef_departement") {
      // Le chef ne voit que les modules des niveaux de son département
      const dep = await Departement.findOne({ chefDepartement: req.userId });
      if (!dep) {
        return res.status(403).json({
          message: "Aucun département ne vous est attribué.",
          success: false,
          error: true,
        });
      }
      const filieres = await Filiere.find({ departement: dep._id }).select("_id");
      const niveaux = await Niveau.find({
        filiere: { $in: filieres.map((f) => f._id) },
      }).select("_id");
      filter.niveau = { $in: niveaux.map((n) => n._id) };
    } else if (req.userRole === "etudiant") {
      // L'étudiant ne voit que les modules publiés de son niveau
      const user = await User.findById(req.userId).populate("classe");
      if (!user?.classe?.niveau) {
        return res.status(200).json({
          message: "Aucun module disponible.",
          success: true,
          error: false,
          data: [],
          pagination: { total: 0, page: 1, limit: Number(limit), totalPages: 0 },
        });
      }
      filter.niveau = user.classe.niveau;
      filter.statut = "publie";
    }
    // admin : pas de restriction

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Module.countDocuments(filter);

    const modules = await Module.find(filter)
      .populate("enseignant", "nom prenom email specialite")
      .populate({
        path: "niveau",
        select: "libelle code",
        populate: {
          path: "filiere",
          select: "nom code",
          populate: { path: "departement", select: "nom code" },
        },
      })
      .populate("approuvePar", "nom prenom")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Enrichissement : nb chapitres publiés
    const enriched = await Promise.all(
      modules.map(async (m) => {
        const nbChapitres = await Chapitre.countDocuments({ module: m._id });
        return { ...m, nbChapitres };
      }),
    );

    return res.status(200).json({
      message: "Modules récupérés.",
      success: true,
      error: false,
      data: enriched,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/modules :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ─────────────────────────────────────────────
// GET /api/modules/:id
// ─────────────────────────────────────────────
const getModuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const module = await Module.findById(id)
      .populate("enseignant", "nom prenom email specialite")
      .populate({
        path: "niveau",
        select: "libelle code",
        populate: {
          path: "filiere",
          select: "nom code",
          populate: { path: "departement", select: "nom code chefDepartement" },
        },
      })
      .populate("approuvePar", "nom prenom")
      .lean();

    if (!module) {
      return res.status(404).json({
        message: "Module introuvable.",
        success: false,
        error: true,
      });
    }

    // ── Contrôle d'accès ──
    const estAdmin = req.userRole === "admin";
    const estProprietaire = module.enseignant?._id?.toString() === req.userId;
    const estChefDep =
      req.userRole === "chef_departement" &&
      module.niveau?.filiere?.departement?.chefDepartement?.toString() ===
        req.userId;
    const estEtudiantAutorise =
      req.userRole === "etudiant" && module.statut === "publie";

    if (!estAdmin && !estProprietaire && !estChefDep && !estEtudiantAutorise) {
      return res.status(403).json({
        message: "Accès non autorisé.",
        success: false,
        error: true,
      });
    }

    const nbChapitres = await Chapitre.countDocuments({ module: id });

    return res.status(200).json({
      message: "Module récupéré.",
      success: true,
      error: false,
      data: { ...module, nbChapitres },
    });
  } catch (error) {
    console.error("Erreur GET /api/modules/:id :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ─────────────────────────────────────────────
// POST /api/modules
// ─────────────────────────────────────────────
const createModule = async (req, res) => {
  try {
    const {
      titre,
      code,
      description,
      niveau,
      coefficient,
      enseignant,
      image,
    } = req.body;

    if (!titre || !code || !niveau) {
      return res.status(422).json({
        message: "Le titre, le code et le niveau sont obligatoires.",
        success: false,
        error: true,
      });
    }

    const estAdmin = req.userRole === "admin";
    const estEnseignant = req.userRole === "enseignant";

    if (!estAdmin && !estEnseignant) {
      return res.status(403).json({
        message: "Seul un administrateur ou un enseignant peut créer un module.",
        success: false,
        error: true,
      });
    }

    // Vérifier que le niveau existe
    const niv = await Niveau.findById(niveau);
    if (!niv) {
      return res.status(404).json({
        message: "Niveau introuvable.",
        success: false,
        error: true,
      });
    }

    // Déterminer l'enseignant propriétaire
    let enseignantId;
    if (estAdmin) {
      if (!enseignant) {
        return res.status(422).json({
          message: "L'enseignant est obligatoire.",
          success: false,
          error: true,
        });
      }
      const prof = await User.findById(enseignant);
      if (!prof || prof.role !== "enseignant") {
        return res.status(422).json({
          message: "Enseignant invalide.",
          success: false,
          error: true,
        });
      }
      enseignantId = enseignant;
    } else {
      // Enseignant crée pour lui-même
      enseignantId = req.userId;
    }

    // Vérifier l'unicité du code dans le niveau
    const exists = await Module.findOne({
      niveau,
      code: code.trim().toUpperCase(),
    });
    if (exists) {
      return res.status(409).json({
        message: "Un module avec ce code existe déjà dans ce niveau.",
        success: false,
        error: true,
      });
    }

    const newModule = await Module.create({
      titre: titre.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || "",
      niveau,
      enseignant: enseignantId,
      coefficient: coefficient || 1,
      image: image || null,
      statut: "brouillon",
    });

    const populated = await Module.findById(newModule._id)
      .populate("enseignant", "nom prenom email")
      .populate({
        path: "niveau",
        select: "libelle code",
        populate: {
          path: "filiere",
          select: "nom code",
          populate: { path: "departement", select: "nom code" },
        },
      });

    return res.status(201).json({
      message: "Module créé avec succès.",
      success: true,
      error: false,
      data: { ...populated.toObject(), nbChapitres: 0 },
    });
  } catch (error) {
    console.error("Erreur POST /api/modules :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ─────────────────────────────────────────────
// PUT /api/modules/:id
// Modification du contenu (titre, description, coefficient, image)
// ─────────────────────────────────────────────
const updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, description, coefficient, image } = req.body;

    const moduleDoc = await Module.findById(id);
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
        message: "Vous ne pouvez modifier que vos propres modules.",
        success: false,
        error: true,
      });
    }

    // Règle : si publié ou archivé, l'enseignant ne peut plus modifier
    // (il doit d'abord demander une révision à l'admin)
    if (
      !estAdmin &&
      (moduleDoc.statut === "publie" || moduleDoc.statut === "archive")
    ) {
      return res.status(403).json({
        message:
          "Un module publié ou archivé ne peut pas être modifié directement. Contactez un administrateur.",
        success: false,
        error: true,
      });
    }

    const data = {};
    if (titre) data.titre = titre.trim();
    if (description !== undefined) data.description = description.trim();
    if (coefficient !== undefined) data.coefficient = Number(coefficient);
    if (image !== undefined) data.image = image;

    if (Object.keys(data).length === 0) {
      return res.status(422).json({
        message: "Aucune donnée à mettre à jour.",
        success: false,
        error: true,
      });
    }

    const updated = await Module.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    )
      .populate("enseignant", "nom prenom email")
      .populate({
        path: "niveau",
        select: "libelle code",
        populate: {
          path: "filiere",
          select: "nom code",
          populate: { path: "departement", select: "nom code" },
        },
      })
      .populate("approuvePar", "nom prenom");

    return res.status(200).json({
      message: "Module mis à jour.",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PUT /api/modules/:id :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/modules/:id/soumettre
// L'enseignant soumet son brouillon pour révision
// ─────────────────────────────────────────────
const soumettrePourRevision = async (req, res) => {
  try {
    const { id } = req.params;
    const moduleDoc = await Module.findById(id);

    if (!moduleDoc) {
      return res.status(404).json({
        message: "Module introuvable.",
        success: false,
        error: true,
      });
    }

    if (moduleDoc.enseignant.toString() !== req.userId) {
      return res.status(403).json({
        message: "Seul le propriétaire peut soumettre le module.",
        success: false,
        error: true,
      });
    }

    if (moduleDoc.statut !== "brouillon") {
      return res.status(400).json({
        message: "Seul un module en brouillon peut être soumis.",
        success: false,
        error: true,
      });
    }

    // Vérifier qu'il y a au moins un chapitre
    const nbChapitres = await Chapitre.countDocuments({ module: id });
    if (nbChapitres === 0) {
      return res.status(400).json({
        message:
          "Le module doit contenir au moins un chapitre avant d'être soumis.",
        success: false,
        error: true,
      });
    }

    const updated = await Module.findByIdAndUpdate(
      id,
      { $set: { statut: "en_revision" } },
      { new: true },
    )
      .populate("enseignant", "nom prenom email")
      .populate({
        path: "niveau",
        select: "libelle code",
        populate: {
          path: "filiere",
          select: "nom code",
          populate: { path: "departement", select: "nom code" },
        },
      });

    return res.status(200).json({
      message: "Module soumis pour révision.",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PATCH soumettre module :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/modules/:id/approuver
// Admin OU chef de dep : en_revision → publie
// ─────────────────────────────────────────────
const approuverModule = async (req, res) => {
  try {
    const { id } = req.params;
    const moduleDoc = await Module.findById(id);

    if (!moduleDoc) {
      return res.status(404).json({
        message: "Module introuvable.",
        success: false,
        error: true,
      });
    }

    if (moduleDoc.statut !== "en_revision") {
      return res.status(400).json({
        message: "Seul un module en révision peut être approuvé.",
        success: false,
        error: true,
      });
    }

    const estAdmin = req.userRole === "admin";
    const estChefDep = req.userRole === "chef_departement";

    if (!estAdmin && !estChefDep) {
      return res.status(403).json({
        message: "Action non autorisée.",
        success: false,
        error: true,
      });
    }

    if (estChefDep) {
      const check = await verifierChefSurModule(req.userId, moduleDoc);
      if (!check.ok) {
        return res
          .status(check.code)
          .json({ message: check.message, success: false, error: true });
      }
    }

    const updated = await Module.findByIdAndUpdate(
      id,
      {
        $set: {
          statut: "publie",
          approuvePar: req.userId,
          approuveAt: new Date(),
        },
      },
      { new: true },
    )
      .populate("enseignant", "nom prenom email")
      .populate({
        path: "niveau",
        select: "libelle code",
        populate: {
          path: "filiere",
          select: "nom code",
          populate: { path: "departement", select: "nom code" },
        },
      })
      .populate("approuvePar", "nom prenom");

    return res.status(200).json({
      message: "Module publié avec succès.",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PATCH approuver module :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/modules/:id/rejeter
// Admin OU chef de dep : en_revision → brouillon (avec motif)
// ─────────────────────────────────────────────
const rejeterModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { motif } = req.body;

    if (!motif || motif.trim().length < 10) {
      return res.status(422).json({
        message: "Le motif est obligatoire (10 caractères minimum).",
        success: false,
        error: true,
      });
    }

    const moduleDoc = await Module.findById(id);
    if (!moduleDoc) {
      return res.status(404).json({
        message: "Module introuvable.",
        success: false,
        error: true,
      });
    }

    if (moduleDoc.statut !== "en_revision") {
      return res.status(400).json({
        message: "Seul un module en révision peut être rejeté.",
        success: false,
        error: true,
      });
    }

    const estAdmin = req.userRole === "admin";
    const estChefDep = req.userRole === "chef_departement";

    if (!estAdmin && !estChefDep) {
      return res.status(403).json({
        message: "Action non autorisée.",
        success: false,
        error: true,
      });
    }

    if (estChefDep) {
      const check = await verifierChefSurModule(req.userId, moduleDoc);
      if (!check.ok) {
        return res
          .status(check.code)
          .json({ message: check.message, success: false, error: true });
      }
    }

    const updated = await Module.findByIdAndUpdate(
      id,
      {
        $set: {
          statut: "brouillon",
          motifRejet: motif.trim(),
          rejeteePar: req.userId,
          rejeteeAt: new Date(),
        },
      },
      { new: true },
    )
      .populate("enseignant", "nom prenom email")
      .populate({
        path: "niveau",
        select: "libelle code",
        populate: {
          path: "filiere",
          select: "nom code",
          populate: { path: "departement", select: "nom code" },
        },
      });

    // TODO : envoyer un email à l'enseignant avec le motif

    return res.status(200).json({
      message: "Module renvoyé en brouillon.",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PATCH rejeter module :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/modules/:id/archiver
// Admin uniquement : publie → archive
// ─────────────────────────────────────────────
const archiverModule = async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({
        message: "Seul un administrateur peut archiver un module.",
        success: false,
        error: true,
      });
    }

    const { id } = req.params;
    const moduleDoc = await Module.findById(id);
    if (!moduleDoc) {
      return res.status(404).json({
        message: "Module introuvable.",
        success: false,
        error: true,
      });
    }

    if (moduleDoc.statut !== "publie") {
      return res.status(400).json({
        message: "Seul un module publié peut être archivé.",
        success: false,
        error: true,
      });
    }

    const updated = await Module.findByIdAndUpdate(
      id,
      { $set: { statut: "archive" } },
      { new: true },
    )
      .populate("enseignant", "nom prenom email")
      .populate({
        path: "niveau",
        select: "libelle code",
        populate: {
          path: "filiere",
          select: "nom code",
          populate: { path: "departement", select: "nom code" },
        },
      });

    return res.status(200).json({
      message: "Module archivé.",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PATCH archiver module :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/modules/:id
// Suppression uniquement si brouillon sans chapitres
// ─────────────────────────────────────────────
const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;
    const moduleDoc = await Module.findById(id);

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

    if (moduleDoc.statut !== "brouillon") {
      return res.status(409).json({
        message:
          "Seul un module en brouillon peut être supprimé. Archivez-le si nécessaire.",
        success: false,
        error: true,
      });
    }

    const nbChapitres = await Chapitre.countDocuments({ module: id });
    if (nbChapitres > 0) {
      return res.status(409).json({
        message: `Impossible de supprimer : ${nbChapitres} chapitre(s) existant(s).`,
        success: false,
        error: true,
      });
    }

    await Module.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Module supprimé.",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Erreur DELETE /api/modules/:id :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

module.exports = {
  getModules,
  getModuleById,
  createModule,
  updateModule,
  soumettrePourRevision,
  approuverModule,
  rejeterModule,
  archiverModule,
  deleteModule,
};