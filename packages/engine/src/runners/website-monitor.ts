import fetch, { Response } from 'node-fetch';
import { Monitor } from '../entities/Monitor.js';
import { MonitorStatus, StatusType } from '../entities/MonitorStatus.js';

/**
 * Run a website monitor check
 * @param monitor The website monitor to check
 * @returns A MonitorStatus object with the check results
 */
export async function runWebsiteMonitor(monitor: Monitor): Promise<MonitorStatus> {
  const startTime = Date.now();
  let status: StatusType = 'failed';
  let error: string | undefined;
  let response: Response | null = null;
  
  try {
    // For website monitors, make an HTTP request
    response = await fetch(monitor.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'MonitoringService/1.0'
      }, 
      signal: AbortSignal.timeout(10000)  // 10 second timeout
    });
    
    // Check status code if checkStatus is enabled
    if (monitor.checkStatus && (response.status < 200 || response.status >= 300)) {
      error = `HTTP status code ${response.status}`;
    } else {
      // At this point, we have a response, which might still fail based on keywords
      status = 'succeeded';
      
      // If keywords are defined, check if they are in the response
      if (monitor.keywords && monitor.keywords.length > 0) {
        const text = await response.text();
        
        // Check if all keywords are present
        for (const keyword of monitor.keywords) {
          if (keyword && !text.includes(keyword)) {
            status = 'failed';
            error = `Keyword "${keyword}" not found in response`;
            break;
          }
        }
      }
    }
  } catch (err) {
    // Request failed
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Website monitor failed for ${monitor.url}:`, errorMessage);
    error = errorMessage;
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