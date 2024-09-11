const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({

  employeeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Employee', 
        required: true 
    },

  leaveType: { 
    type: String, 
    enum: ['sick', 'casual', 'earned'], 
    required: true 
    },

  startDate: { 
    type: Date, 
    required: true 
    },

  endDate: { 
        type: Date, 
        required: true 
    },

  status: { 
        type: String, 
        enum: ['approved', 'pending', 'rejected'], 
        required: true 
    },

  reason: { type: String }
},{timestamps: true});

module.exports = mongoose.model('Leave', leaveSchema);
