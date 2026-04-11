const { Niveau, Filiere, Departement, Classe } = require("../models");

const verifierChefSurFiliere = async (userId, filiereId) => {
  const filiere = await Filiere.findById(filiereId).populate("departement");
  if (!filiere)
    return { ok: false, code: 404, message: "Filière introuvable." };
  if (filiere.departement.chefDepartement?.toString() !== userId) {
    return {
      ok: false,
      code: 403,
      message: "Cette filière n'appartient pas à votre département.",
    };
  }
  return { ok: true, filiere };
};

const getNiveaux = async (req, res) => {
  try {
    const { filiere, departement, search } = req.query;
    const filter = {};

    if (filiere) filter.filiere = filiere;

    // Chef de dep : restriction auto sur son département
    if (req.userRole === "chef_departement") {
      const dep = await Departement.findOne({ chefDepartement: req.userId });
      if (!dep) {
        return res.status(403).json({
          message: "Aucun département ne vous est attribué.",
          success: false,
          error: true,
        });
      }
      const filieresDep = await Filiere.find({ departement: dep._id }).select(
        "_id",
      );
      filter.filiere = { $in: filieresDep.map((f) => f._id) };
    } else if (departement) {
      const filieresDep = await Filiere.find({ departement }).select("_id");
      filter.filiere = { $in: filieresDep.map((f) => f._id) };
    }

    if (search) {
      filter.$or = [
        { libelle: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const niveaux = await Niveau.find(filter)
      .populate({
        path: "filiere",
        select: "nom code departement",
        populate: { path: "departement", select: "nom code" },
      })
      .sort({ ordre: 1 })
      .lean();

    const enriched = await Promise.all(
      niveaux.map(async (n) => {
        const nbClasses = await Classe.countDocuments({ niveau: n._id });
        return { ...n, nbClasses };
      }),
    );

    return res.status(200).json({
      message: "Niveaux récupérés.",
      success: true,
      error: false,
      data: enriched,
    });
  } catch (error) {
    console.error("Erreur GET /api/niveaux :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

const createNiveau = async (req, res) => {
  try {
    const { libelle, code, filiere, ordre } = req.body;

    if (!libelle || !code || !filiere || ordre === undefined) {
      return res.status(422).json({
        message: "Tous les champs sont obligatoires.",
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
      const check = await verifierChefSurFiliere(req.userId, filiere);
      if (!check.ok) {
        return res
          .status(check.code)
          .json({ message: check.message, success: false, error: true });
      }
    } else {
      const f = await Filiere.findById(filiere);
      if (!f) {
        return res.status(404).json({
          message: "Filière introuvable.",
          success: false,
          error: true,
        });
      }
    }

    const exists = await Niveau.findOne({
      filiere,
      code: code.trim().toUpperCase(),
    });
    if (exists) {
      return res.status(409).json({
        message: "Ce code existe déjà dans cette filière.",
        success: false,
        error: true,
      });
    }

    const niveau = await Niveau.create({
      libelle: libelle.trim(),
      code: code.trim().toUpperCase(),
      filiere,
      ordre: Number(ordre),
    });

    const populated = await Niveau.findById(niveau._id).populate({
      path: "filiere",
      select: "nom code",
      populate: { path: "departement", select: "nom code" },
    });

    return res.status(201).json({
      message: "Niveau créé avec succès.",
      success: true,
      error: false,
      data: populated,
    });
  } catch (error) {
    console.error("Erreur POST /api/niveaux :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

const updateNiveau = async (req, res) => {
  try {
    const { id } = req.params;
    const { libelle, code, ordre } = req.body;

    const niveau = await Niveau.findById(id);
    if (!niveau) {
      return res.status(404).json({
        message: "Niveau introuvable.",
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
      const check = await verifierChefSurFiliere(req.userId, niveau.filiere);
      if (!check.ok) {
        return res
          .status(check.code)
          .json({ message: check.message, success: false, error: true });
      }
    }

    const data = {};
    if (libelle) data.libelle = libelle.trim();
    if (ordre !== undefined) data.ordre = Number(ordre);
    if (code) {
      const newCode = code.trim().toUpperCase();
      if (newCode !== niveau.code) {
        const exists = await Niveau.findOne({
          filiere: niveau.filiere,
          code: newCode,
          _id: { $ne: id },
        });
        if (exists) {
          return res.status(409).json({
            message: "Ce code existe déjà dans cette filière.",
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

    const updated = await Niveau.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).populate({
      path: "filiere",
      select: "nom code",
      populate: { path: "departement", select: "nom code" },
    });

    return res.status(200).json({
      message: "Niveau mis à jour.",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PUT /api/niveaux/:id :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

const deleteNiveau = async (req, res) => {
  try {
    const { id } = req.params;
    const niveau = await Niveau.findById(id);
    if (!niveau) {
      return res.status(404).json({
        message: "Niveau introuvable.",
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
      const check = await verifierChefSurFiliere(req.userId, niveau.filiere);
      if (!check.ok) {
        return res
          .status(check.code)
          .json({ message: check.message, success: false, error: true });
      }
    }

    // Bloquer si des classes existent
    const nbClasses = await Classe.countDocuments({ niveau: id });
    if (nbClasses > 0) {
      return res.status(409).json({
        message: `Impossible de supprimer : ${nbClasses} classe(s) rattachée(s) à ce niveau.`,
        success: false,
        error: true,
      });
    }

    await Niveau.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Niveau supprimé avec succès.",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Erreur DELETE /api/niveaux/:id :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

module.exports = { getNiveaux, createNiveau, updateNiveau, deleteNiveau };