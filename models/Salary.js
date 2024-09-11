const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  employeeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Employee', 
        required: true 
    },

  month: { 
        type: String, 
        // required: true 
    }, // E.g., 'September 2024'

  totalDays: { 
        type: Number, 
        required: true 
    },

  workingDays: { 
    type: Number, 
    required: true 
    },

  absentDays: { 
        type: Number, 
        required: true 
    },

  halfDays: { 
        type: Number, 
        required: true 
    },

  deductions: { 
        type: Number, 
        default: 0 
    },

  basicSalary: { 
        type: Number, 
        required: true 
    },

  totalSalary: { 
    type: Number, 
    required: true 
    }
},{timestamps: true});

module.exports = mongoose.model('Salary', salarySchema);
