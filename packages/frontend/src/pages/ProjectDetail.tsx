import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "@heroicons/react/24/outline";
import { CreateMonitorModal } from "../components/CreateMonitorModal";
import { EditProjectModal } from "../components/EditProjectModal";

const API_URL = import.meta.env.VITE_API_URL;

interface Monitor {
  id: string;
  label: string;
  type: "ping" | "website";
  url: string;
  host: string;
  periodicity: number;
  status: "succeeded" | "failed" | "pending";
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

type MonitorTypeFilter = Monitor["type"] | "all";
type MonitorStatusFilter = Monitor["status"] | "all";

const MONITORS_PAGE_SIZE = 5;

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filters, setFilters] = useState<{
    label: string;
    type: MonitorTypeFilter;
    status: MonitorStatusFilter;
  }>({ label: "", type: "all", status: "all" });
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const {
    data: project,
    isLoading,
    refetch,
  } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      const projectData = await response.json();
      console.log("Project data received:", projectData);

      // If we have monitors, fetch each one's detailed data to get the status
      if (projectData.monitors && projectData.monitors.length > 0) {
        // Create an array of promises for concurrent fetching
        const monitorPromises = projectData.monitors.map(
          async (monitor: { id: string }) => {
            try {
              const monitorResponse = await fetch(
                `${API_URL}/api/monitors/${monitor.id}`,
              );
              if (!monitorResponse.ok) {
                console.error(`Failed to fetch monitor ${monitor.id}`);
                return monitor; // Return original on error
              }

              const monitorData = await monitorResponse.json();

              // Determine status from most recent check
              let status = "pending";
              let lastCheck = null;

              if (monitorData.checks && monitorData.checks.length > 0) {
                // Sort checks by timestamp (newest first)
                const sortedChecks = [...monitorData.checks].sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime(),
                );

                // Get status from most recent check
                status = sortedChecks[0].status;
                lastCheck = sortedChecks[0].timestamp;
              } else if (
                monitorData.statuses &&
                monitorData.statuses.length > 0
              ) {
                // Sort statuses by startTime (newest first)
                const sortedStatuses = [...monitorData.statuses].sort(
                  (a, b) =>
                    new Date(b.startTime).getTime() -
                    new Date(a.startTime).getTime(),
                );

                // Get status from most recent status check
                status =
                  sortedStatuses[0].status === "succeeded" ? "succeeded" : "failed";
                lastCheck = sortedStatuses[0].startTime;
              }

              // Only use 'pending' if there are absolutely no checks available
              if (
                status === "pending" &&
                (monitorData.checks?.length > 0 ||
                  monitorData.statuses?.length > 0)
              ) {
                // If we have checks but somehow didn't get a status, use the most recent check result
                if (monitorData.checks?.length > 0) {
                  const sortedChecks = [...monitorData.checks].sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime(),
                  );
                  status = sortedChecks[0].status;
                } else if (monitorData.statuses?.length > 0) {
                  const sortedStatuses = [...monitorData.statuses].sort(
                    (a, b) =>
                      new Date(b.startTime).getTime() -
                      new Date(a.startTime).getTime(),
                  );
                  status =
                    sortedStatuses[0].status === "succeeded" ? "succeeded" : "failed";
                }
              }

              console.log(
                `Monitor ${monitor.id} status: ${status}, lastCheck: ${lastCheck}`,
              );

              // Return monitor with updated status information
              return {
                ...monitor,
                status: status,
                lastCheck: lastCheck,
              };
            } catch (error) {
              console.error(`Error fetching monitor ${monitor.id}:`, error);
              return monitor; // Return original on error
            }
          },
        );

        // Wait for all monitor fetches to complete
        projectData.monitors = await Promise.all(monitorPromises);
        console.log("Monitors with status:", projectData.monitors);
      }

      return projectData;
    },
  });

  // Force a refresh of the data when component mounts and periodically
  useEffect(() => {
    console.log("ProjectDetail mounted, refreshing data");
    refetch();

    // Set up automatic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing monitor statuses");
      refetch();
    }, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [refetch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const deleteMonitorMutation = useMutation({
    mutationFn: async (monitorId: string) => {
      const response = await fetch(`${API_URL}/api/monitors/${monitorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete monitor");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (error: Error) => {
      window.alert(error.message);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete project");
      }
    },
    onSuccess: () => {
      navigate("/projects");
    },
    onError: (error: Error) => {
      window.alert(error.message);
    },
  });

  const monitors = project?.monitors ?? [];
  const filteredMonitors = monitors.filter((monitor) => {
    const matchesLabel = monitor.label
      .toLowerCase()
      .includes(filters.label.toLowerCase());
    const matchesType = filters.type === "all" || monitor.type === filters.type;
    const monitorStatus = monitor.status ?? "pending";
    const matchesStatus =
      filters.status === "all" || monitorStatus === filters.status;
    return matchesLabel && matchesType && matchesStatus;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMonitors.length / MONITORS_PAGE_SIZE),
  );
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedMonitors = filteredMonitors.slice(
    (currentPageSafe - 1) * MONITORS_PAGE_SIZE,
    currentPageSafe * MONITORS_PAGE_SIZE,
  );

  useEffect(() => {
    if (currentPage !== currentPageSafe) {
      setCurrentPage(currentPageSafe);
    }
  }, [currentPage, currentPageSafe]);

  const handleDeleteMonitor = (monitorId: string) => {
    if (window.confirm("Are you sure you want to delete this monitor?")) {
      deleteMonitorMutation.mutate(monitorId);
    }
  };

  const handleDeleteProject = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this entire project? This will also delete all monitors in this project. This action cannot be undone.",
      )
    ) {
      deleteProjectMutation.mutate();
    }
  };

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
          <h1 className="text-2xl font-semibold text-gray-900">
            {project.label}
          </h1>
          <p className="mt-2 text-sm text-gray-700">{project.description}</p>
          {project.tags && project.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Edit Project
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="-ml-0.5 mr-1.5 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <button
            type="button"
            onClick={handleDeleteProject}
            disabled={deleteProjectMutation.isPending}
            className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:bg-red-400"
          >
            {deleteProjectMutation.isPending ? "Deleting…" : "Delete Project"}
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label
            htmlFor="filterLabel"
            className="block text-sm font-medium text-gray-700"
          >
            Filter by Label
          </label>
          <input
            id="filterLabel"
            type="text"
            value={filters.label}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, label: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="Search label"
          />
        </div>
        <div>
          <label
            htmlFor="filterType"
            className="block text-sm font-medium text-gray-700"
          >
            Filter by Type
          </label>
          <select
            id="filterType"
            value={filters.type}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                type: e.target.value as MonitorTypeFilter,
              }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="all">All</option>
            <option value="website">Website</option>
            <option value="ping">Ping</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="filterStatus"
            className="block text-sm font-medium text-gray-700"
          >
            Filter by Status
          </label>
          <select
            id="filterStatus"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value as MonitorStatusFilter,
              }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="all">All</option>
            <option value="succeeded">Succeeded</option>
            <option value="Failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                  >
                    Label
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    URL
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Last Check
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedMonitors.length > 0 ? (
                  paginatedMonitors.map((monitor) => (
                    <tr key={monitor.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                        <Link
                          to={`/monitors/${monitor.id}`}
                          className="hover:text-primary-600"
                        >
                          {monitor.label}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {monitor.type}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {monitor.url}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              monitor.status === "succeeded"
                                ? "bg-green-100 text-green-800"
                                : monitor.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {(monitor.status ?? "pending").toUpperCase()}
                          </span>
                        }
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {monitor.lastCheck
                          ? new Date(monitor.lastCheck).toLocaleString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              },
                            )
                          : "Never"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <button
                          type="button"
                          onClick={() => handleDeleteMonitor(monitor.id)}
                          disabled={deleteMonitorMutation.isPending}
                          className="inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:bg-red-400"
                        >
                          {deleteMonitorMutation.isPending
                            ? "Deleting…"
                            : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="whitespace-nowrap py-6 text-center text-sm text-gray-500"
                    >
                      No monitors match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing{" "}
          {filteredMonitors.length === 0
            ? 0
            : (currentPageSafe - 1) * MONITORS_PAGE_SIZE + 1}
          -
          {Math.min(
            currentPageSafe * MONITORS_PAGE_SIZE,
            filteredMonitors.length,
          )}{" "}
          of {filteredMonitors.length} monitors
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPageSafe === 1}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:ring-gray-200"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPageSafe} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={
              currentPageSafe === totalPages || filteredMonitors.length === 0
            }
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:ring-gray-200"
          >
            Next
          </button>
        </div>
      </div>

      <CreateMonitorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId!}
      />

      {project && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={project}
        />
      )}
    </div>
  );
}
