const mongoose = require("mongoose");

const departementSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    chefDepartement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    estActif: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

departementSchema.virtual('filieres', {
  ref: 'Filiere',
  localField: '_id',
  foreignField: 'departement',
});

module.exports = mongoose.model('Departement', departementSchema);