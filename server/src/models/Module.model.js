const mongoose = require("mongoose");

const STATUTS = ['brouillon', 'en_revision', 'publie', 'archive'];

const moduleSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, 'Le titre est obligatoire'],
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
    niveau: {
      type: Schema.Types.ObjectId,
      ref: 'Niveau',
      required: true,
    },
    enseignant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Coefficient du module pour le calcul de la moyenne
    coefficient: {
      type: Number,
      default: 1,
      min: 1,
    },
    statut: {
      type: String,
      enum: STATUTS,
      default: 'brouillon',
    },
    image: {
      type: String,
      default: null,
    },
    // L'admin ou chef de dep approuve le contenu
    approuvePar: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approuveAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

moduleSchema.virtual('chapitres', {
  ref: 'Chapitre',
  localField: '_id',
  foreignField: 'module',
});

moduleSchema.index({ niveau: 1, code: 1 }, { unique: true });
moduleSchema.index({ enseignant: 1, statut: 1 });

export default mongoose.model('Module', moduleSchema);