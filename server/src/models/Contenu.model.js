const mongoose = require("mongoose");

const TYPES = ['texte', 'video', 'image', 'pdf', 'audio', 'lien'];

const contenuSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: { values: TYPES, message: 'Type de contenu invalide' },
      required: true,
    },
    chapitre: {
      type: Schema.Types.ObjectId,
      ref: 'Chapitre',
      required: true,
    },
    ordre: {
      type: Number,
      required: true,
    },
    // Selon le type
    texte: {
      type: String,
      default: null, // HTML enrichi (TipTap, Quill…)
    },
    urlFichier: {
      type: String,
      default: null, // chemin Cloudinary ou local
    },
    urlExterne: {
      type: String,
      default: null, // liens YouTube, docs externes…
    },
    dureeMinutes: {
      type: Number,
      default: null, // pour les vidéos
    },
    estPublie: {
      type: Boolean,
      default: false,
    },
    telechargeable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

contenuSchema.index({ chapitre: 1, ordre: 1 });

export default mongoose.model('Contenu', contenuSchema);