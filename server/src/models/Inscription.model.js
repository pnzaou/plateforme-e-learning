const mongoose = require("mongoose");

const inscriptionSchema = new mongoose.Schema(
  {
    etudiant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    classe: {
      type: Schema.Types.ObjectId,
      ref: 'Classe',
      required: true,
    },
    anneeScolaire: {
      type: String,
      required: true,
    },
    dateInscription: {
      type: Date,
      default: Date.now,
    },
    statut: {
      type: String,
      enum: ['en_attente', 'validee', 'rejetee', 'annulee'],
      default: 'en_attente',
    },
    validePar: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    valideAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Un étudiant ne peut être inscrit qu'une fois par classe par année
inscriptionSchema.index(
  { etudiant: 1, classe: 1, anneeScolaire: 1 },
  { unique: true }
);

export default mongoose.model('Inscription', inscriptionSchema);