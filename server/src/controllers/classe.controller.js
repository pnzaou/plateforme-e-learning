const { Classe, Niveau, Filiere, Departement, User } = require("../models");

const verifierChefSurNiveau = async (userId, niveauId) => {
  const niveau = await Niveau.findById(niveauId).populate({
    path: "filiere",
    populate: { path: "departement" },
  });
  if (!niveau) return { ok: false, code: 404, message: "Niveau introuvable." };
  if (niveau.filiere?.departement?.chefDepartement?.toString() !== userId) {
    return {
      ok: false,
      code: 403,
      message: "Ce niveau n'appartient pas à votre département.",
    };
  }
  return { ok: true, niveau };
};

const getClasses = async (req, res) => {
  try {
    const { niveau, departement, anneeScolaire, search, estActive } = req.query;
    const filter = {};

    if (niveau) filter.niveau = niveau;
    if (anneeScolaire) filter.anneeScolaire = anneeScolaire;
    if (estActive !== undefined) filter.estActive = estActive === "true";
    if (search) filter.nom = { $regex: search, $options: "i" };

    if (req.userRole === "chef_departement") {
      const dep = await Departement.findOne({ chefDepartement: req.userId });
      if (!dep) {
        return res.status(403).json({
          message: "Aucun département ne vous est attribué.",
          success: false,
          error: true,
        });
      }
      const filieres = await Filiere.find({ departement: dep._id }).select(
        "_id",
      );
      const niveaux = await Niveau.find({
        filiere: { $in: filieres.map((f) => f._id) },
      }).select("_id");
      filter.niveau = { $in: niveaux.map((n) => n._id) };
    } else if (departement) {
      const filieres = await Filiere.find({ departement }).select("_id");
      const niveaux = await Niveau.find({
        filiere: { $in: filieres.map((f) => f._id) },
      }).select("_id");
      filter.niveau = { $in: niveaux.map((n) => n._id) };
    }

    const classes = await Classe.find(filter)
      .populate({
        path: "niveau",
        select: "libelle code ordre filiere",
        populate: {
          path: "filiere",
          select: "nom code",
          populate: { path: "departement", select: "nom code" },
        },
      })
      .sort({ anneeScolaire: -1, nom: 1 })
      .lean();

    const enriched = await Promise.all(
      classes.map(async (c) => {
        const nbEtudiants = await User.countDocuments({
          role: "etudiant",
          classe: c._id,
          estActif: true,
        });
        return { ...c, nbEtudiants };
      }),
    );

    return res.status(200).json({
      message: "Classes récupérées.",
      success: true,
      error: false,
      data: enriched,
    });
  } catch (error) {
    console.error("Erreur GET /api/classes :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

const createClasse = async (req, res) => {
  try {
    const { nom, niveau, anneeScolaire, capacite } = req.body;

    if (!nom || !niveau || !anneeScolaire) {
      return res.status(422).json({
        message: "Le nom, le niveau et l'année scolaire sont obligatoires.",
        success: false,
        error: true,
      });
    }

    if (!/^\d{4}-\d{4}$/.test(anneeScolaire)) {
      return res.status(422).json({
        message: "Format d'année scolaire invalide (attendu : YYYY-YYYY).",
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
      const check = await verifierChefSurNiveau(req.userId, niveau);
      if (!check.ok) {
        return res
          .status(check.code)
          .json({ message: check.message, success: false, error: true });
      }
    } else {
      const n = await Niveau.findById(niveau);
      if (!n) {
        return res.status(404).json({
          message: "Niveau introuvable.",
          success: false,
          error: true,
        });
      }
    }

    const exists = await Classe.findOne({
      nom: nom.trim(),
      niveau,
      anneeScolaire,
    });
    if (exists) {
      return res.status(409).json({
        message: "Cette classe existe déjà pour cette année.",
        success: false,
        error: true,
      });
    }

    const classe = await Classe.create({
      nom: nom.trim(),
      niveau,
      anneeScolaire,
      capacite: capacite || 40,
    });

    const populated = await Classe.findById(classe._id).populate({
      path: "niveau",
      select: "libelle code",
      populate: {
        path: "filiere",
        select: "nom code",
        populate: { path: "departement", select: "nom code" },
      },
    });

    return res.status(201).json({
      message: "Classe créée avec succès.",
      success: true,
      error: false,
      data: populated,
    });
  } catch (error) {
    console.error("Erreur POST /api/classes :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

const updateClasse = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, capacite, estActive } = req.body;

    const classe = await Classe.findById(id);
    if (!classe) {
      return res.status(404).json({
        message: "Classe introuvable.",
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
      const check = await verifierChefSurNiveau(req.userId, classe.niveau);
      if (!check.ok) {
        return res
          .status(check.code)
          .json({ message: check.message, success: false, error: true });
      }
    }

    const data = {};
    if (nom) data.nom = nom.trim();
    if (capacite !== undefined) data.capacite = Number(capacite);
    if (estActive !== undefined) data.estActive = !!estActive;

    if (Object.keys(data).length === 0) {
      return res.status(422).json({
        message: "Aucune donnée à mettre à jour.",
        success: false,
        error: true,
      });
    }

    // Vérifier doublon de nom
    if (data.nom && data.nom !== classe.nom) {
      const exists = await Classe.findOne({
        nom: data.nom,
        niveau: classe.niveau,
        anneeScolaire: classe.anneeScolaire,
        _id: { $ne: id },
      });
      if (exists) {
        return res.status(409).json({
          message: "Une classe porte déjà ce nom pour cette année.",
          success: false,
          error: true,
        });
      }
    }

    const updated = await Classe.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).populate({
      path: "niveau",
      select: "libelle code",
      populate: {
        path: "filiere",
        select: "nom code",
        populate: { path: "departement", select: "nom code" },
      },
    });

    return res.status(200).json({
      message: "Classe mise à jour.",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PUT /api/classes/:id :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

const deleteClasse = async (req, res) => {
  try {
    const { id } = req.params;
    const classe = await Classe.findById(id);
    if (!classe) {
      return res.status(404).json({
        message: "Classe introuvable.",
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
      const check = await verifierChefSurNiveau(req.userId, classe.niveau);
      if (!check.ok) {
        return res
          .status(check.code)
          .json({ message: check.message, success: false, error: true });
      }
    }

    const nbEtudiants = await User.countDocuments({ classe: id });
    if (nbEtudiants > 0) {
      return res.status(409).json({
        message: `Impossible de supprimer : ${nbEtudiants} étudiant(s) inscrit(s).`,
        success: false,
        error: true,
      });
    }

    await Classe.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Classe supprimée avec succès.",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Erreur DELETE /api/classes/:id :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

module.exports = { getClasses, createClasse, updateClasse, deleteClasse };