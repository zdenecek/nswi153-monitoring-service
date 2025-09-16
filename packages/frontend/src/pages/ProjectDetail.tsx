import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from '@heroicons/react/24/outline';
import { CreateMonitorModal } from '../components/CreateMonitorModal';

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
  // Website monitor specific fields
  checkStatus?: boolean;
  keywords?: string[];
  // Ping monitor specific fields
  port?: number;
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

      <CreateMonitorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId!}
      />
    </div>
  );
} 