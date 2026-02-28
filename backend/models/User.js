const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  fullName: {
    type: String,
    required: [true, 'Please provide full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  age: {
    type: Number,
    required: [true, 'Please provide age'],
    min: 1,
    max: 120
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
    select: false
  },
  emergencyContact: {
    type: String,
    required: true
  },
  allergies: {
    type: String,
    default: 'None'
  },
  chronicConditions: {
    type: String,
    default: 'None'
  },
  currentMedications: {
    type: String,
    default: 'None'
  },
  doctorName: String,
  insuranceInfo: String,
  profilePhoto: {
    type: String,
    default: ''
  },
  qrCode: {
    type: String
  },
  qrCodeUrl: String,
  isActive: {
    type: Boolean,
    default: true
  },
  currentChallenge: {
    type: String
  },
  devices: [{
    credentialID: { type: Buffer },
    credentialPublicKey: { type: Buffer },
    counter: { type: Number },
    credentialDeviceType: { type: String },
    credentialBackedUp: { type: Boolean },
    transports: [{ type: String }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate User ID from name and age
userSchema.pre('validate', function (next) {
  if (this.fullName && this.age && !this.userId) {
    this.userId = this.fullName.replace(/\s+/g, '').toUpperCase() + this.age;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);