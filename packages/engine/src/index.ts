import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource, initializeDatabase } from './db.js';
import { Monitor, MonitorType } from './entities/Monitor.js';
import { MonitorStatus } from './entities/MonitorStatus.js';
import { runPingMonitor } from './runners/ping-monitor.js';
import { runWebsiteMonitor } from './runners/website-monitor.js';

// How often to check for new monitors (in milliseconds)
const MONITOR_DISCOVERY_INTERVAL = 10 * 1000; // 10 seconds

// Map of monitor ID to their timeouts
const activeMonitors = new Map<string, NodeJS.Timeout>();

/**
 * Run a monitor check and save the result to the database
 */
async function runMonitorCheck(monitor: Monitor): Promise<void> {
  console.log(`Running check for monitor ${monitor.label} (${monitor.id})`);
  
  try {
    // Run the appropriate monitor check based on type
    let status: MonitorStatus;
    
    if (monitor.type === 'ping') {
      status = await runPingMonitor(monitor);
    } else if (monitor.type === 'website') {
      status = await runWebsiteMonitor(monitor);
    } else {
      console.error(`Unknown monitor type: ${monitor.type}`);
      return;
    }
    
    // Save the monitor status to the database
    await AppDataSource.getRepository(MonitorStatus).save(status);
    
    console.log(`Check completed for ${monitor.label}: ${status.status} (${status.responseTime}ms)`);
  } catch (error) {
    console.error(`Error running monitor check for ${monitor.id}:`, error);
  }
}

/**
 * Schedule a monitor to run periodically
 */
function scheduleMonitor(monitor: Monitor): void {
  // Clear any existing timeout for this monitor
  if (activeMonitors.has(monitor.id)) {
    clearTimeout(activeMonitors.get(monitor.id)!);
  }
  
  const runAndReschedule = async () => {
    console.log(`Running monitor check for ${monitor.label} (${monitor.id})`);
    await runMonitorCheck(monitor);
    
    // Re-fetch the monitor to get updated configuration
    try {
      const refreshedMonitor = await AppDataSource.getRepository(Monitor).findOne({
        where: { id: monitor.id }
      });
      
      if (refreshedMonitor) {
        // Schedule the next run
        const timeout = setTimeout(runAndReschedule, refreshedMonitor.periodicity * 1000);
        activeMonitors.set(refreshedMonitor.id, timeout);
      } else {
        // Monitor was deleted, remove from active monitors
        activeMonitors.delete(monitor.id);
        console.log(`Monitor ${monitor.id} was removed, stopping checks`);
      }
    } catch (error) {
      console.error(`Error refreshing monitor ${monitor.id}:`, error);
      // Try again later
      const timeout = setTimeout(runAndReschedule, monitor.periodicity * 1000);
      activeMonitors.set(monitor.id, timeout);
    }
  };
  
  // Start the first run
  const timeout = setTimeout(runAndReschedule, 0);
  activeMonitors.set(monitor.id, timeout);
  console.log(`Scheduled monitor ${monitor.label} (${monitor.id}) to run every ${monitor.periodicity} seconds`);
}

/**
 * Discover monitors from the database and schedule them
 */
async function discoverMonitors(): Promise<void> {
  try {
    const monitorRepository = AppDataSource.getRepository(Monitor);
    const monitors = await monitorRepository.find();
    
    console.log(`Discovered ${monitors.length} monitors`);
    
    // Get the set of currently scheduled monitor IDs
    const currentMonitorIds = new Set(activeMonitors.keys());
    
    // Schedule any new or updated monitors
    for (const monitor of monitors) {
      if (!currentMonitorIds.has(monitor.id)) {
        scheduleMonitor(monitor);
      }
      currentMonitorIds.delete(monitor.id);
    }
    
    // Clean up any monitors that were removed
    for (const monitorId of currentMonitorIds) {
      clearTimeout(activeMonitors.get(monitorId)!);
      activeMonitors.delete(monitorId);
      console.log(`Monitor ${monitorId} was removed, stopping checks`);
    }
  } catch (error) {
    console.error('Error discovering monitors:', error);
  }
}

/**
 * Start the monitoring engine
 */
async function startEngine(): Promise<void> {
  console.log('Starting monitoring engine...');
  
  // Initialize the database
  const connected = await initializeDatabase();
  if (!connected) {
    console.error('Failed to connect to database. Exiting.');
    process.exit(1);
  }
  
  // Do the initial discovery
  await discoverMonitors();
  
  // Set up periodic discovery to pick up new/changed/deleted monitors
  setInterval(discoverMonitors, MONITOR_DISCOVERY_INTERVAL);
  
  console.log('Monitoring engine started.');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  
  // Clear all timeouts
  for (const timeout of activeMonitors.values()) {
    clearTimeout(timeout);
  }
  
  // Close database connection
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  
  process.exit(0);
});

// Start the engine
startEngine().catch(error => {
  console.error('Failed to start monitoring engine:', error);
  process.exit(1);
}); 