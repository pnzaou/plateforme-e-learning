const mongoose = require("mongoose");

const filiereSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    departement: {
      type: Schema.Types.ObjectId,
      ref: 'Departement',
      required: true,
    },
    estActif: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

filiereSchema.virtual('niveaux', {
  ref: 'Niveau',
  localField: '_id',
  foreignField: 'filiere',
});

filiereSchema.index({ departement: 1, code: 1 }, { unique: true });

export default mongoose.model('Filiere', filiereSchema);