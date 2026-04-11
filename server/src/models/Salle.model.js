const mongoose = require("mongoose");

const salleSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['amphitheatre', 'salle_cours', 'labo', 'salle_td'],
      default: 'salle_cours',
    },
    capacite: {
      type: Number,
      required: true,
    },
    etablissement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Etablissement',
      required: true,
    },
    estDisponible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

salleSchema.index({ etablissement: 1, nom: 1 }, { unique: true });

module.exports = mongoose.model('Salle', salleSchema);