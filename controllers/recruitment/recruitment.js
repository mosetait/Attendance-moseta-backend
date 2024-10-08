const RecruitmentProcess = require('../../models/Recruitment/RecruitmentModal');
const Candidate = require('../../models/Recruitment/CandidateModal');


// Create a new recruitment process
exports.createRecruitmentProcess = async (req, res) => {
  try {
    const { department, jobTitle } = req.body;
    const newProcess = new RecruitmentProcess({ department, jobTitle });
    await newProcess.save();
    const processes = await RecruitmentProcess.find().populate('candidates'); // Populates with candidate details
    res.status(201).json({ message: 'Recruitment process created successfully', process: newProcess , processes});
  } catch (err) {
    res.status(500).json({ message: 'Error creating recruitment process', error: err.message });
  }
};


// Get all recruitment processes
exports.getAllRecruitmentProcesses = async (req, res) => {
  try {
    const processes = await RecruitmentProcess.find().populate('candidates'); // Populates with candidate details
    res.status(200).json(processes);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching recruitment processes', error: err.message });
  }
};


// Get a specific recruitment process with candidates
exports.getRecruitmentProcessById = async (req, res) => {
  try {
    const { id } = req.params;
    const process = await RecruitmentProcess.findById(id).populate('candidates');
    if (!process) return res.status(404).json({ message: 'Recruitment process not found' });
    res.status(200).json(process);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching recruitment process', error: err.message });
  }
};







// Add a candidate to a recruitment process
exports.addCandidate = async (req, res) => {
  try {
    const { name, email, phone, resumeUrl, processId } = req.body;
    
    // Check if the recruitment process exists
    const process = await RecruitmentProcess.findById(processId).populate('candidates');
    if (!process) return res.status(404).json({ message: 'Recruitment process not found' });
    
    // Create a new candidate
    const candidate = new Candidate({ name, email, phone, resumeUrl, process: processId });
    await candidate.save();
    
    // Add candidate to the recruitment process
    process.candidates.push(candidate._id);
    await process.save();

    const process2 = await RecruitmentProcess.findById(processId).populate('candidates');


    res.status(201).json({ message: 'Candidate added successfully', candidate , process: process2 });
  } catch (err) {
    res.status(500).json({ message: 'Error adding candidate', error: err.message });
  }
};


// Update candidate stage (move to next stage or reject)
exports.updateCandidateStage = async (req, res) => {
  try {
    const { candidateId, newStage, rejectionReason , processId } = req.body;
    
    // Find the candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    // If rejecting the candidate
    if (newStage === 'Rejected') {
      candidate.currentStage = 'Rejected';
      candidate.isRejected = true;
      candidate.rejectionReason = rejectionReason || 'Not provided';
    } else {
      // Update to the new stage
      candidate.currentStage = newStage;
    }

    await candidate.save();

    const process = await RecruitmentProcess.findById(processId).populate('candidates');

    res.status(200).json({ message: 'Candidate stage updated successfully', candidate , process });
  } catch (err) {
    res.status(500).json({ message: 'Error updating candidate stage', error: err.message });
  }
};



// Get details of a specific candidate
exports.getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findById(id).populate('process');
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.status(200).json(candidate);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching candidate details', error: err.message });
  }
};













const path = require('path');
const pdf = require('html-pdf'); // Use puppeteer if needed
const fs = require('fs');
const mailSender = require('../../utils/mailSender'); // Update with the correct path

exports.sendPdfEmail = async (req, res) => {
  try {

    let htmlFilePath;


    if(req.body.company === "Exalta"){
      htmlFilePath = path.join(__dirname, './Appointment Letter', 'exaltaAppointmentLetter.html'); // Path to your HTML file
    }
    if(req.body.company === "Moseta"){
      htmlFilePath = path.join(__dirname, './Appointment Letter', 'mosetaAppointmentLetter.html'); // Path to your HTML file
    }


    // Convert HTML to PDF
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');

    // Get dynamic data from request body or another source
    const recipientName = req.body.recipientName;
    const joiningDate = req.body.joiningDate ;
    const salary = req.body.salary ;
    const address = req.body.address;
    const cityAndState = req.body.cityAndState;
    const pincode = req.body.pincode;

    const designation = req.body.designation;
    const date = req.body.date;
    const department = req.body.department;


    // Replace placeholders in HTML with actual data
    htmlContent = htmlContent
      .replace(/{{recipient_name}}/g, recipientName)
      .replace(/{{joining_date}}/g, joiningDate)
      .replace(/{{salary}}/g, salary)
      .replace(/{{address}}/g, address)
      .replace(/{{cityAndState}}/g, cityAndState)
      .replace(/{{pincode}}/g, pincode)
      .replace(/{{designation}}/g, designation)
      .replace(/{{date}}/g, date)
      .replace(/{{department}}/g, department);

    const pdfFilePath = path.join(__dirname, '../pdfs', 'appointment_letter.pdf'); // Path where the PDF will be saved

    pdf.create(htmlContent).toFile(pdfFilePath, async (err, result) => {
      if (err) {
        console.error('Error creating PDF:', err);
        return res.status(500).send('Failed to create PDF');
      }

      // Now send the PDF via email using your mailSender function
      const email = req.body.email; // Replace with the recipient's email
      const title = 'Appointment Letter';
      const body = '<p>Please find the attached PDF.</p>'; // You can customize this HTML content

      // Read the PDF file as a buffer
      const pdfBuffer = fs.readFileSync(pdfFilePath);

      // Create a body for the email with the PDF attachment
      const attachment = {
        filename: 'output.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf', // Optional: Specify the content type
      };

      // Call the mailSender function and pass the attachment
      const mailInfo = await mailSender(email, title, body, attachment);

      if (mailInfo) {
        res.status(200).send('PDF sent successfully to the email');
      } else {
        res.status(500).send('Failed to send email');
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred');
  }
};











