const mongoose = require('mongoose');

const halfDaySchema = new mongoose.Schema({

  employeeId: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'Employee', 
        required: true 
    },

  date: { 
        type: Date, 
        required: true 
    },

  halfDayType: { 
        type: String, 
        enum: ['AM', 'PM'], 
        required: true 
    },

  status: { 
    type: String, 
    enum: ['approved', 'pending', 'rejected'], 
    required: true 
    }

},{timestamps: true});

module.exports = mongoose.model('HalfDay', halfDaySchema);
