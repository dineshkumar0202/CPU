const os = require('os');

let oldCpuTimes = getCpuTimes();
let currentCpuUsage = 0;

function getCpuTimes() {
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) {
    return { idle: 0, total: 0 };
  }
  let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
  for (const cpu of cpus) {
    user += cpu.times.user;
    nice += cpu.times.nice;
    sys += cpu.times.sys;
    idle += cpu.times.idle;
    irq += cpu.times.irq;
  }
  const total = user + nice + sys + idle + irq;
  return { idle, total };
}

function calculateCpuUsage() {
  const newCpuTimes = getCpuTimes();
  const idleDiff = newCpuTimes.idle - oldCpuTimes.idle;
  const totalDiff = newCpuTimes.total - oldCpuTimes.total;
  oldCpuTimes = newCpuTimes;

  if (totalDiff === 0) return 0;
  return (1 - (idleDiff / totalDiff)) * 100;
}

function startCpuMonitor() {
  const THRESHOLD = parseInt(process.env.CPU_THRESHOLD, 10) || 70;
  const INTERVAL = 5000; // check every 5 seconds
  let consecutiveSpikes = 0;
  const SPIKE_LIMIT = 3; // require 3 consecutive checks (15 seconds) of high CPU to restart

  // Initialize baseline
  oldCpuTimes = getCpuTimes();

  setInterval(() => {
    try {
      currentCpuUsage = calculateCpuUsage();
      if (currentCpuUsage >= THRESHOLD) {
        consecutiveSpikes++;
        console.log(`⚠️ CPU at ${currentCpuUsage.toFixed(2)}% — exceeds ${THRESHOLD}% threshold. Consecutive spike count: ${consecutiveSpikes}/${SPIKE_LIMIT}`);
        if (consecutiveSpikes >= SPIKE_LIMIT) {
          console.log(`🚨 CPU threshold consistently exceeded for ${SPIKE_LIMIT * (INTERVAL / 1000)}s. Restarting server...`);
          process.exit(1);
        }
      } else {
        consecutiveSpikes = 0; // reset counter on normal CPU usage
      }
    } catch (err) {
      console.error('Error fetching CPU usage:', err);
    }
  }, INTERVAL);
}

function getCurrentCpuUsage() {
  return currentCpuUsage;
}

module.exports = { startCpuMonitor, getCurrentCpuUsage };
