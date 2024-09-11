const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const connectDB = require('./config/database');
const connectCloudinary = require('./config/cloudinary');
const helmet = require("helmet");
const errorMiddleware = require('./middlewares/error');
const { resetEarlyExits } = require('./cronjobs/resetEarlyExits');
const path = require("path");


// Configuration
dotenv.config();


// Database connection
connectDB();





// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());



// cors
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

// express file upload
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp",
    })
);

// Cloudinary connection
connectCloudinary();


// Importing routes
const auth = require("./routes/Auth");
const employee = require("./routes/Employee");
const admin = require("./routes/Admin");

app.use("/api/v1" , auth);
app.use("/api/v1" , employee);
app.use("/api/v1" , admin);


const NODE_ENV = "production";
// Serve frontend
if (NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "./dist")));
  
    app.get("*", (req, res) =>
        res.sendFile(
            path.resolve(__dirname, "./", "dist", "index.html")
        )
    );
} else {
    app.get("/", (req, res) => res.send("Please set to production"));
}

app.use("*", (req, res, next) => {
    app.use("*", (req, res, next) => {
    throw new Error("Not found");
});
    
});



// Error middleware
app.use(errorMiddleware);


app.listen(process.env.PORT, () => {
    console.log(`Server is running on PORT: ${process.env.PORT}`);

    // Start the cron job after the server is running
    resetEarlyExits.start();
});
