const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



// Middleware to protect routes
exports.isAuthenticated = async (req, res, next) => {
    try {
      const token = req.cookies.token;
  
      if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.employee = await Employee.findById(decoded.employeeId).select('-password');
  
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  
};




// isAdmin
exports.isAdmin = async (req, res, next) => {
	try {

        if(req.employee.role !== "admin"){
            return res.status(401).json({
                message: "This is a protected route for admin.",
                success: false
            })
        }

		next();

	} catch (error) {
        console.log(error)
		return res.status(500).json({ 
            success: false, 
            message: `User Role Can't be Verified` 
        });
	}
};




// isEmployee
exports.isEmployee = async (req, res, next) => {
	try {

        if(req.employee.role !== "employee"){
            return res.status(401).json({
                message: "This is a protected route for employee.",
                success: false
            })
        }

		next();

	} catch (error) {
        console.log(error)
		return res.status(500).json({ 
            success: false, 
            message: `User Role Can't be Verified` 
        });
	}
};