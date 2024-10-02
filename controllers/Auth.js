const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require("../middlewares/asyncHandler");


// Register an employee
exports.registerEmployee = async (req, res) => {
  try {
    const { name, email, password, role, salary , office ,allowedLeaves,allowedHalfDays , contactNumber , department} = req.body.employeeData;

    // Check if the employee already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee already exists' });
    }


    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new employee
    const newEmployee = new Employee({
      name,
      email,
      password: hashedPassword,
      role,
      salary,
      office,
      allowedLeaves,allowedHalfDays , contactNumber , department
    });

    await newEmployee.save();

    res.status(201).json({ message: 'Employee registered successfully', employee: newEmployee });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};




// Login an employee
exports.loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if employee exists
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { employeeId: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: '72h' }
    );

    res.cookie('token', token, { httpOnly: true });
    res.status(200).json({ message: 'Login successful', token , employee});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// Logout an employee
exports.logoutEmployee = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
};




// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Check if employee exists
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    employee.password = hashedPassword;
    await employee.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};






// Load User Controller
exports.loadUser = async (req, res) => {
    
  try {

    const { _id } = req.employee; // Assuming the user ID is stored in the token payload

      const employee = await Employee.findById({_id}).select('-password'); 


    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee not found`,
      });
    }

    res.status(200).json({
      success: true,
      employee,
    });
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error getting user information',
    });
  }

};





// Update employee controller
exports.updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params; // Employee ID from URL
  const {
    name,
    email,
    salary,
    contactNumber,
    department,
    office,   // Office ID from the request body
    password, // Optional: Update password if provided
  } = req.body.updatedEmployee;

  // Validate input fields (you can expand validation as needed)
  if (!name || !email || !salary || !office) {
    return res.status(400).json({ message: 'Name, email, salary, and office are required.' });
  }

  // Check if the employee exists
  const employee = await Employee.findById(id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found.' });
  }

  // Update employee details
  employee.name = name || employee.name;
  employee.email = email || employee.email;
  employee.salary = salary || employee.salary;
  employee.contactNumber = contactNumber || employee.contactNumber;
  employee.department = department || employee.department;
  employee.office = office || employee.office;

  // If password is provided, update it
  if (password) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

    employee.password = hashedPassword;
  }

  // Save the updated employee
  const updatedEmployee = await employee.save();

  const employees = await Employee.find({role: "employee"}).populate({path: "office"});


  res.status(200).json({
    message: 'Employee updated successfully',
    employee: updatedEmployee,
    employees
  });
});






// Delete employee controller
exports.deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params; // Employee ID from URL

  // Check if the employee exists
  const employee = await Employee.findById(id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found.' });
  }

  // Delete the employee
  await employee.deleteOne();

  const employees = await Employee.find({role: "employee"}).populate({path: "office"});


  res.status(200).json({
    message: 'Employee deleted successfully',
    employeeId: id,
    employees
  });
});
