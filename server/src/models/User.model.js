const mongoose = require("mongoose");

const ROLES = ['admin', 'chef_departement', 'enseignant', 'etudiant'];

const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
    },
    prenom: {
      type: String,
      required: [true, 'Le prénom est obligatoire'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Format email invalide'],
    },
    motDePasse: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [8, 'Minimum 8 caractères'],
      select: false,
    },
    role: {
      type: String,
      enum: { values: ROLES, message: 'Rôle invalide' },
      required: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    telephone: {
      type: String,
      trim: true,
      default: null,
    },
    // Champ spécifique aux enseignants
    specialite: {
      type: String,
      default: null,
    },
    // Champ spécifique aux étudiants
    matricule: {
      type: String,
      unique: true,
      sparse: true, // null autorisé pour les non-étudiants
      default: null,
    },
    classe: {
      type: Schema.Types.ObjectId,
      ref: 'Classe',
      default: null,
    },
    estActif: {
      type: Boolean,
      default: true,
    },
    dernierConnexion: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual : nom complet
userSchema.virtual('nomComplet').get(function () {
  return `${this.prenom} ${this.nom}`;
});

// Index de recherche
userSchema.index({ email: 1 });
userSchema.index({ role: 1, estActif: 1 });
userSchema.index({ matricule: 1 });

export default mongoose.model('User', userSchema);