const mongoose = require("mongoose");

const classeSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    niveau: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Niveau',
      required: true,
    },
    anneeScolaire: {
      type: String,
      required: true, // ex. "2024-2025"
      match: [/^\d{4}-\d{4}$/, 'Format attendu : YYYY-YYYY'],
    },
    capacite: {
      type: Number,
      default: 40,
    },
    estActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

classeSchema.virtual('etudiants', {
  ref: 'User',
  localField: '_id',
  foreignField: 'classe',
});

classeSchema.index({ niveau: 1, anneeScolaire: 1, nom: 1 }, { unique: true });

module.exports = mongoose.model('Classe', classeSchema);