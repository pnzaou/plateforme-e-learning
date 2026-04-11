const mongoose = require("mongoose");

const progressionSchema = new mongoose.Schema(
  {
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    // IDs des contenus consultés
    contenusVus: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contenu',
      },
    ],
    // IDs des chapitres terminés
    chapitresTermines: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapitre',
      },
    ],
    pourcentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    derniereActiviteAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

progressionSchema.index({ etudiant: 1, module: 1 }, { unique: true });

// Recalcul du pourcentage avant chaque save
progressionSchema.pre('save', async function (next) {
  if (!this.isModified('contenusVus')) return next();
  try {
    const Contenu = mongoose.model('Contenu');
    // On compte les contenus publiés dans tous les chapitres du module
    const chapitres = await mongoose.model('Chapitre').find({ module: this.module }).select('_id');
    const chapitreIds = chapitres.map((c) => c._id);
    const totalContenus = await Contenu.countDocuments({
      chapitre: { $in: chapitreIds },
      estPublie: true,
    });
    this.pourcentage = totalContenus > 0
      ? Math.round((this.contenusVus.length / totalContenus) * 100)
      : 0;
    this.derniereActiviteAt = new Date();
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Progression', progressionSchema);