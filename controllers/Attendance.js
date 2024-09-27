const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee'); // Assuming Employee model is using the same schema as User
const { uploadImageToCloudinary } = require('../utils/imageUploader'); // Import the Cloudinary upload function




// Minimum time threshold in minutes for half-day status
const MINIMUM_TIME_THRESHOLD = 30; // e.g., 30 minutes
// Allowed early exit time before official end time in minutes
const EARLY_EXIT_ALLOWED_MINUTES = 120; // 2 hours





// Mark login time
exports.markLogin = async (req, res) => {
  try {
    const { employeeId, loginTime, loginLocation, lateReason } = req.body;
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const currentTime = new Date(loginTime || new Date().toISOString());
    const lateThreshold = new Date(); // Threshold for late login (10:15 AM)
    lateThreshold.setHours(10, 15, 0, 0);

    // Find the employee
    const employee = await Employee.findById(employeeId);

    // Find today's attendance record for the employee
    let attendance = await Attendance.findOne({ employeeId, date: today });

    // Check if the login time is after the late threshold
    const isLate = currentTime > lateThreshold;

    // If the employee is late, check their late arrivals count for the month
    if (isLate) {
      const startOfMonth = new Date(currentTime.getFullYear(), currentTime.getMonth(), 1);
      const lateCount = await Attendance.countDocuments({
        employeeId,
        loginTime: { $gte: startOfMonth, $lt: currentTime },
        lateReason: { $exists: true }
      });

      // If late arrivals exceed the limit (3), mark the day as halfDay
      if (lateCount >= 3) {
        return res.status(400).json({
          success: false,
          message: 'You have exceeded the maximum allowed late arrivals for this month. Today will be marked as half day.'
        });
      }

      // Increment the late arrival count on the Employee model
      employee.lateArrivals += 1;
      await employee.save();
    }

    // Upload the image to Cloudinary
    if (req.file) { // Assuming image is uploaded as `file` field
      const uploadedImage = await uploadImageToCloudinary(req.file, 'employee_logins');
      
      const imageDetails = {
        publicId: uploadedImage.public_id,
        secureUrl: uploadedImage.secure_url
      };

      // If attendance exists, update it
      if (attendance) {
        if (attendance.loginTime) {
          return res.status(400).json({
            success: false,
            message: 'Login time already marked for today.'
          });
        }
        // Update existing attendance record
        attendance.loginTime = loginTime || new Date().toISOString();
        attendance.loginLocation = loginLocation;
        attendance.picture = imageDetails;
        if (isLate) {
          attendance.lateReason = lateReason;
        }
      } else {
        // Create a new attendance record with image details
        attendance = new Attendance({
          employeeId,
          date: today,
          loginTime: loginTime || new Date().toISOString(),
          loginLocation,
          status: 'halfDay', // Default status until logout is marked
          picture: imageDetails,
          lateReason: isLate ? lateReason : undefined
        });
      }

      await attendance.save();
      res.status(201).json({ message: 'Login time and image marked successfully.', attendance });

    } else {
      res.status(400).json({ message: 'No image file provided.' });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};




  




// Mark logout time
exports.markLogout = async (req, res) => {
  try {
    const { employeeId, logoutTime, logoutLocation } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date(logoutTime || new Date().toISOString());

    // Find today's attendance record
    let attendance = await Attendance.findOne({ employeeId, date: today });

    if (!attendance || !attendance.loginTime) {
      return res.status(400).json({ message: 'No login record found for today.' });
    }

    if (attendance.logoutTime) {
      return res.status(400).json({ message: 'Logout time already marked for today.' });
    }

    // Convert times to Date objects for calculations
    const loginTime = new Date(attendance.loginTime);
    const logoutTimeDate = new Date(logoutTime || currentTime);

    // Calculate the duration between login and logout
    const durationInMilliseconds = logoutTimeDate - loginTime;
    const durationInSeconds = Math.floor(durationInMilliseconds / 1000);
    const durationInMinutes = Math.floor(durationInSeconds / 60);
    const durationInHours = Math.floor(durationInMinutes / 60);

    const seconds = durationInSeconds % 60;
    const minutes = durationInMinutes % 60;
    const hours = durationInHours;

    // Update attendance record with logout time, duration, and working hours
    attendance.logoutTime = logoutTime || currentTime;
    attendance.logoutLocation = logoutLocation;
    attendance.workingHours = hours;
    attendance.workingMinutes = minutes;
    attendance.workingSeconds = seconds;

    const employee = await Employee.findById(employeeId);
    const earlyExitThreshold = new Date();
    earlyExitThreshold.setHours(18, 30, 0, 0); // Define the allowed exit time (e.g., 6:30 PM)

    const isEarlyExit = logoutTimeDate < earlyExitThreshold;

    if (isEarlyExit) {
      const startOfMonth = new Date(logoutTimeDate.getFullYear(), logoutTimeDate.getMonth(), 1);
      const earlyExitCount = await Attendance.countDocuments({
        employeeId,
        logoutTime: { $gte: startOfMonth, $lt: currentTime },
        status: 'halfDay'
      });

      // Check if the employee exceeded the allowed early exits (1 allowed per month)
      if (earlyExitCount >= 1) {
        return res.status(400).json({ 
          success: false,
          message: 'You have exceeded the maximum allowed early exits for this month. Today will be marked as half day.'
        });
      }

      // Increment the early exit count on the Employee model
      employee.earlyExits += 1;
      await employee.save();
    }

    // Determine status based on working hours, early exit, or other criteria
    if (durationInMinutes < MINIMUM_TIME_THRESHOLD) {
      attendance.status = 'halfDay';
    } else if (isEarlyExit) {
      attendance.status = 'halfDay';
    } else if (hours < 8) {
      // Check if total working hours are less than 8 hours
      attendance.status = 'halfDay';
    } else {
      attendance.status = 'fullDay';
    }

    await attendance.save();
    res.status(201).json({ message: 'Logout time marked successfully.', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};






  

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






