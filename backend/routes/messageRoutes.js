const express = require('express');
const router = express.Router();
const {
  scheduleMessage,
  getAllMessages,
  getCpuStatus
} = require('../controllers/messageController');

// Define routes
router.post('/schedule', scheduleMessage);
router.get('/all', getAllMessages);
router.get('/cpu-status', getCpuStatus);

module.exports = router;
