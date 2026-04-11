const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    enonce: { type: String, required: true },
    type: {
      type: String,
      enum: ['choix_unique', 'choix_multiple', 'vrai_faux', 'reponse_courte'],
      required: true,
    },
    options: [
      {
        texte: { type: String, required: true },
        estCorrecte: { type: Boolean, default: false },
      },
    ],
    // Pour reponse_courte, la correction attendue
    reponseAttendue: {
      type: String,
      default: null,
    },
    points: {
      type: Number,
      default: 1,
    },
    explication: {
      type: String,
      default: null, // Affiché après correction
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
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
    enseignant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questions: [questionSchema],
    dureeMinutes: {
      type: Number,
      default: 30,
    },
    tentativesMax: {
      type: Number,
      default: 1,
    },
    ouvertureAt: {
      type: Date,
      default: null,
    },
    fermetureAt: {
      type: Date,
      default: null,
    },
    afficherCorrection: {
      type: Boolean,
      default: true, // Montrer les bonnes réponses après soumission
    },
    ordreAleatoire: {
      type: Boolean,
      default: false,
    },
    estPublie: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

quizSchema.index({ module: 1, classe: 1 });

module.exports = mongoose.model('Quiz', quizSchema);