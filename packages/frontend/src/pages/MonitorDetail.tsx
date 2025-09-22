import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MonitorGraphView } from "../components/MonitorGraphView";
import { MonitorCalendarView } from "../components/MonitorCalendarView";
import { MonitorHistoryView } from "../components/MonitorHistoryView";

const API_URL = import.meta.env.VITE_API_URL;

interface MonitorCheck {
  id: string;
  status: "succeeded" | "failed";
  responseTime: number;
  timestamp: string;
  error?: string;
}

interface Monitor {
  id: string;
  label: string;
  type: "ping" | "website";
  url: string;
  host: string;
  periodicity: number;
  status?: "succeeded" | "failed" | "pending";
  lastCheck?: string | null;
  createdAt: string;
  updatedAt: string;
  checks: MonitorCheck[];
  projectId: string;
  // Website monitor specific fields
  checkStatus?: boolean;
  keywords?: string[];
  // Ping monitor specific fields
  port?: number;
}
export function MonitorDetail() {
  const { monitorId } = useParams<{ monitorId: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedMonitor, setEditedMonitor] = useState<Partial<Monitor> | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"graph" | "calendar" | "history">(
    "graph",
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: monitor, isLoading } = useQuery<Monitor>({
    queryKey: ["monitor", monitorId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/monitors/${monitorId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch monitor");
      }
      const data = await response.json();

      // Ensure checks exists - handle both checks and statuses arrays
      const checks =
        data.checks ||
        data.statuses?.map((status: { id: string; status: string; responseTime?: number; startTime: string; error?: string }) => ({
          id: status.id,
          status: status.status === "succeeded" ? "succeeded" : "failed",
          responseTime: status.responseTime,
          timestamp: status.startTime,
          error: status.error,
        })) ||
        [];

      // Determine current status from the most recent check
      let currentStatus = data.status;
      if (checks.length > 0) {
        // Sort checks by timestamp (newest first)
        const sortedChecks = [...checks].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        currentStatus = sortedChecks[0].status;
      }

      return {
        ...data,
        checks,
        status: currentStatus || "pending",
      };
    },
  });

  const updateMonitorMutation = useMutation({
    mutationFn: async (data: Partial<Monitor>) => {
      const response = await fetch(`${API_URL}/api/monitors/${monitorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update monitor");
      }
      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["monitor", monitorId] });
      if (monitor?.projectId) {
        void queryClient.invalidateQueries({ queryKey: ["project", monitor.projectId] });
      }
      setIsEditModalOpen(false);
      setEditedMonitor(null);
    },
  });
  const deleteMonitorMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/monitors/${monitorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete monitor");
      }
    },
    onSuccess: () => {
      if (monitor?.projectId) {
        void queryClient.invalidateQueries({ queryKey: ["project", monitor.projectId] });
        navigate(`/projects/${monitor.projectId}`);
      } else {
        navigate("/projects"); // fallback if no projectId
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Monitor not found</h3>
      </div>
    );
  }

  const uptime = (monitor.checks || []).length
    ? ((monitor.checks || []).filter((check) => check.status === "succeeded").length /
        (monitor.checks || []).length) *
      100
    : 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            {monitor.label}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {monitor.type.toUpperCase()} monitor for {monitor.url}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex space-x-3">
          <button
            type="button"
            onClick={() => {
              setEditedMonitor(monitor);
              setIsEditModalOpen(true);
            }}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm("Are you sure you want to delete this monitor?")
              ) {
                deleteMonitorMutation.mutate();
              }
            }}
            className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Status</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            <span
              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                monitor.status === "succeeded"
                  ? "bg-green-100 text-green-800"
                  : monitor.status === "failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {monitor.status?.toUpperCase()}
            </span>
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Uptime</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {uptime.toFixed(2)}%
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Average Response Time
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {(monitor.checks || []).length
              ? (
                  (monitor.checks || []).reduce(
                    (acc, check) => acc + check.responseTime,
                    0,
                  ) / (monitor.checks || []).length
                ).toFixed(0)
              : 0}{" "}
            ms
          </dd>
        </div>
      </div>

      {monitor.type === "website" &&
        (monitor.checkStatus ||
          (monitor.keywords && monitor.keywords.length > 0)) && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Monitor Configuration
            </h2>
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  {monitor.checkStatus && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Status Code Check
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Enabled
                        </span>
                        <p className="mt-1 text-xs text-gray-500">
                          Monitor fails when HTTP status is not in range [200,
                          300)
                        </p>
                      </dd>
                    </div>
                  )}
                  {monitor.keywords && monitor.keywords.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Keywords
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1 items-center justify-center">
                          {monitor.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Monitor fails if any keyword is not found in response
                        </p>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        )}

      {/* View Toggle */}
      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setViewMode("graph")}
            className={`px-4 py-2 text-sm font-medium border rounded-l-lg focus:z-10 focus:ring-2 focus:ring-blue-500 ${
              viewMode === "graph"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Graph
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 text-sm font-medium border border-l-0 focus:z-10 focus:ring-2 focus:ring-blue-500 ${
              viewMode === "calendar"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setViewMode("history")}
            className={`px-4 py-2 text-sm font-medium border rounded-r-lg border-l-0 focus:z-10 focus:ring-2 focus:ring-blue-500 ${
              viewMode === "history"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Render the selected view */}
      {viewMode === "graph" && (
        <MonitorGraphView checks={monitor.checks || []} />
      )}
      {viewMode === "calendar" && (
        <MonitorCalendarView checks={monitor.checks || []} />
      )}
      {viewMode === "history" && (
        <MonitorHistoryView checks={monitor.checks || []} />
      )}

      {isEditModalOpen && editedMonitor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-w-lg w-full">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Edit Monitor
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editedMonitor) {
                  // Validate periodicity range
                  if (
                    editedMonitor.periodicity &&
                    (editedMonitor.periodicity < 5 ||
                      editedMonitor.periodicity > 300)
                  ) {
                    alert("Check interval must be between 5 and 300 seconds");
                    return;
                  }

                  // ✅ clean up keywords just before sending
                  const cleanKeywords = (editedMonitor.keywords || [])
                    .map((k) => k.trim())
                    .filter(Boolean);

                  updateMonitorMutation.mutate({
                    ...editedMonitor,
                    keywords: cleanKeywords,
                  });
                }
              }}
            >
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Label
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={editedMonitor.label}
                  onChange={(e) =>
                    setEditedMonitor({
                      ...editedMonitor,
                      label: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700"
                >
                  URL
                </label>
                <input
                  type="text"
                  name="url"
                  id="url"
                  value={editedMonitor.url}
                  onChange={(e) =>
                    setEditedMonitor({ ...editedMonitor, url: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              {editedMonitor.type === "website" && (
                <>
                  <div className="mb-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="checkStatus"
                        name="checkStatus"
                        checked={editedMonitor.checkStatus || false}
                        onChange={(e) =>
                          setEditedMonitor({
                            ...editedMonitor,
                            checkStatus: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="checkStatus"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Check HTTP status code
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Monitor fails when status is not in range [200, 300)
                    </p>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="keywords"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Keywords
                    </label>
                    <input
                      type="text"
                      id="keywords"
                      name="keywords"
                      value={(editedMonitor.keywords || []).join(",")}
                      onChange={(e) => {
                        const keywords = e.target.value
                          .split(",")
                          .map((k) => k.trim());
                        setEditedMonitor({ ...editedMonitor, keywords });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Comma-separated keywords. Monitor fails if any keyword is
                      not found in response.
                    </p>
                  </div>
                </>
              )}

              <div className="mb-4">
                <label
                  htmlFor="interval"
                  className="block text-sm font-medium text-gray-700"
                >
                  Check Interval (seconds)
                </label>
                <input
                  type="number"
                  name="interval"
                  id="interval"
                  min="5"
                  max="300"
                  value={editedMonitor.periodicity}
                  onChange={(e) =>
                    setEditedMonitor({
                      ...editedMonitor,
                      periodicity: parseInt(e.target.value, 10),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Must be between 5 and 300 seconds
                </p>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="submit"
                  disabled={updateMonitorMutation.isPending}
                  className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:col-start-2"
                >
                  {updateMonitorMutation.isPending ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
