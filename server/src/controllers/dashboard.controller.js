const {
  User,
  Module,
  Quiz,
  Note,
  Departement,
  Filiere,
  Niveau,
  Classe,
  Inscription,
  EmploiDuTemps,
  Devoir,
  Soumission,
  Contenu,
  Chapitre,
} = require("../models");

// Helper : format relatif en français
function formatRelativeDate(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const j = Math.floor(diff / 86400000);

  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min}min`;
  if (h < 24) return `Il y a ${h}h`;
  if (j === 1) return "Hier";
  if (j < 7) return `Il y a ${j} jours`;
  return new Date(date).toLocaleDateString("fr-FR");
}

const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const sixMoisAvant = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const debutMoisActuel = new Date(now.getFullYear(), now.getMonth(), 1);
    const debutMoisPrecedent = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    // ==========================================================
    // 1. STATS PRINCIPALES (les 4 cartes du haut)
    // ==========================================================
    const [
      totalEtudiants,
      etudiantsMoisDernier,
      enseignantsActifs,
      enseignantsMoisDernier,
      totalCours,
      nouveauxCours,
    ] = await Promise.all([
      User.countDocuments({ role: "etudiant", estActif: true }),
      User.countDocuments({
        role: "etudiant",
        estActif: true,
        createdAt: { $lt: debutMoisActuel },
      }),
      User.countDocuments({ role: "enseignant", estActif: true }),
      User.countDocuments({
        role: "enseignant",
        estActif: true,
        createdAt: { $lt: debutMoisActuel },
      }),
      Module.countDocuments({ statut: "publie" }),
      Module.countDocuments({
        statut: "publie",
        createdAt: { $gte: sixMoisAvant },
      }),
    ]);

    // Calcul des tendances (%)
    const trendEtudiants =
      etudiantsMoisDernier > 0
        ? Math.round(
            ((totalEtudiants - etudiantsMoisDernier) / etudiantsMoisDernier) * 100
          )
        : 0;
    const trendEnseignants =
      enseignantsMoisDernier > 0
        ? Math.round(
            ((enseignantsActifs - enseignantsMoisDernier) / enseignantsMoisDernier) * 100
          )
        : 0;
    
    // Taux de réussite global (notes >= 10)
    const [totalNotes, notesReussies, moyenneGlobaleAgg] = await Promise.all([
      Note.countDocuments({ noteMoyenne: { $ne: null } }),
      Note.countDocuments({ noteMoyenne: { $gte: 10 } }),
      Note.aggregate([
        { $match: { noteMoyenne: { $ne: null } } },
        { $group: { _id: null, moyenne: { $avg: "$noteMoyenne" } } },
      ]),
    ]);

    const tauxReussite =
      totalNotes > 0 ? Math.round((notesReussies / totalNotes) * 100) : 0;
    const moyenneGlobale =
      moyenneGlobaleAgg[0]?.moyenne?.toFixed(1) || "0.0";

    const stats = [
      {
        title: "Total étudiants",
        value: totalEtudiants,
        icon: "Users",
        trend: { value: Math.abs(trendEtudiants), positive: trendEtudiants >= 0 },
      },
      {
        title: "Enseignants actifs",
        value: enseignantsActifs,
        icon: "GraduationCap",
        trend: {
          value: Math.abs(trendEnseignants),
          positive: trendEnseignants >= 0,
        },
      },
      {
        title: "Cours disponibles",
        value: totalCours,
        icon: "BookOpen",
        subtitle: `${nouveauxCours} nouveaux ce semestre`,
      },
      {
        title: "Taux de réussite",
        value: `${tauxReussite}%`,
        icon: "TrendingUp",
        trend: { value: 0, positive: true },
      },
    ];

    // ==========================================================
    // 2. STATS PAR DÉPARTEMENT
    // ==========================================================
    const departements = await Departement.find({ estActif: true }).lean();

    const departmentStats = await Promise.all(
      departements.map(async (dep) => {
        // Filières -> Niveaux -> Classes -> Étudiants
        const filieres = await Filiere.find({ departement: dep._id }).select("_id");
        const filiereIds = filieres.map((f) => f._id);

        const niveaux = await Niveau.find({ filiere: { $in: filiereIds } }).select("_id");
        const niveauIds = niveaux.map((n) => n._id);

        const classes = await Classe.find({ niveau: { $in: niveauIds } }).select("_id");
        const classeIds = classes.map((c) => c._id);

        const [students, courses, notesDepAgg, reussitesDep, totalNotesDep] =
          await Promise.all([
            User.countDocuments({
              role: "etudiant",
              estActif: true,
              classe: { $in: classeIds },
            }),
            Module.countDocuments({
              niveau: { $in: niveauIds },
              statut: "publie",
            }),
            Note.aggregate([
              { $match: { classe: { $in: classeIds }, noteMoyenne: { $ne: null } } },
              { $group: { _id: null, moyenne: { $avg: "$noteMoyenne" } } },
            ]),
            Note.countDocuments({
              classe: { $in: classeIds },
              noteMoyenne: { $gte: 10 },
            }),
            Note.countDocuments({
              classe: { $in: classeIds },
              noteMoyenne: { $ne: null },
            }),
          ]);

        return {
          name: dep.nom,
          students,
          courses,
          avgGrade: Number((notesDepAgg[0]?.moyenne || 0).toFixed(1)),
          successRate:
            totalNotesDep > 0
              ? Math.round((reussitesDep / totalNotesDep) * 100)
              : 0,
        };
      })
    );

     // ==========================================================
    // 3. APPROBATIONS EN ATTENTE
    // ==========================================================
    const [modulesEnRevision, inscriptionsEnAttente] = await Promise.all([
      Module.find({ statut: "en_revision" })
        .populate("enseignant", "prenom nom")
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      Inscription.countDocuments({ statut: "en_attente" }),
    ]);

    const pendingApprovals = modulesEnRevision.map((m) => ({
      type: "Nouveau cours",
      title: m.titre,
      by: m.enseignant
        ? `Prof. ${m.enseignant.nom}`
        : "Inconnu",
      date: formatRelativeDate(m.updatedAt),
    }));

    if (inscriptionsEnAttente > 0) {
      pendingApprovals.push({
        type: "Inscription",
        title: `${inscriptionsEnAttente} étudiant(s) en attente`,
        by: "Scolarité",
        date: "",
      });
    }

    // ==========================================================
    // 4. ACTIVITÉ RÉCENTE (approche pragmatique)
    // ==========================================================
    const [derniersModules, derniersEtudiants] = await Promise.all([
      Module.find({ statut: "publie" })
        .populate("enseignant", "prenom nom")
        .sort({ updatedAt: -1 })
        .limit(3)
        .lean(),
      User.find({ role: "etudiant" })
        .sort({ createdAt: -1 })
        .limit(1)
        .lean(),
    ]);

    const recentActivity = [];

    derniersModules.forEach((m) => {
      recentActivity.push({
        text: `${m.enseignant ? "Prof. " + m.enseignant.nom : "Un enseignant"} a publié "${m.titre}"`,
        time: formatRelativeDate(m.updatedAt),
        icon: "BookOpen",
        color: "text-primary",
      });
    });

    const etudiantsRecents = await User.countDocuments({
      role: "etudiant",
      createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    });
    if (etudiantsRecents > 0) {
      recentActivity.push({
        text: `${etudiantsRecents} nouveaux étudiants inscrits`,
        time: "Cette semaine",
        icon: "UserCheck",
        color: "text-success",
      });
    }

    // ==========================================================
    // 5. RÉSUMÉ PLATEFORME
    // ==========================================================
    const quizActifs = await Quiz.countDocuments({ estPublie: true });

    const resume = {
      moyenneGlobale,
      tauxReussite: `${tauxReussite}%`,
      quizActifs,
      tauxPresence: "—", // à implémenter quand un modèle Présence existera
    };

    return res.status(200).json({
      message: "Données du dashboard récupérées avec succès.",
      success: true,
      error: false,
      data: {
        stats,
        departmentStats,
        pendingApprovals,
        recentActivity,
        resume,
      },
    });

  } catch (error) {
    console.error("Erreur GET /api/dashboard/admin :", error);
    return res.status(500).json({
      message: "Erreur serveur.",
      success: false,
      error: true,
    });
  }
};

const getTeacherDashboard = async (req, res) => {
  try {
    const enseignantId = req.userId;
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const debutMoisPrecedent = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const debutSemestre = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // ==========================================================
    // 1. STATS PRINCIPALES
    // ==========================================================

    // Mes modules (cours)
    const mesModules = await Module.find({ enseignant: enseignantId })
      .select("_id titre niveau coefficient")
      .lean();
    const moduleIds = mesModules.map((m) => m._id);
    const totalCours = mesModules.length;

    // Tendance cours : combien créés ce mois vs mois dernier
    const [coursMoisActuel, coursMoisPrecedent] = await Promise.all([
      Module.countDocuments({
        enseignant: enseignantId,
        createdAt: { $gte: debutMois },
      }),
      Module.countDocuments({
        enseignant: enseignantId,
        createdAt: { $gte: debutMoisPrecedent, $lt: debutMois },
      }),
    ]);
    const trendCours = coursMoisPrecedent > 0
      ? Math.round(((coursMoisActuel - coursMoisPrecedent) / coursMoisPrecedent) * 100)
      : (coursMoisActuel > 0 ? 100 : 0);

    // Étudiants inscrits = étudiants des classes où l'enseignant a un emploi du temps
    const edts = await EmploiDuTemps.find({ enseignant: enseignantId })
      .select("classe")
      .lean();
    const classeIds = [...new Set(edts.map((e) => e.classe.toString()))];

    const totalEtudiants = await User.countDocuments({
      role: "etudiant",
      estActif: true,
      classe: { $in: classeIds },
    });

    // Quiz créés ce semestre
    const quizCeSemestre = await Quiz.countDocuments({
      enseignant: enseignantId,
      createdAt: { $gte: debutSemestre },
    });

    // Devoirs à corriger (soumissions en attente sur les devoirs de l'enseignant)
    const mesDevoirs = await Devoir.find({ enseignant: enseignantId }).select("_id").lean();
    const devoirIds = mesDevoirs.map((d) => d._id);
    const devoirsACorreger = await Soumission.countDocuments({
      devoir: { $in: devoirIds },
      statut: { $in: ["soumis", "en_correction"] },
    });

    const stats = [
      {
        title: "Mes cours",
        value: totalCours,
        icon: "BookOpen",
        trend: { value: Math.abs(trendCours), positive: trendCours >= 0 },
      },
      {
        title: "Étudiants inscrits",
        value: totalEtudiants,
        icon: "Users",
        trend: { value: 0, positive: true },
      },
      {
        title: "Quiz créés",
        value: quizCeSemestre,
        icon: "ClipboardCheck",
        subtitle: "Ce semestre",
      },
      {
        title: "Devoirs à corriger",
        value: devoirsACorreger,
        icon: "FileText",
        subtitle: "En attente",
      },
    ];

    // ==========================================================
    // 2. MES COURS (avec stats par cours)
    // ==========================================================
    const myCourses = await Promise.all(
      mesModules.map(async (mod) => {
        // Étudiants ayant ce module via leur classe (via EDT)
        const edtsCours = await EmploiDuTemps.find({
          module: mod._id,
          enseignant: enseignantId,
        }).select("classe").lean();
        const classeIdsCours = [...new Set(edtsCours.map((e) => e.classe.toString()))];

        const [students, notesAgg, totalChapitres, chapitresPublies, devoirsCoursIds] =
          await Promise.all([
            User.countDocuments({
              role: "etudiant",
              estActif: true,
              classe: { $in: classeIdsCours },
            }),
            Note.aggregate([
              { $match: { module: mod._id, noteMoyenne: { $ne: null } } },
              { $group: { _id: null, moyenne: { $avg: "$noteMoyenne" } } },
            ]),
            Chapitre.countDocuments({ module: mod._id }),
            Chapitre.countDocuments({ module: mod._id, estPublie: true }),
            Devoir.find({ module: mod._id, enseignant: enseignantId })
              .select("_id")
              .lean(),
          ]);

        // Progression du cours = % de chapitres publiés
        const progress = totalChapitres > 0
          ? Math.round((chapitresPublies / totalChapitres) * 100)
          : 0;

        // Devoirs à corriger pour ce cours
        const idsDevoirsCours = devoirsCoursIds.map((d) => d._id);
        const pendingAssignments = await Soumission.countDocuments({
          devoir: { $in: idsDevoirsCours },
          statut: { $in: ["soumis", "en_correction"] },
        });

        return {
          id: mod._id.toString(),
          title: mod.titre,
          students,
          avgGrade: Number((notesAgg[0]?.moyenne || 0).toFixed(1)),
          progress,
          pendingAssignments,
        };
      })
    );

    // ==========================================================
    // 3. SOUMISSIONS RÉCENTES
    // ==========================================================
    const soumissionsRecentes = await Soumission.find({
      devoir: { $in: devoirIds },
    })
      .populate("etudiant", "nom prenom")
      .populate({
        path: "devoir",
        select: "titre module",
        populate: { path: "module", select: "titre" },
      })
      .sort({ dateSoumission: -1 })
      .limit(6)
      .lean();

    const recentSubmissions = soumissionsRecentes.map((s) => ({
      student: s.etudiant ? `${s.etudiant.prenom} ${s.etudiant.nom}` : "Inconnu",
      course: s.devoir?.module?.titre || "",
      assignment: s.devoir?.titre || "",
      date: formatRelativeDate(s.dateSoumission),
      status: s.statut === "corrige" || s.statut === "rendu" ? "graded" : "pending",
    }));

    // ==========================================================
    // 4. EMPLOI DU TEMPS À VENIR (4 prochains cours)
    // ==========================================================
    const upcomingEdts = await EmploiDuTemps.find({
      enseignant: enseignantId,
      dateDebut: { $gte: now },
      estAnnule: false,
    })
      .populate("module", "titre")
      .populate("salle", "nom")
      .sort({ dateDebut: 1 })
      .limit(4)
      .lean();

    const joursFr = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const upcomingClasses = upcomingEdts.map((e) => {
      const debut = new Date(e.dateDebut);
      const fin = new Date(e.dateFin);
      const formatHeure = (d) =>
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      return {
        title: e.module?.titre || "Cours",
        time: `${formatHeure(debut)} - ${formatHeure(fin)}`,
        room: e.salle?.nom || "—",
        day: joursFr[debut.getDay()],
      };
    });

    // ==========================================================
    // 5. STATISTIQUES RAPIDES
    // ==========================================================
    const [moyenneGeneraleAgg, totalNotes, notesReussies, totalLeconsPubliees] =
      await Promise.all([
        Note.aggregate([
          { $match: { module: { $in: moduleIds }, noteMoyenne: { $ne: null } } },
          { $group: { _id: null, moyenne: { $avg: "$noteMoyenne" } } },
        ]),
        Note.countDocuments({ module: { $in: moduleIds }, noteMoyenne: { $ne: null } }),
        Note.countDocuments({ module: { $in: moduleIds }, noteMoyenne: { $gte: 10 } }),
        Contenu.countDocuments({
          chapitre: {
            $in: await Chapitre.find({ module: { $in: moduleIds } })
              .distinct("_id"),
          },
          estPublie: true,
        }),
      ]);

    const resume = {
      moyenneGenerale: Number((moyenneGeneraleAgg[0]?.moyenne || 0).toFixed(1)),
      tauxPresence: "—", // pas de modèle Présence pour l'instant
      leconsPubliees: totalLeconsPubliees,
      tauxReussite:
        totalNotes > 0
          ? `${Math.round((notesReussies / totalNotes) * 100)}%`
          : "0%",
    };

    // ==========================================================
    return res.status(200).json({
      message: "Données récupérées avec succès.",
      success: true,
      error: false,
      data: {
        stats,
        myCourses,
        recentSubmissions,
        upcomingClasses,
        resume,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/dashboard/teacher :", error);
    return res.status(500).json({
      message: "Erreur serveur.",
      success: false,
      error: true,
    });
  }
};

module.exports = { getAdminDashboard, getTeacherDashboard };
