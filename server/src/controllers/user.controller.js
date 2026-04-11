const resend = require("../libs/resend");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const {
  User,
  Departement,
  Classe,
  Module,
  Note,
  Progression,
  Soumission,
  Devoir,
  ReponseQuiz,
  Quiz,
} = require("../models");

const ROLES_VALIDES = ["admin", "chef_departement", "enseignant", "etudiant"];

const getUsers = async (req, res) => {
  try {
    const { role, estActif, search, page = 1, limit = 20 } = req.query;

    const estAdmin = req.userRole === "admin";
    const estChefDep = req.userRole === "chef_departement";
    const estEnseignant = req.userRole === "enseignant";

    if (!estAdmin && !estChefDep && !estEnseignant) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à accéder à cette ressource.",
        success: false,
        error: true,
      });
    }

    let filter = {};

    // ── ADMIN ──────────────────────────────────────────────
    if (estAdmin) {
      if (role) filter.role = role;
    }

    // ── CHEF DE DÉPARTEMENT ────────────────────────────────
    if (estChefDep) {
      const dep = await Departement.findOne({ chefDepartement: req.userId });
      if (!dep) {
        return res.status(403).json({
          message: "Département introuvable pour ce chef.",
          success: false,
          error: true,
        });
      }

      // Classes appartenant au département via niveau → filiere → departement
      const classesDuDep = await Classe.find()
        .populate({
          path: "niveau",
          populate: { path: "filiere", select: "departement" },
        })
        .select("_id");

      const classeIds = classesDuDep
        .filter(
          (cl) =>
            cl.niveau?.filiere?.departement?.toString() === dep._id.toString(),
        )
        .map((cl) => cl._id);

      const roleDemande =
        role && ["enseignant", "etudiant"].includes(role) ? role : null;

      if (roleDemande === "enseignant") {
        filter.role = "enseignant";
        filter.departement = dep._id;
      } else if (roleDemande === "etudiant") {
        filter.role = "etudiant";
        filter.classe = { $in: classeIds };
      } else {
        // Les deux
        filter.$or = [
          { role: "enseignant", departement: dep._id },
          { role: "etudiant", classe: { $in: classeIds } },
        ];
      }
    }

    // ── ENSEIGNANT ─────────────────────────────────────────
    // Ses étudiants = étudiants des classes liées à ses modules
    if (estEnseignant) {
      // Les modules de cet enseignant → leurs niveaux → les classes de ces niveaux
      const modules = await Module.find({ enseignant: req.userId }).select(
        "niveau",
      );
      const niveauIds = modules.map((m) => m.niveau);

      const classesDeLEnseignant = await Classe.find({
        niveau: { $in: niveauIds },
      }).select("_id");

      const classeIds = classesDeLEnseignant.map((cl) => cl._id);

      filter.role = "etudiant";
      filter.classe = { $in: classeIds };
    }

    // ── FILTRES COMMUNS ────────────────────────────────────
    if (estActif !== undefined) {
      filter.estActif = estActif === "true";
    }

    if (search) {
      const searchFilter = {
        $or: [
          { nom: { $regex: search, $options: "i" } },
          { prenom: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { matricule: { $regex: search, $options: "i" } },
        ],
      };
      filter =
        Object.keys(filter).length > 0
          ? { $and: [filter, searchFilter] }
          : searchFilter;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .select("-motDePasse -resetPasswordToken -resetPasswordExpire")
      .populate("departement", "nom code")
      .populate({
        path: "classe",
        select: "nom anneeScolaire",
        populate: {
          path: "niveau",
          select: "libelle code",
          populate: {
            path: "filiere",
            select: "nom code",
            populate: { path: "departement", select: "nom code" },
          },
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      message: "Utilisateurs récupérés avec succès.",
      success: true,
      error: false,
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/users :", error);
    return res.status(500).json({
      message: "Erreur serveur.",
      success: false,
      error: true,
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { nom, prenom, email, role, telephone, specialite, classe } =
      req.body;

    if (!nom || !prenom || !email || !role) {
      return res.status(422).json({
        message: "Veuillez renseigner tous les champs obligatoires.",
        success: false,
        error: true,
      });
    }

    if (!ROLES_VALIDES.includes(role)) {
      return res.status(422).json({
        message: "Rôle invalide.",
        success: false,
        error: true,
      });
    }

    if (
      (role === "admin" || role === "chef_departement") &&
      req.userRole !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Vous n'êtes pas autorisé à créer ni un admin ni un chef de département.",
        success: false,
        error: true,
      });
    }

    if (
      (role === "enseignant" || role === "etudiant") &&
      req.userRole === "chef_departement"
    ) {
      const dep = await Departement.findOne({ chefDepartement: req.userId });
      if (!dep) {
        return res.status(403).json({
          message: "Vous n'êtes pas autorisé à manipuler ce département.",
          success: false,
          error: true,
        });
      }
      req.depId = dep._id;
    }

    // Champs obligatoires par rôle
    if (role === "admin" || role === "chef_departement") {
      if (!telephone) {
        return res.status(422).json({
          message: "Le numéro de téléphone est obligatoire.",
          success: false,
          error: true,
        });
      }
    }

    if (role === "enseignant") {
      if (!telephone || !specialite) {
        return res.status(422).json({
          message:
            "Le numéro de téléphone et la spécialité sont obligatoires pour un enseignant.",
          success: false,
          error: true,
        });
      }
    }

    if (role === "etudiant") {
      if (!classe) {
        return res.status(422).json({
          message: "La classe est obligatoire pour un étudiant.",
          success: false,
          error: true,
        });
      }

      const cl = await Classe.findById(classe);
      if (!cl) {
        return res.status(404).json({
          message: "Classe introuvable",
          success: false,
          error: true,
        });
      }
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({
        message: "Un compte existe déjà avec cet email.",
        success: false,
        error: true,
      });
    }

    // Construction du document
    let data = {
      nom,
      prenom,
      email: email.toLowerCase().trim(),
      role,
      telephone: telephone || null,
    };

    if (role === "enseignant") {
      data.specialite = specialite;
      // ✅ Rattachement au département
      if (req.userRole === "chef_departement") {
        data.departement = req.depId;
      } else if (req.userRole === "admin") {
        // L'admin doit passer le departement dans le body
        if (!req.body.departement) {
          return res.status(422).json({
            message: "Le département est obligatoire pour un enseignant.",
            success: false,
            error: true,
          });
        }
        data.departement = req.body.departement;
      }
    }

    if (role === "chef_departement" && req.userRole === "admin") {
      if (!req.body.departement) {
        return res.status(422).json({
          message:
            "Le département est obligatoire pour un chef de département.",
          success: false,
          error: true,
        });
      }
      data.departement = req.body.departement;
    }

    if (role === "etudiant") {
      data.classe = classe;
      data.matricule = `ISI-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    }

    // Mot de passe temporaire
    const tempPassword = "Temp@" + crypto.randomBytes(8).toString("hex");
    const salt = 12;
    data.motDePasse = await bcrypt.hash(tempPassword, salt);

    const newUser = await User.create(data);

    const FROM = "ISI Learn <onboarding@resend.dev>";
    const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:5173";

    await resend.emails.send({
      from: FROM,
      to: newUser.email,
      subject: "Votre accès ISI Learn",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#0f172a">Bienvenue sur ISI Learn</h2>
          <p style="color:#475569">Bonjour ${prenom},</p>
          <p style="color:#475569">Un compte a été créé pour vous. Voici vos identifiants temporaires :</p>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:4px 0;color:#0f172a"><strong>Email :</strong> ${newUser.email}</p>
            <p style="margin:4px 0;color:#0f172a"><strong>Mot de passe temporaire :</strong> ${tempPassword}</p>
          </div>
          <a href="${ADMIN_URL}"
             style="display:inline-block;padding:12px 28px;background:#0284c7;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">
            Accéder à l'interface
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:16px">Changez votre mot de passe dès votre première connexion.</p>
        </div>
      `,
    });

    const safeUser = newUser.toObject();
    delete safeUser.motDePasse;

    return res.status(201).json({
      message: "Compte créé avec succès. Un email a été envoyé.",
      success: true,
      error: false,
      data: safeUser,
    });
  } catch (error) {
    console.error("Erreur POST /api/users :", error);
    return res.status(500).json({
      message: "Erreur serveur.",
      success: false,
      error: true,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, telephone, avatar, specialite, classe } = req.body;

    // Récupération de l'utilisateur cible
    const cible = await User.findById(id);
    if (!cible) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
        success: false,
        error: true,
      });
    }

    if (!cible.estActif) {
      return res.status(403).json({
        message: "Impossible de modifier un compte désactivé.",
        success: false,
        error: true,
      });
    }

    const estSoiMeme = req.userId === id;
    const estAdmin = req.userRole === "admin";
    const estChefDep = req.userRole === "chef_departement";

    // ✅ FIX 2 : Le chef de dep ne peut PAS modifier un admin ou un autre chef de dep,
    // même si estSoiMeme est false — on bloque avant toute autre logique
    if (estChefDep && !estSoiMeme) {
      if (cible.role === "admin" || cible.role === "chef_departement") {
        return res.status(403).json({
          message: "Vous n'êtes pas autorisé à modifier cet utilisateur.",
          success: false,
          error: true,
        });
      }
    }

    // Contrôle d'accès global
    if (!estSoiMeme && !estAdmin && !estChefDep) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier cet utilisateur.",
        success: false,
        error: true,
      });
    }

    // Vérifications spécifiques au chef de département
    let dep = null;
    if (estChefDep && !estSoiMeme) {
      dep = await Departement.findOne({ chefDepartement: req.userId });
      if (!dep) {
        return res.status(403).json({
          message: "Département introuvable pour ce chef.",
          success: false,
          error: true,
        });
      }

      // ✅ FIX 1 : Vérification via cible.departement (le champ qui existe dans le modèle User)
      if (cible.role === "enseignant") {
        if (cible.departement?.toString() !== dep._id.toString()) {
          return res.status(403).json({
            message: "Cet enseignant n'appartient pas à votre département.",
            success: false,
            error: true,
          });
        }
      }

      // Vérifier que l'étudiant appartient bien au département du chef
      if (cible.role === "etudiant") {
        const classeEtudiant = await Classe.findById(cible.classe).populate({
          path: "niveau",
          populate: { path: "filiere", populate: { path: "departement" } },
        });

        const depEtudiant =
          classeEtudiant?.niveau?.filiere?.departement?._id?.toString();

        if (depEtudiant !== dep._id.toString()) {
          return res.status(403).json({
            message: "Cet étudiant n'appartient pas à votre département.",
            success: false,
            error: true,
          });
        }
      }
    }

    // Construction des données à mettre à jour
    const data = {};

    if (nom) data.nom = nom.trim();
    if (prenom) data.prenom = prenom.trim();
    if (telephone) data.telephone = telephone.trim();
    if (avatar) data.avatar = avatar;

    // Spécialité : uniquement pour un enseignant
    if (specialite && cible.role === "enseignant") {
      data.specialite = specialite.trim();
    }

    // Classe : uniquement pour un étudiant, et pas par lui-même
    if (classe && cible.role === "etudiant") {
      if (estSoiMeme) {
        return res.status(403).json({
          message: "Vous ne pouvez pas modifier votre propre classe.",
          success: false,
          error: true,
        });
      }

      const nouvelleClasse = await Classe.findById(classe).populate({
        path: "niveau",
        populate: { path: "filiere", populate: { path: "departement" } },
      });

      if (!nouvelleClasse) {
        return res.status(404).json({
          message: "Classe introuvable.",
          success: false,
          error: true,
        });
      }

      // ✅ FIX 4 : Le chef de dep ne peut affecter qu'une classe de son propre département
      if (estChefDep) {
        const depNouvelleClasse =
          nouvelleClasse?.niveau?.filiere?.departement?._id?.toString();

        if (depNouvelleClasse !== dep._id.toString()) {
          return res.status(403).json({
            message:
              "Vous ne pouvez affecter qu'une classe appartenant à votre département.",
            success: false,
            error: true,
          });
        }
      }

      data.classe = classe;
    }

    // ✅ FIX 3 : Distinguer "aucun champ envoyé" de "champ envoyé mais ignoré (mauvais rôle)"
    if (Object.keys(data).length === 0) {
      const champsEnvoyes = [
        nom,
        prenom,
        telephone,
        avatar,
        specialite,
        classe,
      ].some(Boolean);
      return res.status(422).json({
        message: champsEnvoyes
          ? "Les champs envoyés ne sont pas modifiables pour ce profil."
          : "Aucune donnée à mettre à jour.",
        success: false,
        error: true,
      });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).select("-motDePasse -resetPasswordToken -resetPasswordExpire");

    return res.status(200).json({
      message: "Utilisateur mis à jour avec succès.",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    console.error("Erreur PUT /api/users/:id :", error);
    return res.status(500).json({
      message: "Erreur serveur.",
      success: false,
      error: true,
    });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const cible = await User.findById(id);
    if (!cible) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
        success: false,
        error: true,
      });
    }

    // Un utilisateur ne peut pas toggler son propre statut
    if (req.userId === id) {
      return res.status(403).json({
        message: "Vous ne pouvez pas modifier votre propre statut.",
        success: false,
        error: true,
      });
    }

    const estAdmin = req.userRole === "admin";
    const estChefDep = req.userRole === "chef_departement";

    // Contrôle d'accès
    if (!estAdmin && !estChefDep) {
      return res.status(403).json({
        message:
          "Vous n'êtes pas autorisé à modifier le statut de cet utilisateur.",
        success: false,
        error: true,
      });
    }

    // Le chef de dep ne peut agir que sur les enseignants et étudiants de son département
    if (estChefDep) {
      if (cible.role === "admin" || cible.role === "chef_departement") {
        return res.status(403).json({
          message:
            "Vous n'êtes pas autorisé à modifier le statut de cet utilisateur.",
          success: false,
          error: true,
        });
      }

      const dep = await Departement.findOne({ chefDepartement: req.userId });
      if (!dep) {
        return res.status(403).json({
          message: "Département introuvable pour ce chef.",
          success: false,
          error: true,
        });
      }

      if (
        cible.role === "enseignant" &&
        cible.departement?.toString() !== dep._id.toString()
      ) {
        return res.status(403).json({
          message: "Cet enseignant n'appartient pas à votre département.",
          success: false,
          error: true,
        });
      }

      if (cible.role === "etudiant") {
        const classeEtudiant = await Classe.findById(cible.classe).populate({
          path: "niveau",
          populate: { path: "filiere", populate: { path: "departement" } },
        });
        const depEtudiant =
          classeEtudiant?.niveau?.filiere?.departement?._id?.toString();
        if (depEtudiant !== dep._id.toString()) {
          return res.status(403).json({
            message: "Cet étudiant n'appartient pas à votre département.",
            success: false,
            error: true,
          });
        }
      }
    }

    // Garde-fou : ne pas désactiver le dernier admin actif
    if (cible.role === "admin" && cible.estActif) {
      const adminsActifs = await User.countDocuments({
        role: "admin",
        estActif: true,
      });
      if (adminsActifs <= 1) {
        return res.status(403).json({
          message: "Impossible de désactiver le dernier administrateur actif.",
          success: false,
          error: true,
        });
      }
    }

    // Toggle
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { estActif: !cible.estActif } },
      { new: true },
    ).select("-motDePasse -resetPasswordToken -resetPasswordExpire");

    // Warning si le chef de dep désactivé laisse son département sans chef actif
    let warning = null;
    if (cible.role === "chef_departement" && !updated.estActif) {
      const dep = await Departement.findOne({ chefDepartement: id });
      if (dep) {
        warning = `Le département "${dep.nom}" n'a plus de chef actif.`;
      }
    }

    return res.status(200).json({
      message: `Compte ${updated.estActif ? "activé" : "désactivé"} avec succès.`,
      success: true,
      error: false,
      data: updated,
      ...(warning && { warning }),
    });
  } catch (error) {
    console.error("Erreur PATCH /api/users/:id/toggle-status :", error);
    return res.status(500).json({
      message: "Erreur serveur.",
      success: false,
      error: true,
    });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const cible = await User.findById(id)
      .select("-motDePasse -resetPasswordToken -resetPasswordExpire")
      .populate("departement", "nom code")
      .populate({
        path: "classe",
        select: "nom anneeScolaire capacite",
        populate: {
          path: "niveau",
          select: "libelle code ordre",
          populate: {
            path: "filiere",
            select: "nom code",
            populate: { path: "departement", select: "nom code" },
          },
        },
      })
      .lean();

    if (!cible) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
        success: false,
        error: true,
      });
    }

    // ───── Contrôle d'accès ─────
    const estSoiMeme = req.userId === id;
    const estAdmin = req.userRole === "admin";
    const estChefDep = req.userRole === "chef_departement";
    const estEnseignant = req.userRole === "enseignant";

    // Admin : accès à tout
    // Soi-même : accès à son propre profil
    // Chef de dep : accès aux enseignants et étudiants de son département
    // Enseignant : accès uniquement aux étudiants qu'il enseigne
    let autorise = estAdmin || estSoiMeme;

    if (!autorise && estChefDep) {
      const dep = await Departement.findOne({ chefDepartement: req.userId });
      if (!dep) {
        return res.status(403).json({
          message: "Aucun département ne vous est attribué.",
          success: false,
          error: true,
        });
      }

      if (cible.role === "enseignant") {
        autorise = cible.departement?._id?.toString() === dep._id.toString();
      } else if (cible.role === "etudiant") {
        const depEtudiant =
          cible.classe?.niveau?.filiere?.departement?._id?.toString();
        autorise = depEtudiant === dep._id.toString();
      }
    }

    if (!autorise && estEnseignant && cible.role === "etudiant") {
      // Un enseignant peut voir les étudiants des classes liées à ses modules
      // (classe rattachée au même niveau qu'au moins un de ses modules)
      const mesModules = await Module.find({ enseignant: req.userId }).select(
        "niveau",
      );
      const mesNiveauIds = mesModules.map((m) => m.niveau.toString());
      const niveauEtudiant = cible.classe?.niveau?._id?.toString();
      autorise = mesNiveauIds.includes(niveauEtudiant);
    }

    if (!autorise) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à consulter ce profil.",
        success: false,
        error: true,
      });
    }

    // ───── Si c'est un étudiant, on enrichit avec ses stats ─────
    let details = { user: cible };

    if (cible.role === "etudiant") {
      // 1. Notes par module
      const notes = await Note.find({ etudiant: id })
        .populate("module", "titre code coefficient")
        .sort({ createdAt: -1 })
        .lean();

      // Moyenne générale pondérée par coefficient
      let sommeNotes = 0;
      let sommeCoeff = 0;
      notes.forEach((n) => {
        if (n.noteMoyenne !== null && n.module?.coefficient) {
          sommeNotes += n.noteMoyenne * n.module.coefficient;
          sommeCoeff += n.module.coefficient;
        }
      });
      const moyenneGenerale =
        sommeCoeff > 0 ? Number((sommeNotes / sommeCoeff).toFixed(2)) : null;

      // 2. Progression par module
      const progressions = await Progression.find({ etudiant: id })
        .populate("module", "titre code")
        .sort({ derniereActiviteAt: -1 })
        .lean();

      const progressionMoyenne =
        progressions.length > 0
          ? Math.round(
              progressions.reduce((acc, p) => acc + p.pourcentage, 0) /
                progressions.length,
            )
          : 0;

      // 3. Dernières soumissions
      const soumissions = await Soumission.find({ etudiant: id })
        .populate({
          path: "devoir",
          select: "titre type noteMax module",
          populate: { path: "module", select: "titre code" },
        })
        .sort({ dateSoumission: -1 })
        .limit(8)
        .lean();

      // 4. Derniers résultats de quiz
      const resultatsQuiz = await ReponseQuiz.find({
        etudiant: id,
        statut: "soumis",
      })
        .populate({
          path: "quiz",
          select: "titre module",
          populate: { path: "module", select: "titre" },
        })
        .sort({ soumisAt: -1 })
        .limit(6)
        .lean();

      // 5. Stats globales
      const [nbDevoirsSoumis, nbQuizFaits] = await Promise.all([
        Soumission.countDocuments({ etudiant: id }),
        ReponseQuiz.countDocuments({ etudiant: id, statut: "soumis" }),
      ]);

      details.stats = {
        moyenneGenerale,
        progressionMoyenne,
        nbDevoirsSoumis,
        nbQuizFaits,
        nbModulesInscrits: notes.length || progressions.length,
      };
      details.notes = notes.map((n) => ({
        _id: n._id,
        module: n.module,
        noteDevoirs: n.noteDevoirs,
        noteExamens: n.noteExamens,
        noteQuiz: n.noteQuiz,
        noteMoyenne: n.noteMoyenne,
        mention: n.mention,
        rang: n.rang,
      }));
      details.progressions = progressions.map((p) => ({
        _id: p._id,
        module: p.module,
        pourcentage: p.pourcentage,
        derniereActiviteAt: p.derniereActiviteAt,
      }));
      details.recentSubmissions = soumissions.map((s) => ({
        _id: s._id,
        devoir: s.devoir,
        note: s.note,
        statut: s.statut,
        dateSoumission: s.dateSoumission,
        estTardif: s.estTardif,
      }));
      details.recentQuizzes = resultatsQuiz.map((r) => ({
        _id: r._id,
        quiz: r.quiz,
        noteFinale: r.noteFinale,
        score: r.score,
        scoreMax: r.scoreMax,
        soumisAt: r.soumisAt,
      }));
    }

    return res.status(200).json({
      message: "Détails récupérés.",
      success: true,
      error: false,
      data: details,
    });
  } catch (error) {
    console.error("Erreur GET /api/users/:id/details :", error);
    return res.status(500).json({
      message: "Erreur serveur.",
      success: false,
      error: true,
    });
  }
};

module.exports = { getUsers, createUser, updateUser, toggleUserStatus, getUserDetails };
