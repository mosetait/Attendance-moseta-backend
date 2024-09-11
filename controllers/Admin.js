const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const asyncHandler = require("../middlewares/asyncHandler");
const Office = require("../models/Office");


exports.getAllEmployees = asyncHandler( async (req,res) => {

    const employees = await Employee.find({role: "employee"}).populate({path: "office"});

    return res.status(200).json({
        message: "Employees fetched successfully",
        employees,
        success: true
    })

});



exports.getSingleEmployee = asyncHandler( async (req,res) => {

    const employee = await Employee.findOne({_id: req.params.id}).populate({path: "office"});

    return res.status(200).json({
        message: "Employee fetched successfully",
        employee,
        success: true
    })

});




exports.getAllLeaveRequests = asyncHandler(async (req, res) => {
    const { month, year } = req.body; // Assuming month and year are passed in the request body

    // Validate input
    if (!month || !year) {
        return res.status(400).json({ message: 'Month and year are required.' });
    }

    // Parse month and year to integers
    const monthInt = parseInt(month, 10);
    const yearInt = parseInt(year, 10);

    if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
        return res.status(400).json({ message: 'Invalid month or year.' });
    }

    // Define the start and end of the month
    const startDate = new Date(yearInt, monthInt - 1, 1); // First day of the month
    const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59, 999); // Last day of the month

    const leaveRequests = await Leave.find({
        startDate: {
            $gte: startDate
        },
        endDate: {
            $lte: endDate
        }
    }).populate({path: "employeeId"});


    return res.status(200).json({
        message: 'Leave requests fetched successfully.',
        leaveRequests
    });
});




