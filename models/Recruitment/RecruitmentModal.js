const mongoose = require('mongoose');
const { Schema } = mongoose;

const recruitmentProcessSchema = new Schema({

  department: {
    type: String,
    required: true,
  },

  jobTitle: {
    type: String,
    required: true,
  },

  startDate: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    enum: ['Active', 'Closed'],
    default: 'Active',
  },

  candidates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',  // Reference to Candidate model
  }],

  stages: {
    type: [String],
    default: ['Hiring', 'Screening', 'Interviewing', 'Making Job Offer', 'Onboarding'],
  },
  
}, { timestamps: true });

const RecruitmentProcess = mongoose.model('RecruitmentProcess', recruitmentProcessSchema);

module.exports = RecruitmentProcess;
