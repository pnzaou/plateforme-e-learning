const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
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
    classe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classe',
      required: true,
    },
    anneeScolaire: {
      type: String,
      required: true,
    },
    // Détail des composantes
    noteDevoirs: {
      type: Number,
      default: null,
    },
    noteExamens: {
      type: Number,
      default: null,
    },
    noteQuiz: {
      type: Number,
      default: null,
    },
    // Moyenne finale sur 20 (pondérée selon coefficients)
    noteMoyenne: {
      type: Number,
      default: null,
    },
    // Rang dans la classe pour ce module
    rang: {
      type: Number,
      default: null,
    },
    mention: {
      type: String,
      enum: ['passable', 'assez_bien', 'bien', 'tres_bien', 'excellent', null],
      default: null,
    },
    calculeeAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Un seul document de note par étudiant + module + année
noteSchema.index(
  { etudiant: 1, module: 1, anneeScolaire: 1 },
  { unique: true }
);
noteSchema.index({ classe: 1, module: 1, anneeScolaire: 1 });

// Hook : calcul automatique de la mention
noteSchema.pre('save', function (next) {
  if (this.noteMoyenne === null) return next();
  const m = this.noteMoyenne;
  if (m >= 18) this.mention = 'excellent';
  else if (m >= 16) this.mention = 'tres_bien';
  else if (m >= 14) this.mention = 'bien';
  else if (m >= 12) this.mention = 'assez_bien';
  else if (m >= 10) this.mention = 'passable';
  else this.mention = null;
  next();
});

module.exports = mongoose.model('Note', noteSchema);