const { Chapitre, Module, Contenu, Progression } = require("../models");

// Helper : vérifie que l'utilisateur peut modifier les chapitres d'un module
const canModifyChapitres = async (userId, userRole, moduleId) => {
  const moduleDoc = await Module.findById(moduleId);
  if (!moduleDoc) {
    return { ok: false, code: 404, message: "Module introuvable." };
  }

  const estAdmin = userRole === "admin";
  const estProprietaire = moduleDoc.enseignant.toString() === userId;

  if (!estAdmin && !estProprietaire) {
    return {
      ok: false,
      code: 403,
      message: "Vous n'êtes pas autorisé à modifier ce module.",
    };
  }

  // Règles selon le statut du module
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

  return { ok: true, module: moduleDoc };
};

// Helper : vérifie l'accès lecture aux chapitres d'un module
const canReadChapitres = async (userId, userRole, moduleId) => {
  const moduleDoc = await Module.findById(moduleId).populate({
    path: "niveau",
    populate: { path: "filiere", populate: { path: "departement" } },
  });
  if (!moduleDoc)
    return { ok: false, code: 404, message: "Module introuvable." };

  const estAdmin = userRole === "admin";
  const estProprietaire = moduleDoc.enseignant.toString() === userId;
  const estChefDep =
    userRole === "chef_departement" &&
    moduleDoc.niveau?.filiere?.departement?.chefDepartement?.toString() ===
      userId;

  if (estAdmin || estProprietaire || estChefDep) {
    return { ok: true, module: moduleDoc, fullAccess: true };
  }

  // Étudiant : uniquement si module publié
  if (userRole === "etudiant" && moduleDoc.statut === "publie") {
    return { ok: true, module: moduleDoc, fullAccess: false };
  }

  return { ok: false, code: 403, message: "Accès non autorisé." };
};

// ─────────────────────────────────────────────
// GET /api/modules/:moduleId/chapitres
// ─────────────────────────────────────────────
const getChapitresByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const check = await canReadChapitres(req.userId, req.userRole, moduleId);
    if (!check.ok) {
      return res
        .status(check.code)
        .json({ message: check.message, success: false, error: true });
    }

    // On récupère uniquement les chapitres parents (pas les sous-chapitres à la racine)
    const baseFilter = { module: moduleId, parentChapitre: null };
    // Étudiant : seulement les chapitres publiés
    if (!check.fullAccess) baseFilter.estPublie = true;

    const chapitresParents = await Chapitre.find(baseFilter)
      .sort({ ordre: 1 })
      .lean();

    // Pour chaque chapitre parent, on récupère ses sous-chapitres + compte de contenus
    const enriched = await Promise.all(
      chapitresParents.map(async (ch) => {
        const sousFilter = { parentChapitre: ch._id };
        if (!check.fullAccess) sousFilter.estPublie = true;

        const [sousChapitres, nbContenus] = await Promise.all([
          Chapitre.find(sousFilter).sort({ ordre: 1 }).lean(),
          Contenu.countDocuments(
            check.fullAccess
              ? { chapitre: ch._id }
              : { chapitre: ch._id, estPublie: true },
          ),
        ]);

        // Enrichir chaque sous-chapitre avec son nb de contenus
        const sousEnriched = await Promise.all(
          sousChapitres.map(async (s) => {
            const n = await Contenu.countDocuments(
              check.fullAccess
                ? { chapitre: s._id }
                : { chapitre: s._id, estPublie: true },
            );
            return { ...s, nbContenus: n, sousChapitres: [] };
          }),
        );

        return {
          ...ch,
          nbContenus,
          sousChapitres: sousEnriched,
        };
      }),
    );

    return res.status(200).json({
      message: "Chapitres récupérés.",
      success: true,
      error: false,
      data: enriched,
    });
  } catch (error) {
    console.error("Erreur GET chapitres :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ─────────────────────────────────────────────
// POST /api/modules/:moduleId/chapitres
// ─────────────────────────────────────────────
const createChapitre = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { titre, description, parentChapitre } = req.body;

    if (!titre) {
      return res.status(422).json({
        message: "Le titre est obligatoire.",
        success: false,
        error: true,
      });
    }

    const check = await canModifyChapitres(req.userId, req.userRole, moduleId);
    if (!check.ok) {
      return res
        .status(check.code)
        .json({ message: check.message, success: false, error: true });
    }

    // Si c'est un sous-chapitre, vérifier que le parent existe et appartient au même module
    // Et refuser l'imbrication (pas de sous-sous-chapitre)
    if (parentChapitre) {
      const parent = await Chapitre.findById(parentChapitre);
      if (!parent) {
        return res.status(404).json({
          message: "Chapitre parent introuvable.",
          success: false,
          error: true,
        });
      }
      if (parent.module.toString() !== moduleId) {
        return res.status(400).json({
          message: "Le chapitre parent n'appartient pas à ce module.",
          success: false,
          error: true,
        });
      }
      if (parent.parentChapitre) {
        return res.status(400).json({
          message: "On ne peut imbriquer que sur un seul niveau.",
          success: false,
          error: true,
        });
      }
    }

    // Calculer l'ordre : on prend le max + 1 dans le même scope (même parent)
    const scopeFilter = {
      module: moduleId,
      parentChapitre: parentChapitre || null,
    };
    const lastChapitre = await Chapitre.findOne(scopeFilter).sort({
      ordre: -1,
    });
    const nextOrdre = lastChapitre ? lastChapitre.ordre + 1 : 1;

    const chapitre = await Chapitre.create({
      titre: titre.trim(),
      description: description?.trim() || "",
      module: moduleId,
      parentChapitre: parentChapitre || null,
      ordre: nextOrdre,
      estPublie: false,
    });

    return res.status(201).json({
      message: "Chapitre créé.",
      success: true,
      error: false,
      data: { ...chapitre.toObject(), nbContenus: 0, sousChapitres: [] },
    });
  } catch (error) {
    console.error("Erreur POST chapitre :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ─────────────────────────────────────────────
// PUT /api/chapitres/:id
// ─────────────────────────────────────────────
const updateChapitre = async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, description } = req.body;

    const chapitre = await Chapitre.findById(id);
    if (!chapitre) {
      return res.status(404).json({
        message: "Chapitre introuvable.",
        success: false,
        error: true,
      });
    }

    const check = await canModifyChapitres(
      req.userId,
      req.userRole,
      chapitre.module,
    );
    if (!check.ok) {
      return res
        .status(check.code)
        .json({ message: check.message, success: false, error: true });
    }

    const data = {};
    if (titre) data.titre = titre.trim();
    if (description !== undefined) data.description = description.trim();

    if (Object.keys(data).length === 0) {
      return res.status(422).json({
        message: "Aucune donnée à mettre à jour.",
        success: false,
        error: true,
      });
    }

    const updated = await Chapitre.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      message: "Chapitre mis à jour.",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PUT chapitre :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/chapitres/:id/toggle-publication
// ─────────────────────────────────────────────
const togglePublication = async (req, res) => {
  try {
    const { id } = req.params;
    const chapitre = await Chapitre.findById(id);
    if (!chapitre) {
      return res.status(404).json({
        message: "Chapitre introuvable.",
        success: false,
        error: true,
      });
    }

    const check = await canModifyChapitres(
      req.userId,
      req.userRole,
      chapitre.module,
    );
    if (!check.ok) {
      return res
        .status(check.code)
        .json({ message: check.message, success: false, error: true });
    }

    const updated = await Chapitre.findByIdAndUpdate(
      id,
      { $set: { estPublie: !chapitre.estPublie } },
      { new: true },
    );

    return res.status(200).json({
      message: `Chapitre ${updated.estPublie ? "publié" : "dépublié"}.`,
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PATCH toggle chapitre :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/modules/:moduleId/chapitres/reorder
// Body: { items: [{ id, ordre, parentChapitre }] }
// ─────────────────────────────────────────────
const reorderChapitres = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(422).json({
        message: "Liste d'items invalide.",
        success: false,
        error: true,
      });
    }

    const check = await canModifyChapitres(req.userId, req.userRole, moduleId);
    if (!check.ok) {
      return res
        .status(check.code)
        .json({ message: check.message, success: false, error: true });
    }

    // Vérifier que tous les chapitres appartiennent bien au module
    const ids = items.map((i) => i.id);
    const count = await Chapitre.countDocuments({
      _id: { $in: ids },
      module: moduleId,
    });
    if (count !== items.length) {
      return res.status(400).json({
        message: "Certains chapitres n'appartiennent pas à ce module.",
        success: false,
        error: true,
      });
    }

    // Mise à jour en bulk
    const operations = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: {
          $set: {
            ordre: item.ordre,
            parentChapitre: item.parentChapitre || null,
          },
        },
      },
    }));
    await Chapitre.bulkWrite(operations);

    return res.status(200).json({
      message: "Ordre mis à jour.",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Erreur PATCH reorder chapitres :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/chapitres/:id
// ─────────────────────────────────────────────
const deleteChapitre = async (req, res) => {
  try {
    const { id } = req.params;

    const chapitre = await Chapitre.findById(id);
    if (!chapitre) {
      return res.status(404).json({
        message: "Chapitre introuvable.",
        success: false,
        error: true,
      });
    }

    const check = await canModifyChapitres(
      req.userId,
      req.userRole,
      chapitre.module,
    );
    if (!check.ok) {
      return res
        .status(check.code)
        .json({ message: check.message, success: false, error: true });
    }

    // Vérifier qu'il n'y a pas de contenus ni de sous-chapitres
    const [nbContenus, nbSousChapitres] = await Promise.all([
      Contenu.countDocuments({ chapitre: id }),
      Chapitre.countDocuments({ parentChapitre: id }),
    ]);

    if (nbContenus > 0) {
      return res.status(409).json({
        message: `Impossible : ${nbContenus} contenu(s) existant(s). Supprimez-les d'abord.`,
        success: false,
        error: true,
      });
    }

    if (nbSousChapitres > 0) {
      return res.status(409).json({
        message: `Impossible : ${nbSousChapitres} sous-chapitre(s) existant(s). Supprimez-les d'abord.`,
        success: false,
        error: true,
      });
    }

    await Chapitre.findByIdAndDelete(id);

    // Nettoyer les progressions (retirer ce chapitre des "chapitresTermines")
    await Progression.updateMany(
      { module: chapitre.module },
      { $pull: { chapitresTermines: id } },
    );

    return res.status(200).json({
      message: "Chapitre supprimé.",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Erreur DELETE chapitre :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

module.exports = {
  getChapitresByModule,
  createChapitre,
  updateChapitre,
  togglePublication,
  reorderChapitres,
  deleteChapitre,
};