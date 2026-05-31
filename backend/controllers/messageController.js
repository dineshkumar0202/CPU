const cron = require('node-cron');
const Message = require('../models/Message');
const ScheduledJob = require('../models/ScheduledJob');
const { getCurrentCpuUsage } = require('../utils/cpuMonitor');

const WEEKDAYS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};

// Helper function to schedule a node-cron job for a message
const scheduleCronJob = (jobObj) => {
  const { _id, message, day, time } = jobObj;
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  let cronExpression;

  // Specific Date format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    const [yearStr, monthStr, dayStr] = day.split('-');
    const dateNum = parseInt(dayStr, 10);
    const monthNum = parseInt(monthStr, 10);
    cronExpression = `${minute} ${hour} ${dateNum} ${monthNum} *`;
  } else {
    // Weekday name format
    const dayName = day.trim().toLowerCase();
    const dayNumber = WEEKDAYS[dayName];
    if (dayNumber === undefined) {
      console.error(`Invalid day name: ${day} for job ID: ${_id}`);
      return;
    }
    cronExpression = `${minute} ${hour} * * ${dayNumber}`;
  }

  console.log(`Scheduling job for message "${message}" (ID: ${_id}) with expression: "${cronExpression}"`);

  const task = cron.schedule(cronExpression, async () => {
    try {
      // If it is a specific calendar date, check if the current year matches the scheduled year
      if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
        const [yearStr] = day.split('-');
        const scheduledYear = parseInt(yearStr, 10);
        
        // Get current year in Kolkata timezone
        const currentYearStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' });
        const currentYear = parseInt(currentYearStr, 10);

        if (currentYear !== scheduledYear) {
          console.log(`Cron job for "${message}" triggered, but year ${currentYear} does not match scheduled year ${scheduledYear}. Skipping execution.`);
          return; // Wait for the correct year
        }

        // Save the message into MongoDB at exactly this time!
        await Message.create({ message, day, time });
        console.log(`✅ Message saved (delivered) on scheduled date: "${message}"`);

        // Remove the job from ScheduledJob collection
        await ScheduledJob.findByIdAndDelete(_id);
        console.log(`🗑️ Removed scheduled job configuration for ID: ${_id}`);

        // Stop/destroy the cron job
        task.stop();
      } else {
        // Recurring weekly weekday
        // Save the message into MongoDB at exactly this time!
        await Message.create({ message, day, time });
        console.log(`✅ Recurring message saved (delivered): "${message}"`);
        // We do NOT delete the job from ScheduledJob or stop the task since it recurrs weekly
      }
    } catch (err) {
      console.error(`Error executing scheduled job ${_id}:`, err);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
};

// @desc    Schedule a message
// @route   POST /api/message/schedule
// @access  Public
const scheduleMessage = async (req, res) => {
  try {
    const { message, day, time } = req.body;

    // Validate inputs
    if (!message || !day || !time) {
      return res.status(400).json({
        success: false,
        message: 'Please provide message, day, and time'
      });
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({
        success: false,
        message: 'Time must be in HH:MM format (24-hour)'
      });
    }

    // Validate day format & check past dates
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      const scheduledDate = new Date(`${day}T${time}:00+05:30`);
      const now = new Date();
      if (scheduledDate < now) {
        return res.status(400).json({
          success: false,
          message: 'Cannot schedule a message in the past'
        });
      }
    } else {
      const dayName = day.trim().toLowerCase();
      if (WEEKDAYS[dayName] === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Day must be a valid weekday name (e.g. Monday) or date (YYYY-MM-DD)'
        });
      }
    }

    // Save to Database (ScheduledJob)
    const savedJob = await ScheduledJob.create({
      message,
      day,
      time
    });

    // Schedule the task
    scheduleCronJob(savedJob);

    return res.status(201).json({
      success: true,
      message: 'Message scheduled successfully',
      data: {
        _id: savedJob._id,
        message: savedJob.message,
        day: savedJob.day,
        time: savedJob.time,
        status: 'pending',
        createdAt: savedJob.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during scheduling',
      error: error.message
    });
  }
};

// @desc    Get all scheduled and sent messages
// @route   GET /api/message/all
// @access  Public
const getAllMessages = async (req, res) => {
  try {
    // 1. Fetch all scheduled pending jobs
    const pendingJobs = await ScheduledJob.find({});
    const mappedPending = pendingJobs.map(job => ({
      _id: job._id,
      message: job.message,
      day: job.day,
      time: job.time,
      status: 'pending',
      createdAt: job.createdAt
    }));

    // 2. Fetch all delivered messages
    const sentMessages = await Message.find({});
    const mappedSent = sentMessages.map(msg => ({
      _id: msg._id,
      message: msg.message,
      day: msg.day,
      time: msg.time,
      status: 'sent',
      createdAt: msg.createdAt
    }));

    // 3. Combine and sort by createdAt descending (most recent first)
    const combined = [...mappedPending, ...mappedSent].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      count: combined.length,
      data: combined
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving messages',
      error: error.message
    });
  }
};

// @desc    Get current CPU utilization status
// @route   GET /api/message/cpu-status
// @access  Public
const getCpuStatus = async (req, res) => {
  try {
    const usage = getCurrentCpuUsage();
    const threshold = parseInt(process.env.CPU_THRESHOLD, 10) || 70;
    return res.status(200).json({
      success: true,
      data: { usage, threshold }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch CPU status',
      error: error.message
    });
  }
};

// Reschedule all pending messages on startup
const reschedulePendingMessages = async () => {
  try {
    const pendingJobs = await ScheduledJob.find({});
    console.log(`Found ${pendingJobs.length} scheduled jobs to restore...`);

    const now = new Date();

    for (const job of pendingJobs) {
      // Check if it's a specific date and if it has already passed
      if (/^\d{4}-\d{2}-\d{2}$/.test(job.day)) {
        const scheduledDate = new Date(`${job.day}T${job.time}:00+05:30`);
        if (scheduledDate < now) {
          // If the date has passed while server was offline, mark it as delivered/saved
          console.log(`Scheduled job "${job.message}" (ID: ${job._id}) time passed while offline. Saving as delivered.`);
          await Message.create({
            message: job.message,
            day: job.day,
            time: job.time,
            createdAt: scheduledDate // preserve the original execution date
          });
          await ScheduledJob.findByIdAndDelete(job._id);
          continue;
        }
      }
      scheduleCronJob(job);
    }
  } catch (err) {
    console.error('Error rescheduling pending messages:', err);
  }
};

module.exports = {
  scheduleMessage,
  getAllMessages,
  getCpuStatus,
  reschedulePendingMessages
};
