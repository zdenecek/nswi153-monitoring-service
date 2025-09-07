import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PlusIcon } from '@heroicons/react/24/outline';
import React from 'react';

const API_URL = import.meta.env.VITE_API_URL;

interface Monitor {
  id: string;
  label: string;
  type: 'ping' | 'website';
  url: string;
  host: string;
  periodicity: number;
  status: 'up' | 'down' | 'pending';
  lastCheck: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  label: string;
  description: string;
  monitors: Monitor[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Use the field names that match the API
  const [newMonitor, setNewMonitor] = useState({
    label: '',
    type: 'website',
    url: '',
    interval: 60,
    badgeLabel: '',
    host: '',
    port: 80
  });

  const { data: project, isLoading, refetch, isFetching } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      const projectData = await response.json();
      console.log('Project data received:', projectData);

      // If we have monitors, fetch each one's detailed data to get the status
      if (projectData.monitors && projectData.monitors.length > 0) {
        // Create an array of promises for concurrent fetching
        const monitorPromises = projectData.monitors.map(async (monitor: any) => {
          try {
            const monitorResponse = await fetch(`${API_URL}/api/monitors/${monitor.id}`);
            if (!monitorResponse.ok) {
              console.error(`Failed to fetch monitor ${monitor.id}`);
              return monitor; // Return original on error
            }
            
            const monitorData = await monitorResponse.json();
            
            // Determine status from most recent check
            let status = 'pending';
            let lastCheck = null;
            
            if (monitorData.checks && monitorData.checks.length > 0) {
              // Sort checks by timestamp (newest first)
              const sortedChecks = [...monitorData.checks].sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
              
              // Get status from most recent check
              status = sortedChecks[0].status;
              lastCheck = sortedChecks[0].timestamp;
            } else if (monitorData.statuses && monitorData.statuses.length > 0) {
              // Sort statuses by startTime (newest first)
              const sortedStatuses = [...monitorData.statuses].sort(
                (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
              );
              
              // Get status from most recent status check
              status = sortedStatuses[0].status === 'succeeded' ? 'up' : 'down';
              lastCheck = sortedStatuses[0].startTime;
            }
            
            console.log(`Monitor ${monitor.id} status: ${status}, lastCheck: ${lastCheck}`);
            
            // Return monitor with updated status information
            return {
              ...monitor,
              status: status,
              lastCheck: lastCheck
            };
          } catch (error) {
            console.error(`Error fetching monitor ${monitor.id}:`, error);
            return monitor; // Return original on error
          }
        });
        
        // Wait for all monitor fetches to complete
        projectData.monitors = await Promise.all(monitorPromises);
        console.log('Monitors with status:', projectData.monitors);
      }
      
      return projectData;
    },
  });

  // Force a refresh of the data when component mounts and periodically
  useEffect(() => {
    console.log('ProjectDetail mounted, refreshing data');
    refetch();
    
    // Set up automatic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing monitor statuses');
      refetch();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [refetch]);

  const createMonitorMutation = useMutation({
    mutationFn: async (monitor: typeof newMonitor) => {
      console.log('Creating monitor with data:', monitor, 'projectId:', projectId);
      
      // Ensure we have a host for website type
      let host = monitor.host;
      if (monitor.type === 'website' && monitor.url && !host) {
        try {
          const url = new URL(monitor.url);
          host = url.hostname;
          console.log('Extracted host from URL:', host);
        } catch (error) {
          console.error('Invalid URL:', monitor.url);
          throw new Error('Invalid URL format');
        }
      }
      
      if (!host) {
        console.error('Host is required but missing');
        throw new Error('Host is required');
      }
      
      // Based on the error and message, using the provided example payload
      const payload = {
        label: monitor.label, 
        type: monitor.type,
        url: monitor.type === 'website' ? monitor.url : undefined,
        periodicity: monitor.interval,
        projectId: projectId,
        badgeLabel: monitor.badgeLabel || monitor.label,
        host: host, // Use extracted host or provided host
        port: monitor.type === 'ping' ? monitor.port : undefined
      };
      
      console.log('FINAL PAYLOAD:', JSON.stringify(payload));
      
      const response = await fetch(`${API_URL}/api/monitors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const text = await response.text();
      console.log('RESPONSE TEXT:', text);
      
      let responseData;
      try {
        responseData = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Failed to parse response:', e);
        responseData = { error: 'Failed to parse server response' };
      }
      
      if (!response.ok) {
        const errorMessage = responseData?.error || 'Failed to create monitor';
        console.error('Monitor creation failed:', errorMessage);
        setFormError(errorMessage);
        throw new Error(errorMessage);
      }
      
      return responseData;
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewMonitor({
        label: '',
        type: 'website',
        url: '',
        interval: 60,
        badgeLabel: '',
        host: '',
        port: 80
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Project not found</h3>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">{project.label}</h1>
          <p className="mt-2 text-sm text-gray-700">{project.description}</p>
          {project.tags && project.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span key={tag} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New Monitor
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    URL
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Last Check
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {project.monitors?.map((monitor) => {
                  console.log('Rendering monitor:', monitor.id, 'Status:', monitor.status);
                  return (
                    <tr key={monitor.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                        <Link to={`/monitors/${monitor.id}`} className="hover:text-primary-600">
                          {monitor.label}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{monitor.type}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{monitor.url}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {isFetching ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800">
                            <svg className="animate-spin -ml-0.5 mr-1.5 h-2 w-2 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            UPDATING
                          </span>
                        ) : (
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              monitor.status === 'up'
                                ? 'bg-green-100 text-green-800'
                                : monitor.status === 'down'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {monitor.status ? monitor.status.toUpperCase() : 'PENDING'}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {monitor.lastCheck 
                          ? new Date(monitor.lastCheck).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            }) 
                          : 'Never'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Monitor</h3>
            
            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-3">
                <p className="text-sm font-medium">Error: {formError}</p>
              </div>
            )}
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                
                // Client-side validation - check required fields
                if (!newMonitor.label) {
                  setFormError('Name is required');
                  return;
                }
                
                if (newMonitor.type === 'website' && !newMonitor.url) {
                  setFormError('URL is required for Website monitors');
                  return;
                }
                
                if (!newMonitor.host) {
                  // For website monitors, try one more time to extract host
                  if (newMonitor.type === 'website' && newMonitor.url) {
                    try {
                      const url = new URL(newMonitor.url);
                      if (url.hostname) {
                        // Update the monitor with the hostname before submission
                        setNewMonitor(prev => ({ ...prev, host: url.hostname }));
                        // Continue with this updated model
                        const updatedMonitor = { ...newMonitor, host: url.hostname };
                        createMonitorMutation.mutate(updatedMonitor);
                        return;
                      }
                    } catch (err) {
                      // Fall through to error
                    }
                  }
                  
                  setFormError('Host is required');
                  return;
                }
                
                createMonitorMutation.mutate(newMonitor);
              }}
            >
              <div className="mb-4">
                <label htmlFor="label" className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="label"
                  name="label"
                  value={newMonitor.label}
                  onChange={(e) => setNewMonitor({ ...newMonitor, label: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={newMonitor.type}
                  onChange={(e) => setNewMonitor({ 
                    ...newMonitor, 
                    type: e.target.value as 'website' | 'ping'
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                >
                  <option value="website">Website</option>
                  <option value="ping">Ping</option>
                </select>
              </div>

              {newMonitor.type === 'website' ? (
                <div className="mb-4">
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={newMonitor.url}
                    onChange={(e) => {
                      const urlValue = e.target.value;
                      let hostValue = newMonitor.host;
                      
                      // Try to extract host from URL
                      if (urlValue && e.target.validity.valid) {
                        try {
                          const url = new URL(urlValue);
                          hostValue = url.hostname;
                        } catch (err) {
                          // Invalid URL format, keep existing host
                        }
                      }
                      
                      setNewMonitor({ 
                        ...newMonitor, 
                        url: urlValue,
                        host: hostValue // Always update host when URL changes
                      });
                      
                      // Clear form error if we have a valid URL
                      if (urlValue && e.target.validity.valid) {
                        setFormError(null);
                      }
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                    placeholder="e.g., https://example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Full URL including protocol (https:// or http://)
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label htmlFor="host" className="block text-sm font-medium text-gray-700">
                      Host <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="host"
                      name="host"
                      value={newMonitor.host}
                      onChange={(e) => setNewMonitor({ ...newMonitor, host: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                      placeholder="e.g., example.com"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Hostname without protocol (e.g. example.com)
                    </p>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="port" className="block text-sm font-medium text-gray-700">
                      Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="port"
                      name="port"
                      min="1"
                      max="65535"
                      value={newMonitor.port}
                      onChange={(e) => setNewMonitor({ ...newMonitor, port: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Port number (1-65535)
                    </p>
                  </div>
                </>
              )}
              <div className="mb-4">
                <label htmlFor="badgeLabel" className="block text-sm font-medium text-gray-700">
                  Badge Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="badgeLabel"
                  name="badgeLabel"
                  value={newMonitor.badgeLabel}
                  onChange={(e) => setNewMonitor({ ...newMonitor, badgeLabel: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Short label for status badge"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Short label used on the status badge 
                </p>
              </div>
              <div className="mb-4">
                <label htmlFor="interval" className="block text-sm font-medium text-gray-700">
                  Check Interval (seconds) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="interval"
                  name="interval"
                  min="5"
                  max="300"
                  value={newMonitor.interval}
                  onChange={(e) => setNewMonitor({ ...newMonitor, interval: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Must be between 5 and 300 seconds
                </p>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  disabled={createMonitorMutation.isPending}
                >
                  {createMonitorMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 