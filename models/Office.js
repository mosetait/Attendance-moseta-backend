const mongoose = require('mongoose');

const officeSchema = new mongoose.Schema({

    location: {
        type: String,
        required: true,
        unique: true
    },

    address: {
        type: String,
        required: true
    },

    employees:{
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Employee"
    }



},{timestamps: true});

module.exports = mongoose.model('Office', officeSchema);
