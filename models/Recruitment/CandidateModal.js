const mongoose = require('mongoose');
const { Schema } = mongoose;

const candidateSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  resumeUrl: {  // Resume is stored in Cloudinary or another storage service
    type: String,
    required: true,
  },
  currentStage: {
    type: String,
    enum: ['Hiring', 'Screening', 'Interviewing', 'Making Job Offer', 'Onboarding', 'Rejected'],
    default: 'Hiring',
  },
  process: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruitmentProcess',  // Reference to the recruitment process
    required: true,
  },
  rejectionReason: {
    type: String,
    default: null,  // If rejected, this field can store the reason
  },
  isRejected: {
    type: Boolean,
    default: false,
  },
  notes: {  // HR notes about the candidate's performance
    type: String,
    default: '',
  }
}, { timestamps: true });

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
