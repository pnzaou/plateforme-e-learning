const mongoose = require("mongoose");

// Ex. L1, L2, L3, M1, M2, DUT1, DUT2…
const niveauSchema = new mongoose.Schema(
  {
    libelle: {
      type: String,
      required: [true, 'Le libellé est obligatoire'],
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    filiere: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Filiere',
      required: true,
    },
    ordre: {
      type: Number,
      required: true, // permet de trier L1 < L2 < L3
    },
  },
  { timestamps: true }
);

niveauSchema.index({ filiere: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Niveau', niveauSchema);