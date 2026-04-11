const { Filiere, Departement, Niveau } = require("../models");

// Helper : vérifier qu'un chef de dep agit sur SON département
const verifierChefSurDep = async (userId, departementId) => {
  const dep = await Departement.findById(departementId);
  if (!dep) return { ok: false, code: 404, message: "Département introuvable." };
  if (dep.chefDepartement?.toString() !== userId) {
    return {
      ok: false,
      code: 403,
      message: "Vous n'êtes pas chef de ce département.",
    };
  }
  return { ok: true, dep };
};

const getFilieres = async (req, res) => {
  try {
    const { departement, search, estActif, page = 1, limit = 50 } = req.query;
    const filter = {};

    // Si chef de dep, on force le filtre sur son département
    if (req.userRole === "chef_departement") {
      const dep = await Departement.findOne({ chefDepartement: req.userId });
      if (!dep) {
        return res.status(403).json({
          message: "Aucun département ne vous est attribué.",
          success: false,
          error: true,
        });
      }
      filter.departement = dep._id;
    } else if (departement) {
      filter.departement = departement;
    }

    if (estActif !== undefined) filter.estActif = estActif === "true";
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Filiere.countDocuments(filter);

    const filieres = await Filiere.find(filter)
      .populate("departement", "nom code")
      .sort({ nom: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Enrichissement avec nb de niveaux
    const enriched = await Promise.all(
      filieres.map(async (f) => {
        const nbNiveaux = await Niveau.countDocuments({ filiere: f._id });
        return { ...f, nbNiveaux };
      })
    );

    return res.status(200).json({
      message: "Filières récupérées.",
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
    console.error("Erreur GET /api/filieres :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

const createFiliere = async (req, res) => {
  try {
    const { nom, code, description, departement } = req.body;

    if (!nom || !code || !departement) {
      return res.status(422).json({
        message: "Le nom, le code et le département sont obligatoires.",
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
      const check = await verifierChefSurDep(req.userId, departement);
      if (!check.ok) {
        return res
          .status(check.code)
          .json({ message: check.message, success: false, error: true });
      }
    } else {
      const dep = await Departement.findById(departement);
      if (!dep) {
        return res.status(404).json({
          message: "Département introuvable.",
          success: false,
          error: true,
        });
      }
    }

    const exists = await Filiere.findOne({
      departement,
      code: code.trim().toUpperCase(),
    });
    if (exists) {
      return res.status(409).json({
        message: "Une filière avec ce code existe déjà dans ce département.",
        success: false,
        error: true,
      });
    }

    const filiere = await Filiere.create({
      nom: nom.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || "",
      departement,
    });

    const populated = await Filiere.findById(filiere._id).populate(
      "departement",
      "nom code"
    );

    return res.status(201).json({
      message: "Filière créée avec succès.",
      success: true,
      error: false,
      data: populated,
    });
  } catch (error) {
    console.error("Erreur POST /api/filieres :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

const updateFiliere = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, code, description } = req.body;

    const filiere = await Filiere.findById(id);
    if (!filiere) {
      return res.status(404).json({
        message: "Filière introuvable.",
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
      const check = await verifierChefSurDep(req.userId, filiere.departement);
      if (!check.ok) {
        return res
          .status(check.code)
          .json({ message: check.message, success: false, error: true });
      }
    }

    const data = {};
    if (nom) data.nom = nom.trim();
    if (description !== undefined) data.description = description.trim();
    if (code) {
      const newCode = code.trim().toUpperCase();
      if (newCode !== filiere.code) {
        const exists = await Filiere.findOne({
          departement: filiere.departement,
          code: newCode,
          _id: { $ne: id },
        });
        if (exists) {
          return res.status(409).json({
            message: "Ce code est déjà utilisé dans ce département.",
            success: false,
            error: true,
          });
        }
        data.code = newCode;
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(422).json({
        message: "Aucune donnée à mettre à jour.",
        success: false,
        error: true,
      });
    }

    const updated = await Filiere.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate("departement", "nom code");

    return res.status(200).json({
      message: "Filière mise à jour.",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PUT /api/filieres/:id :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

const toggleFiliereStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const filiere = await Filiere.findById(id);
    if (!filiere) {
      return res.status(404).json({
        message: "Filière introuvable.",
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
      const check = await verifierChefSurDep(req.userId, filiere.departement);
      if (!check.ok) {
        return res
          .status(check.code)
          .json({ message: check.message, success: false, error: true });
      }
    }

    let warning = null;
    if (filiere.estActif) {
      const nbNiveaux = await Niveau.countDocuments({ filiere: id });
      if (nbNiveaux > 0) {
        warning = `Cette filière contient ${nbNiveaux} niveau(x).`;
      }
    }

    const updated = await Filiere.findByIdAndUpdate(
      id,
      { $set: { estActif: !filiere.estActif } },
      { new: true }
    ).populate("departement", "nom code");

    return res.status(200).json({
      message: `Filière ${updated.estActif ? "activée" : "désactivée"}.`,
      success: true,
      error: false,
      data: updated,
      ...(warning && { warning }),
    });
  } catch (error) {
    console.error("Erreur PATCH toggle filiere :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

module.exports = {
  getFilieres,
  createFiliere,
  updateFiliere,
  toggleFiliereStatus,
};