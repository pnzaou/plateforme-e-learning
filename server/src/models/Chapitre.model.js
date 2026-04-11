const mongoose = require("mongoose");

const chapitreSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    // Sous-chapitre optionnel (self-reference)
    parentChapitre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapitre',
      default: null,
    },
    ordre: {
      type: Number,
      required: true,
    },
    estPublie: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

chapitreSchema.virtual('sousChapitres', {
  ref: 'Chapitre',
  localField: '_id',
  foreignField: 'parentChapitre',
});

chapitreSchema.virtual('contenus', {
  ref: 'Contenu',
  localField: '_id',
  foreignField: 'chapitre',
});

chapitreSchema.index({ module: 1, ordre: 1 });

module.exports = mongoose.model('Chapitre', chapitreSchema);