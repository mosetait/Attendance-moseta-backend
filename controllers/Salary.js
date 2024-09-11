const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Salary = require('../models/Salary');
const Leave = require("../models/Leave");
const ExcelJS = require('exceljs');
const moment = require('moment-timezone');



exports.calculateMonthlySalaryOfAnEmployee = async (req, res) => {
    try {
        const { employeeId, startDate, endDate } = req.body;

        if (!employeeId || !startDate || !endDate) {
            return res.status(400).json({ message: 'Employee ID, start date, and end date are required.' });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const totalDays = Math.ceil((end - start + 1) / (1000 * 60 * 60 * 24));
        const perDaySalary = employee.salary / 30;

        const [attendanceRecords, leaveRecords] = await Promise.all([
            Attendance.find({ employeeId, date: { $gte: start, $lte: end } }),
            Leave.find({ employeeId, startDate: { $lte: end }, endDate: { $gte: start }, status: 'approved' })
        ]);

        let totalApprovedLeaves = 0;
        let paidLeaves = 0;
        let excessLeaves = 0;
        let halfDays = 0;
        let excessHalfDays = 0;
        let lateArrivals = 0;
        let earlyExits = 0;
        let workingDays = 0;
        let totalSalary = 0;

        const excelData = [];



        // Process attendance records
        attendanceRecords.forEach(record => {
            let daySalary = perDaySalary;

            // Half-day logic
            if (record.status === 'halfDay') {
                halfDays++;
                if (halfDays > employee.allowedHalfDays) {
                    excessHalfDays++;
                    daySalary /= 2;
                }
            }

            // Late arrival logic (check if login time is after 10:15 AM)
            const loginTime = new Date(record.loginTime);
            const lateArrival = loginTime.getUTCHours() > 10 || (loginTime.getUTCHours() === 10 && loginTime.getUTCMinutes() > 15);

            
            if (lateArrival) {
                lateArrivals++;
                if (lateArrivals > 3) {
                    halfDays++;
                    daySalary /= 2; // Mark as half-day if late arrivals exceed 3
                }
            }

            // Early exit logic
            if (record.logoutTime) {
                const logoutTime = new Date(record.logoutTime);
                if (logoutTime.getHours() < 18) {
                    earlyExits++;
                    if (earlyExits > 1) {
                        halfDays++;
                        daySalary /= 2; // Mark as half-day if early exits exceed 1
                    }
                }
            }

            if (record.status === 'fullDay') {
                workingDays++;
            }

            totalSalary += daySalary;

            // Push data for the Excel sheet with formatted login/logout time
            excelData.push({
                Date: record.date.toLocaleDateString(),
                Status: record.status,
                Salary: daySalary,
                LoginTime: record.loginTime ? new Date(record.loginTime).toISOString() : 'N/A',
                LogoutTime: record.logoutTime ? new Date(record.logoutTime).toISOString() : 'N/A',
                LateArrivals: lateArrival ? 'Yes' : '',
                EarlyExit: earlyExits > 1 ? 'Early Exit Half Day' : ''
            });
        });


        // Process leave records
        leaveRecords.forEach(leave => {
            const leaveDays = Math.ceil((leave.endDate - leave.startDate + 1) / (1000 * 60 * 60 * 24));
            for (let i = 0; i < leaveDays; i++) {
                const leaveDate = new Date(leave.startDate);
                leaveDate.setDate(leaveDate.getDate() + i);
                let leaveDaySalary = perDaySalary;
                if (totalApprovedLeaves >= employee.allowedLeaves) {
                    leaveDaySalary = 0; // Unpaid leave
                    excessLeaves++;
                } else {
                    paidLeaves++;
                }
                totalApprovedLeaves++;
                excelData.push({
                    Date: leaveDate.toLocaleDateString(),
                    Status: 'Leave',
                    Salary: leaveDaySalary,
                    LoginTime: 'N/A',
                    LogoutTime: 'N/A',
                    LateArrivals: '',
                    EarlyExit: ''
                });
                totalSalary += leaveDaySalary;
            }
        });

        // After iterating, add the total number of late arrivals and excess leaves at the end
        excelData.push({
            Date: 'Summary',
            Status: '',
            Salary: '',
            LoginTime: '',
            LogoutTime: '',
            LateArrivals: lateArrivals,
            EarlyExit: ''
        });

        // Generate Excel sheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Salary Report');

        worksheet.columns = [
            { header: 'Date', key: 'Date', width: 15 },
            { header: 'Status', key: 'Status', width: 15 },
            { header: 'Salary', key: 'Salary', width: 10 },
            { header: 'Login Time', key: 'LoginTime', width: 20 },
            { header: 'Logout Time', key: 'LogoutTime', width: 20 },
            { header: 'Late Arrivals', key: 'LateArrivals', width: 15 },
            { header: 'Early Exit', key: 'EarlyExit', width: 15 }
        ];

        // Add rows to worksheet
        excelData.forEach(row => {
            worksheet.addRow(row);
        });

        // Write the Excel file
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=SalaryReport.xlsx'
        );
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error calculating salary: ' + error.message });
    }
};

  
  
  
  








exports.calculateSalariesForAllEmployees = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start and end date are required.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);



        const totalDays = Math.ceil((end - start + 1) / (1000 * 60 * 60 * 24));
        const employees = await Employee.find({ role: 'employee' });

        const results = [];

        for (const employee of employees) {
            const attendanceRecords = await Attendance.find({
                employeeId: employee._id,
                date: { $gte: start, $lt: new Date(end.getTime() + 1) }
            });

            const leaveRecords = await Leave.find({
                employeeId: employee._id,
                startDate: { $lte: end },
                endDate: { $gte: start },
                status: 'approved'
            });

            // Total approved leaves calculation
            const totalApprovedLeaves = leaveRecords.reduce((acc, leave) => {
                const leaveStart = new Date(Math.max(start.getTime(), leave.startDate.getTime()));
                const leaveEnd = new Date(Math.min(end.getTime(), leave.endDate.getTime()));
                const leaveDays = Math.ceil((leaveEnd - leaveStart + 1) / (1000 * 60 * 60 * 24));
                return acc + leaveDays;
            }, 0);

            // Count working days and half days
            const workingDays = attendanceRecords.filter(record => record.status === 'fullDay').length;
            const halfDays = attendanceRecords.filter(record => record.status === 'halfDay').length;
            const absentDays = totalDays - workingDays - halfDays;

            // Calculate excess and paid leaves/half days
            const excessLeaves = Math.max(totalApprovedLeaves - employee.allowedLeaves, 0);
            const paidLeaves = Math.min(totalApprovedLeaves, employee.allowedLeaves);
            const excessHalfDays = Math.max(halfDays - employee.allowedHalfDays, 0);
            const paidHalfDays = Math.min(halfDays, employee.allowedHalfDays);

            const perDaySalary = employee.salary / 30;  //30 is average day in a month
            const perHalfDaySalary = perDaySalary / 2;

            // Calculate salary components
            const allowedLeaveSalary = paidLeaves * perDaySalary;
            const allowedHalfDaySalary = paidHalfDays * perDaySalary;
            const excessHalfDaySalary = excessHalfDays * perHalfDaySalary;

            // Calculate total salary
            const totalSalary = (workingDays * perDaySalary) + allowedLeaveSalary + allowedHalfDaySalary + excessHalfDaySalary;

            let salary = await Salary.findOne({ employeeId: employee._id, startDate, endDate });
            if (!salary) {
                salary = new Salary({
                    employeeId: employee._id,
                    startDate,
                    endDate,
                    totalDays,
                    workingDays,
                    absentDays,
                    halfDays,
                    deductions: 0, // No deductions for absent days or excess leaves
                    totalSalary,
                    basicSalary: employee.salary
                });
            } else {
                salary.totalDays = totalDays;
                salary.workingDays = workingDays;
                salary.absentDays = absentDays;
                salary.halfDays = halfDays;
                salary.deductions = 0; // No deductions for absent days or excess leaves
                salary.totalSalary = totalSalary;
            }

            await salary.save();

            results.push({
                employeeId: employee._id,
                name: employee.name,
                totalSalary,
                allowedLeaves: employee.allowedLeaves,
                excessLeaves,
                allowedHalfDays: employee.allowedHalfDays,
                excessHalfDays,
                absentDays,
                leaveSalary: allowedLeaveSalary,
                halfDaySalary: allowedHalfDaySalary,
                excessHalfDaySalary
            });
        }

        res.status(200).json({ message: 'Salaries calculated successfully.', salaries: results });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error calculating salaries: ' + error.message });
    }
};



