const Office = require('../models/Office'); // Adjust the path as needed



// Create a new office
exports.createOffice = async (req, res) => {
    try {
        const office = new Office(req.body.officeData);
        await office.save();
        res.status(201).json({ message: 'Office created successfully', office });
    } catch (error) {
        res.status(500).json({ message: 'Error creating office', error: error.message });
    }
};

// Get all offices
exports.getAllOffices = async (req, res) => {
    try {
        const offices = await Office.find().populate('employees');
        res.status(200).json({ offices });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving offices', error: error.message });
    }
};

// Get a specific office by ID
exports.getOfficeById = async (req, res) => {
    try {
        const office = await Office.findById(req.params.id).populate('employees');
        if (!office) {
            return res.status(404).json({ message: 'Office not found' });
        }
        res.status(200).json({ office });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving office', error: error.message });
    }
};

// Update an office by ID
exports.updateOffice = async (req, res) => {
    try {
        const office = await Office.findByIdAndUpdate(req.params.id, req.body.editedOfficeData, { new: true, runValidators: true });
        if (!office) {
            return res.status(404).json({ message: 'Office not found' });
        }

        const offices = await Office.find().populate('employees');
        
        res.status(200).json({ message: 'Office updated successfully', office ,offices });
    } catch (error) {
        res.status(500).json({ message: 'Error updating office', error: error.message });
    }
};

// Delete an office by ID
exports.deleteOffice = async (req, res) => {
    try {
        const office = await Office.findByIdAndDelete(req.params.id);
        if (!office) {
            return res.status(404).json({ message: 'Office not found' });
        }
        res.status(200).json({ message: 'Office deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting office', error: error.message });
    }
};
