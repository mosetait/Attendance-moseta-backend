const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee'); // Assuming Employee model is using the same schema as User
const { uploadImageToCloudinary } = require('../utils/imageUploader'); // Import the Cloudinary upload function
const asyncHandler = require("../middlewares/asyncHandler");









// Mark login time
exports.markLogin = asyncHandler(async (req, res) => {
  const { employeeId, loginLocation } = req.body;
  const loginTime = new Date();  // Captures current UTC time
  let loginImage = null;

  // Handle image upload to Cloudinary
  if (req.files && req.files.file) {
    const file = req.files.file;
    const uploadedImage = await uploadImageToCloudinary(file, 'employee_logins');
    loginImage = {
      publicId: uploadedImage.public_id,
      secureUrl: uploadedImage.secure_url,
    };
  }

  // Find the employee by ID
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  // Check if login time is after 10:15 AM (in UTC)
  const lateThreshold = new Date();
  lateThreshold.setUTCHours(10, 15, 0, 0);  // Setting the threshold to 10:15 AM UTC

  let isLate = false;
  if (loginTime > lateThreshold) {
    isLate = true;
    employee.lateArrivals += 1;  // Increment lateArrivals
    await employee.save();       // Save the updated employee record
  }

  // Set "today's" date in UTC, without time part
  const todayUTC = new Date(Date.UTC(loginTime.getUTCFullYear(), loginTime.getUTCMonth(), loginTime.getUTCDate()));

  // Check if an attendance record already exists for today
  const existingAttendance = await Attendance.findOne({ employeeId, date: todayUTC });

  if (existingAttendance) {
    return res.status(400).json({ message: 'Login already marked for today' });
  }

  // Create a new attendance record
  const attendance = new Attendance({
    employeeId,
    date: todayUTC,  // Set the date correctly in UTC
    loginTime,
    loginLocation,
    loginImage,
    status: 'halfDay',  // Default status to 'fullDay', can be adjusted based on business rules
    workingHours: 0,
    workingMinutes: 0,
    workingSeconds: 0,
  });

  await attendance.save();

  res.status(200).json({
    message: `Login marked successfully${isLate ? ' (Late Arrival)' : ''}`,
    attendance,
  });
});





  




// Mark logout time
exports.markLogout = asyncHandler(async (req, res) => {

  const { employeeId, logoutLocation } = req.body;
  const logoutTime = new Date();  // Capture current UTC time
  let logoutImage = null;

  // Handle image upload to Cloudinary
  if (req.files && req.files.file) {
    const file = req.files.file;
    const uploadedImage = await uploadImageToCloudinary(file, 'logout_images');
    logoutImage = {
      publicId: uploadedImage.public_id,
      secureUrl: uploadedImage.secure_url,
    };
  }

  // Set "today's" date in UTC (without time)
  const todayUTC = new Date(Date.UTC(logoutTime.getUTCFullYear(), logoutTime.getUTCMonth(), logoutTime.getUTCDate()));

  // Find the attendance record for today
  const attendance = await Attendance.findOne({ employeeId, date: todayUTC });

  if (!attendance) {
    return res.status(404).json({ message: 'Login record not found for today' });
  }

  // Check if logout has already been marked
  if (attendance.logoutTime) {
    return res.status(400).json({ message: 'Logout already marked for today' });
  }

  // Calculate working time in milliseconds
  const loginTime = new Date(attendance.loginTime);  // loginTime is already in UTC
  const workingMilliseconds = logoutTime - loginTime;
  const workingHours = Math.floor(workingMilliseconds / (1000 * 60 * 60));
  const workingMinutes = Math.floor((workingMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const workingSeconds = Math.floor((workingMilliseconds % (1000 * 60)) / 1000);

  // Set default status to fullDay, but check conditions to mark halfDay
  let status = 'fullDay';

  // 1. Check if working hours are less than 8
  if (workingHours < 8) {
    status = 'halfDay';
  }

  // 2. Check if logout time is before 4 PM (using UTC)
  const logoutThreshold = new Date();
  logoutThreshold.setUTCHours(16, 0, 0, 0);  // 4 PM UTC
  if (logoutTime < logoutThreshold) {
    status = 'halfDay';
  }

  // 3. Check for early exit (between 4 PM and 6:30 PM UTC)
  const earlyExitStart = new Date();
  earlyExitStart.setUTCHours(16, 0, 0, 0);  // 4 PM UTC
  const earlyExitEnd = new Date();
  earlyExitEnd.setUTCHours(18, 30, 0, 0);   // 6:30 PM UTC
  let isEarlyExit = false;

  const employee = await Employee.findById(employeeId);

  if (logoutTime >= earlyExitStart && logoutTime <= earlyExitEnd) {
    // First early exit is allowed without marking half-day
    if (employee.earlyExits === 0) {
      isEarlyExit = true;
    } else {
      // After the first early exit, mark it as halfDay
      status = 'halfDay';
    }

    // Increase early exits count
    employee.earlyExits += 1;
    await employee.save();
  }

  // 4. Check if the employee has already taken an early exit today
  if (employee.earlyExits > 1) {
    status = 'halfDay';
  }

  // Update attendance record with logout details
  attendance.logoutTime = logoutTime;
  attendance.logoutLocation = logoutLocation;
  attendance.logoutImage = logoutImage;
  attendance.workingHours = workingHours;
  attendance.workingMinutes = workingMinutes;
  attendance.workingSeconds = workingSeconds;
  attendance.status = status;

  await attendance.save();

  res.status(200).json({
    message: `Logout marked successfully. Status updated to ${status}${isEarlyExit ? ' (Early Exit)' : ''}.`,
    attendance
  });
});






  

// Get attendance records for a specific employee
exports.getAttendanceRecords = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Find all attendance records for the employee
    const records = await Attendance.find({ employeeId }).sort({ date: -1 });

    res.status(200).json({ records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// Get monthly attendance records for a specific employee
exports.getMonthlyAttendanceRecords = async (req, res) => {
  try {
    const { employeeId, month, year } = req.params;


    // Validate month and year
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required.' });
    }

    // Parse month and year as integers
    const monthInt = parseInt(month, 10);
    const yearInt = parseInt(year, 10);

    // Validate month and year values
    if (monthInt < 1 || monthInt > 12 || isNaN(monthInt) || isNaN(yearInt)) {
      return res.status(400).json({ message: 'Invalid month or year.' });
    }

    // Define the start and end dates for the month
    const startDate = new Date(yearInt, monthInt - 1, 1); // Start of the month
    const endDate = new Date(yearInt, monthInt, 0); // End of the month

    // Find all attendance records for the employee within the specified month and year
    const records = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    res.status(200).json({ records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};






