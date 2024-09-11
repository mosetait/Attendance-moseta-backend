const express = require("express");
const { registerEmployee, loginEmployee, logoutEmployee, resetPassword, loadUser, updateEmployee, deleteEmployee } = require("../controllers/Auth");
const { isAuthenticated, isAdmin } = require("../middlewares/auth");
const router = express.Router();


router.route("/signup-employee").post(isAuthenticated , isAdmin , registerEmployee);
router.route("/update-employee/:id").put(isAuthenticated , isAdmin , updateEmployee);
router.route("/delete-employee/:id").get(isAuthenticated , isAdmin , deleteEmployee);
router.route("/reset-password").put(isAuthenticated , isAdmin ,resetPassword);
router.route("/login").post(loginEmployee);
router.route("/logout").post(logoutEmployee);
router.route("/load-user").get(isAuthenticated , loadUser);



module.exports = router ;