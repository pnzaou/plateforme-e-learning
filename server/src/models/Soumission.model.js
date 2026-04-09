const mongoose = require("mongoose");

const soumissionSchema = new mongoose.Schema(
  {
    devoir: {
      type: Schema.Types.ObjectId,
      ref: 'Devoir',
      required: true,
    },
    etudiant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Fichiers soumis par l'étudiant
    fichiers: [
      {
        nom: String,
        url: String,
        taille: Number,
        type: String,
      },
    ],
    commentaire: {
      type: String,
      default: '',
    },
    dateSoumission: {
      type: Date,
      default: Date.now,
    },
    estTardif: {
      type: Boolean,
      default: false,
    },
    statut: {
      type: String,
      enum: ['soumis', 'en_correction', 'corrige', 'rendu'],
      default: 'soumis',
    },
    // Correction
    note: {
      type: Number,
      min: 0,
      default: null,
    },
    feedback: {
      type: String,
      default: null,
    },
    corrigePar: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    corrigeAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Un étudiant ne peut soumettre qu'une fois par devoir
soumissionSchema.index({ devoir: 1, etudiant: 1 }, { unique: true });

export default mongoose.model('Soumission', soumissionSchema);