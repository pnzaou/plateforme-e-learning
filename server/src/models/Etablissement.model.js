const mongoose = require("mongoose");

const etablissementSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    adresse: {
      type: String,
      default: '',
    },
    telephone: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    estActif: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

etablissementSchema.virtual('salles', {
  ref: 'Salle',
  localField: '_id',
  foreignField: 'etablissement',
});

module.exports = mongoose.model('Etablissement', etablissementSchema);