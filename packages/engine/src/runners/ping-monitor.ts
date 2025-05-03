import * as net from 'net';
import { Monitor } from '../entities/Monitor.js';
import { MonitorStatus, StatusType } from '../entities/MonitorStatus.js';

/**
 * Run a ping monitor check
 * @param monitor The ping monitor to check
 * @returns A MonitorStatus object with the check results
 */
export async function runPingMonitor(monitor: Monitor): Promise<MonitorStatus> {
  const startTime = Date.now();
  let status: StatusType = 'failed';
  let error: string | undefined;
  
  try {
    // For ping monitors, attempt to establish a TCP connection
    await new Promise<void>((resolve, reject) => {
      const socket = new net.Socket();
      const port = monitor.port || 80; // Default to port 80 if not specified
      
      // Set a timeout for the connection
      socket.setTimeout(5000); // 5 second timeout
      
      socket.on('connect', () => {
        status = 'succeeded';
        socket.end();
        resolve();
      });
      
      socket.on('timeout', () => {
        error = 'Connection timed out';
        socket.destroy();
        reject(new Error('Connection timed out'));
      });
      
      socket.on('error', (err) => {
        error = err.message;
        reject(err);
      });
      
      // Attempt to connect
      socket.connect(port, monitor.host);
    });
  } catch (err) {
    // Connection failed or errored out
    console.error(`Ping monitor failed for ${monitor.host}:${monitor.port}:`, err);
    // Status already set to 'failed'
  }
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  // Create the monitor status object
  return new MonitorStatus({
    monitorId: monitor.id,
    status,
    responseTime,
    error
  });
} 