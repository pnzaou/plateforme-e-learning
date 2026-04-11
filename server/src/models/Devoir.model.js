const mongoose = require("mongoose");

const devoirSchema = new mongoose.Schema(
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
    consigne: {
      type: String, // HTML enrichi
      default: '',
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    classe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classe',
      required: true,
    },
    enseignant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['devoir', 'examen', 'projet', 'tp_note', 'rattrapage'],
      required: true,
    },
    dateLimite: {
      type: Date,
      required: true,
    },
    noteMax: {
      type: Number,
      default: 20,
    },
    coefficient: {
      type: Number,
      default: 1,
    },
    // Fichiers joints par l'enseignant (énoncés, ressources)
    fichiers: [
      {
        nom: String,
        url: String,
        type: String,
      },
    ],
    estPublie: {
      type: Boolean,
      default: false,
    },
    autoriserRenduTardif: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

devoirSchema.index({ module: 1, classe: 1 });
devoirSchema.index({ enseignant: 1, type: 1 });

module.exports = mongoose.model('Devoir', devoirSchema);