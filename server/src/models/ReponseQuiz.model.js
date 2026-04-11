const mongoose = require("mongoose");

const reponseItemSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reponsesChoisies: [String], // index ou texte des options sélectionnées
    reponseTexte: { type: String, default: null }, // pour reponse_courte
    estCorrecte: { type: Boolean, default: false },
    pointsObtenus: { type: Number, default: 0 },
  },
  { _id: false }
);

const reponseQuizSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tentativeNumero: {
      type: Number,
      default: 1,
    },
    reponses: [reponseItemSchema],
    score: {
      type: Number,
      default: 0,
    },
    scoreMax: {
      type: Number,
      default: 0,
    },
    noteFinale: {
      type: Number, // score ramené sur 20
      default: 0,
    },
    debuteAt: {
      type: Date,
      default: Date.now,
    },
    soumisAt: {
      type: Date,
      default: null,
    },
    dureeSecondes: {
      type: Number,
      default: null,
    },
    statut: {
      type: String,
      enum: ['en_cours', 'soumis', 'expire'],
      default: 'en_cours',
    },
  },
  { timestamps: true }
);

reponseQuizSchema.index({ quiz: 1, etudiant: 1, tentativeNumero: 1 });

module.exports = mongoose.model('ReponseQuiz', reponseQuizSchema);