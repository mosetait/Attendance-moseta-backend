const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');  // Import the UUID library

const employeeSchema = new mongoose.Schema({
  
  employeeId: {
    type: String,
    default: uuidv4,  // Use UUID v4 as the default value
    unique: true,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['employee', 'admin'],
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  salary: {
    type: Number,
    required: true
  },

  allowedLeaves: {
    type: Number,
    default: 1
  },

  allowedHalfDays: {
    type: Number,
    default: 1
  },

  earlyExits: {
    type: Number,
    default: 0
  },

  lateArrivals:{
    type: Number,
    default: 0
  },

  name: {
    type: String,
    required: true
  },

  contactNumber: {
    type: String
  },

  department: {
    type: String
  },

  office:{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Office"
  }


},{timestamps: true});

module.exports = mongoose.model('Employee', employeeSchema);
