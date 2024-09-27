const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  loginTime: { 
    type: Date, 
    required: true 
  },
  logoutTime: { 
    type: Date 
  },
  loginLocation: { 
    type: String 
  },
  logoutLocation: { 
    type: String 
  },

  picture:{

    publicId: {
      type: String,
      required: true
    },

    secureUrl: {
      type: String,
      required: true
    }
    
  },

  status: { 
    type: String, 
    enum: ['fullDay', 'halfDay', 'absent'], 
    required: true 
  },

  workingHours: { 
    type: Number, // Total working hours
  },

  workingMinutes: { 
    type: Number, // Total working minutes
  },

  workingSeconds: { 
    type: Number, // Total working seconds
  }

}, {timestamps: true});

module.exports = mongoose.model('Attendance', attendanceSchema);
