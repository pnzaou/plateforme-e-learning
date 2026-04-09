const mongoose = require("mongoose");

const emploiDuTempsSchema = new mongoose.Schema(
  {
    module: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    enseignant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    classe: {
      type: Schema.Types.ObjectId,
      ref: 'Classe',
      required: true,
    },
    salle: {
      type: Schema.Types.ObjectId,
      ref: 'Salle',
      required: true,
    },
    typeSeance: {
      type: String,
      enum: ['cours', 'td', 'tp', 'examen', 'rattrapage'],
      required: true,
    },
    dateDebut: {
      type: Date,
      required: true,
    },
    dateFin: {
      type: Date,
      required: true,
    },
    // Qui a créé/modifié ce créneau (admin ou chef de dép)
    creePar: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    estAnnule: {
      type: Boolean,
      default: false,
    },
    motifAnnulation: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Contrainte : pas de double réservation salle sur le même créneau
emploiDuTempsSchema.index({ salle: 1, dateDebut: 1, dateFin: 1 });
emploiDuTempsSchema.index({ enseignant: 1, dateDebut: 1 });
emploiDuTempsSchema.index({ classe: 1, dateDebut: 1 });

// Validation : dateFin > dateDebut
emploiDuTempsSchema.pre('save', function (next) {
  if (this.dateFin <= this.dateDebut) {
    return next(new Error('La date de fin doit être postérieure à la date de début'));
  }
  next();
});

export default mongoose.model('EmploiDuTemps', emploiDuTempsSchema);