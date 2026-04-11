const { Departement, Filiere, User } = require("../models");

// Liste — accessible à admin et chef_departement (filtrée), sinon publique en lecture
const getDepartements = async (req, res) => {
  try {
    const { search, estActif, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }
    if (estActif !== undefined) filter.estActif = estActif === "true";

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Departement.countDocuments(filter);

    const departements = await Departement.find(filter)
      .populate("chefDepartement", "nom prenom email")
      .sort({ nom: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Enrichissement avec compteurs (nb enseignants, étudiants, filières)
    const enriched = await Promise.all(
      departements.map(async (dep) => {
        const [nbFilieres, nbEnseignants] = await Promise.all([
          Filiere.countDocuments({ departement: dep._id }),
          User.countDocuments({
            role: "enseignant",
            departement: dep._id,
            estActif: true,
          }),
        ]);
        return { ...dep, nbFilieres, nbEnseignants };
      }),
    );

    return res.status(200).json({
      message: "Départements récupérés.",
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
    console.error("Erreur GET /api/departements :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// Création — admin uniquement
const createDepartement = async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({
        message: "Seul un administrateur peut créer un département.",
        success: false,
        error: true,
      });
    }

    const { nom, code, description, chefDepartement } = req.body;

    if (!nom || !code) {
      return res.status(422).json({
        message: "Le nom et le code sont obligatoires.",
        success: false,
        error: true,
      });
    }

    const exists = await Departement.findOne({
      $or: [{ nom: nom.trim() }, { code: code.trim().toUpperCase() }],
    });
    if (exists) {
      return res.status(409).json({
        message: "Un département avec ce nom ou ce code existe déjà.",
        success: false,
        error: true,
      });
    }

    // Si un chef est fourni, vérifier qu'il existe et a le bon rôle
    if (chefDepartement) {
      const chef = await User.findById(chefDepartement);
      if (!chef || chef.role !== "chef_departement") {
        return res.status(422).json({
          message: "Le chef sélectionné est invalide.",
          success: false,
          error: true,
        });
      }

      const dejaChef = await Departement.findOne({ chefDepartement });
      if (dejaChef) {
        return res.status(409).json({
          message: "Cet utilisateur est déjà chef d'un autre département.",
          success: false,
          error: true,
        });
      }
    }

    const dep = await Departement.create({
      nom: nom.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || "",
      chefDepartement: chefDepartement || null,
    });

    // Si on a affecté un chef, lui rattacher le département
    if (chefDepartement) {
      await User.findByIdAndUpdate(chefDepartement, { departement: dep._id });
    }

    const populated = await Departement.findById(dep._id).populate(
      "chefDepartement",
      "nom prenom email",
    );

    return res.status(201).json({
      message: "Département créé avec succès.",
      success: true,
      error: false,
      data: populated,
    });
  } catch (error) {
    console.error("Erreur POST /api/departements :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// Modification — admin OU chef de ce département (mais le chef ne peut pas se changer lui-même)
const updateDepartement = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, code, description, chefDepartement } = req.body;

    const dep = await Departement.findById(id);
    if (!dep) {
      return res.status(404).json({
        message: "Département introuvable.",
        success: false,
        error: true,
      });
    }

    const estAdmin = req.userRole === "admin";
    const estChefDeCeDep =
      req.userRole === "chef_departement" &&
      dep.chefDepartement?.toString() === req.userId;

    if (!estAdmin && !estChefDeCeDep) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier ce département.",
        success: false,
        error: true,
      });
    }

    const data = {};

    if (nom && nom.trim() !== dep.nom) {
      const exists = await Departement.findOne({
        nom: nom.trim(),
        _id: { $ne: id },
      });
      if (exists) {
        return res.status(409).json({
          message: "Un autre département porte déjà ce nom.",
          success: false,
          error: true,
        });
      }
      data.nom = nom.trim();
    }

    if (code && code.trim().toUpperCase() !== dep.code) {
      // Seul l'admin peut changer le code (sensible)
      if (!estAdmin) {
        return res.status(403).json({
          message: "Seul un administrateur peut modifier le code.",
          success: false,
          error: true,
        });
      }
      const exists = await Departement.findOne({
        code: code.trim().toUpperCase(),
        _id: { $ne: id },
      });
      if (exists) {
        return res.status(409).json({
          message: "Un autre département utilise déjà ce code.",
          success: false,
          error: true,
        });
      }
      data.code = code.trim().toUpperCase();
    }

    if (description !== undefined) data.description = description.trim();

    // Changement de chef — admin uniquement
    if (
      chefDepartement !== undefined &&
      chefDepartement !== dep.chefDepartement?.toString()
    ) {
      if (!estAdmin) {
        return res.status(403).json({
          message:
            "Seul un administrateur peut changer le chef de département.",
          success: false,
          error: true,
        });
      }

      if (chefDepartement) {
        const chef = await User.findById(chefDepartement);
        if (!chef || chef.role !== "chef_departement") {
          return res.status(422).json({
            message: "Le chef sélectionné est invalide.",
            success: false,
            error: true,
          });
        }
        const dejaChef = await Departement.findOne({
          chefDepartement,
          _id: { $ne: id },
        });
        if (dejaChef) {
          return res.status(409).json({
            message: "Cet utilisateur est déjà chef d'un autre département.",
            success: false,
            error: true,
          });
        }

        // Détacher l'ancien chef
        if (dep.chefDepartement) {
          await User.findByIdAndUpdate(dep.chefDepartement, {
            departement: null,
          });
        }
        await User.findByIdAndUpdate(chefDepartement, { departement: dep._id });
        data.chefDepartement = chefDepartement;
      } else {
        if (dep.chefDepartement) {
          await User.findByIdAndUpdate(dep.chefDepartement, {
            departement: null,
          });
        }
        data.chefDepartement = null;
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(422).json({
        message: "Aucune donnée à mettre à jour.",
        success: false,
        error: true,
      });
    }

    const updated = await Departement.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).populate("chefDepartement", "nom prenom email");

    return res.status(200).json({
      message: "Département mis à jour.",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PUT /api/departements/:id :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

// Toggle statut (activer/désactiver) — admin uniquement
const toggleDepartementStatus = async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({
        message: "Seul un administrateur peut effectuer cette action.",
        success: false,
        error: true,
      });
    }

    const { id } = req.params;
    const dep = await Departement.findById(id);
    if (!dep) {
      return res.status(404).json({
        message: "Département introuvable.",
        success: false,
        error: true,
      });
    }

    // Désactivation : avertir si encore des filières actives
    let warning = null;
    if (dep.estActif) {
      const nbFilieres = await Filiere.countDocuments({
        departement: id,
        estActif: true,
      });
      if (nbFilieres > 0) {
        warning = `Ce département contient encore ${nbFilieres} filière(s) active(s).`;
      }
    }

    const updated = await Departement.findByIdAndUpdate(
      id,
      { $set: { estActif: !dep.estActif } },
      { new: true },
    ).populate("chefDepartement", "nom prenom email");

    return res.status(200).json({
      message: `Département ${updated.estActif ? "activé" : "désactivé"}.`,
      success: true,
      error: false,
      data: updated,
      ...(warning && { warning }),
    });
  } catch (error) {
    console.error("Erreur PATCH toggle departement :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", success: false, error: true });
  }
};

module.exports = {
  getDepartements,
  createDepartement,
  updateDepartement,
  toggleDepartementStatus,
};
