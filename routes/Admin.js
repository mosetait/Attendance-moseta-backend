const express =  require("express");
const { isAuthenticated, isAdmin } = require("../middlewares/auth");
const { calculateMonthlySalaryOfAnEmployee, calculateSalariesForAllEmployees } = require("../controllers/Salary");
const { updateLeaveStatus } = require("../controllers/Leave");
const { createOffice, getAllOffices, getOfficeById, updateOffice, deleteOffice } = require("../controllers/Office");
const { getAllEmployees, getAllLeaveRequests, getSingleEmployee } = require("../controllers/Admin");
const { getAttendanceBetweenDates } = require("../controllers/Attendance");
const { createRecruitmentProcess, getAllRecruitmentProcesses, getRecruitmentProcessById, addCandidate, updateCandidateStage, getCandidateById, sendPdfEmail } = require("../controllers/recruitment/recruitment");
const router = express.Router();


// calculate salary 
router.route("/calculate-salary-of-an-employee").post(isAuthenticated , isAdmin, calculateMonthlySalaryOfAnEmployee);
router.route("/calculate-salary-of-all-employees").post(isAuthenticated , isAdmin, calculateSalariesForAllEmployees);

// update leave status
router.route("/update-leave-status/:leaveId").put(isAuthenticated, isAdmin, updateLeaveStatus);



router.route("/create-office").post(isAuthenticated, isAdmin, createOffice);

router.route("/get-all-offices").get(isAuthenticated, isAdmin, getAllOffices);

router.route("/get-single-office/:id").get(isAuthenticated, isAdmin, getOfficeById);

router.route("/update-office/:id").put(isAuthenticated, isAdmin, updateOffice);

router.route("/delete-office/:id").delete(isAuthenticated, isAdmin, deleteOffice);



router.route("/get-all-employees").get(isAuthenticated , isAdmin , getAllEmployees);
router.route("/get-single-employee/:id").get(isAuthenticated , isAdmin , getSingleEmployee);
router.route("/get-all-offices").get(isAuthenticated , isAdmin , getAllOffices);
router.route("/get-all-leaves-requests").post(isAuthenticated , isAdmin , getAllLeaveRequests);






// Recruitment Process routes
router.post('/recruitment/create',isAuthenticated, isAdmin, createRecruitmentProcess);
router.get('/recruitment',isAuthenticated, isAdmin, getAllRecruitmentProcesses);
router.get('/recruitment/:id',isAuthenticated, isAdmin, getRecruitmentProcessById);

// Candidate routes
router.post('/candidate/add',isAuthenticated, isAdmin, addCandidate);
router.put('/candidate/update-stage',isAuthenticated, isAdmin, updateCandidateStage);
router.get('/candidate/:id',isAuthenticated, isAdmin, getCandidateById);


router.post('/send_offer_letter',isAuthenticated, isAdmin, sendPdfEmail);



module.exports = router;