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












