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
  
  console.log(`Running website monitor for ${monitor.url}`);
  console.log(`Monitor keywords:`, monitor.keywords);
  console.log(`Monitor checkStatus:`, monitor.checkStatus);
  
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
      status = 'failed';
      error = `HTTP status code ${response.status}`;
      console.log(`Status code check failed: ${response.status}`);
    } else {
      // At this point, we have a response, which might still fail based on keywords
      status = 'succeeded';
      console.log(`Status code check passed: ${response.status}`);
      
      // If keywords are defined, check if they are in the response
      if (monitor.keywords && monitor.keywords.length > 0) {
        const text = await response.text();
        console.log(`Response text length: ${text.length}`);
        console.log(`Response text preview (first 500 chars):`, text.substring(0, 500));
        console.log(`Looking for keywords:`, monitor.keywords);
        
        // Check if all keywords are present
        for (const keyword of monitor.keywords) {
          console.log(`Checking keyword: "${keyword}"`);
          console.log(`Keyword length: ${keyword.length}`);
          console.log(`Keyword trimmed: "${keyword.trim()}"`);
          console.log(`Keyword trimmed length: ${keyword.trim().length}`);
          
          // Filter out empty strings and whitespace-only strings
          if (keyword && keyword.trim() && !text.includes(keyword.trim())) {
            console.log(`❌ Keyword "${keyword}" NOT found in response`);
            status = 'failed';
            error = `Keyword "${keyword}" not found in response`;
            break;
          } else if (keyword && keyword.trim()) {
            console.log(`✅ Keyword "${keyword}" found in response`);
          } else {
            console.log(`⚠️ Skipping empty/whitespace keyword: "${keyword}"`);
          }
        }
      } else {
        console.log('No keywords to check');
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
  
  console.log(`Final monitor status: ${status}, error: ${error || 'none'}`);
  
  // Create the monitor status object
  return new MonitorStatus({
    monitorId: monitor.id,
    status,
    responseTime,
    error
  });
} 