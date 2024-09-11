const cron = require('node-cron');
const Employee = require('../models/Employee');

// Schedule job to reset early exits on the first day of each month
const resetEarlyExits = cron.schedule('0 0 1 * *', async () => {
  try {
    await Employee.updateMany({}, { earlyExits: 0 });
    console.log('Early exits reset for all employees.');
  } catch (error) {
    console.error('Error resetting early exits:', error.message);
  }
});

// Export the cron job
module.exports = { resetEarlyExits };
