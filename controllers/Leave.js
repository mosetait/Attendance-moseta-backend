const Leave = require('../models/Leave');
const Employee = require('../models/Employee'); // Assuming Employee model is using the same schema as User





// Apply for leave
exports.applyLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    // Convert ISO date strings to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if date conversion was successful
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format.' });
    }

    // Check if leave application dates are in the past
    const today = new Date();
    if (start < today || end < today) {
      return res.status(400).json({ message: 'Leave application cannot be for past dates.' });
    }

    // Check for existing leave applications overlapping with the requested dates
    const existingLeave = await Leave.findOne({
      employeeId,
      $or: [
        { 
          $and: [
            { startDate: { $lte: end } },
            { endDate: { $gte: start } }
          ]
        }
      ]
    });

    if (existingLeave) {
      return res.status(400).json({ message: 'Leave request already exists for the specified dates.' });
    }

    // Create new leave application
    const leave = new Leave({
      employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      status: 'pending'
    });

    await leave.save();
    res.status(201).json({ message: 'Leave application submitted successfully.', leave });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};






// Get all leave applications for the logged-in employee
exports.getAllLeaves = async (req, res) => {
  try {
    const employeeId = req.employee.id; // Assuming employee ID is available in req.employee (from authentication middleware)
    const leaveApplications = await Leave.find({ employeeId }).sort({ startDate: -1 });

    res.status(200).json(leaveApplications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// Get a specific leave application
exports.getLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({ message: 'Leave application not found.' });
    }

    res.status(200).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};







// Update leave status (admin only)
exports.updateLeaveStatus = async (req, res) => {

  try {

    const { leaveId } = req.params;
    const { status } = req.body;

    // Validate the status
    const validStatuses = ['approved', 'pending', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    // Find the leave application
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: 'Leave application not found.' });
    }

    // Update the leave status
    leave.status = status;
    await leave.save();

    const leaveRequests = await Leave.find().populate({path: "employeeId"});

    res.status(200).json({ message: 'Leave status updated successfully.', leave , leaveRequests});
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};
