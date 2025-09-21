import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL;

interface Monitor {
  id: string;
  label: string;
  type: "ping" | "website";
  url: string;
  host: string;
  periodicity: number;
  status: "up" | "down" | "pending";
  lastCheck: string | null;
  createdAt: string;
  updatedAt: string;
  // Website monitor specific fields
  checkStatus?: boolean;
  keywords?: string[];
  // Ping monitor specific fields
  port?: number;
}

interface CreateMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function CreateMonitorModal({
  isOpen,
  onClose,
  projectId,
}: CreateMonitorModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Use the field names that match the API
  const [newMonitor, setNewMonitor] = useState({
    label: "",
    type: "website" as "website" | "ping",
    url: "",
    interval: 60,
    badgeLabel: "",
    host: "",
    port: 80,
    checkStatus: false,
    keywords: [] as string[],
  });

  const createMonitorMutation = useMutation({
    mutationFn: async (monitorData: typeof newMonitor) => {
      const response = await fetch(`${API_URL}/api/monitors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...monitorData,
          periodicity: monitorData.interval,
          projectId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create monitor");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setNewMonitor({
        label: "",
        type: "website",
        url: "",
        interval: 60,
        badgeLabel: "",
        host: "",
        port: 80,
        checkStatus: false,
        keywords: [],
      });
      setFormError(null);
      onClose();
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Create New Monitor
        </h3>

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
              setFormError("Name is required");
              return;
            }

            if (newMonitor.type === "website" && !newMonitor.url) {
              setFormError("URL is required for Website monitors");
              return;
            }

            // Validate periodicity range
            if (newMonitor.interval < 5 || newMonitor.interval > 300) {
              setFormError("Check interval must be between 5 and 300 seconds");
              return;
            }

            if (!newMonitor.host) {
              // For website monitors, try one more time to extract host
              if (newMonitor.type === "website" && newMonitor.url) {
                try {
                  const url = new URL(newMonitor.url);
                  if (url.hostname) {
                    // Update the monitor with the hostname before submission
                    setNewMonitor((prev) => ({ ...prev, host: url.hostname }));
                    // Continue with this updated model
                    const updatedMonitor = {
                      ...newMonitor,
                      host: url.hostname,
                    };
                    createMonitorMutation.mutate(updatedMonitor);
                    return;
                  }
                } catch (err) {
                  // Fall through to error
                }
              }

              setFormError("Host is required");
              return;
            }

            createMonitorMutation.mutate(newMonitor);
          }}
        >
          <div className="mb-4">
            <label
              htmlFor="label"
              className="block text-sm font-medium text-gray-700"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="label"
              name="label"
              value={newMonitor.label}
              onChange={(e) =>
                setNewMonitor({ ...newMonitor, label: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={newMonitor.type}
              onChange={(e) =>
                setNewMonitor({
                  ...newMonitor,
                  type: e.target.value as "website" | "ping",
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            >
              <option value="website">Website</option>
              <option value="ping">Ping</option>
            </select>
          </div>

          {newMonitor.type === "website" ? (
            <div className="mb-4">
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700"
              >
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
                    host: hostValue, // Always update host when URL changes
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
          ) : null}

          {newMonitor.type === "website" && (
            <>
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="checkStatus"
                    name="checkStatus"
                    checked={newMonitor.checkStatus}
                    onChange={(e) =>
                      setNewMonitor({
                        ...newMonitor,
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
                  value={newMonitor.keywords.join(",")}
                  onChange={(e) => {
                    const keywords = e.target.value
                      .split(",")
                      .map((k) => k.trim());
                    setNewMonitor({ ...newMonitor, keywords });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="keyword1, keyword2, keyword3"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Comma-separated keywords. Monitor fails if any keyword is not
                  found in response.
                </p>
              </div>
            </>
          )}

          {newMonitor.type === "ping" ? (
            <>
              <div className="mb-4">
                <label
                  htmlFor="host"
                  className="block text-sm font-medium text-gray-700"
                >
                  Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="host"
                  name="host"
                  value={newMonitor.host}
                  onChange={(e) =>
                    setNewMonitor({ ...newMonitor, host: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                  placeholder="e.g., example.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Hostname without protocol (e.g. example.com)
                </p>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="port"
                  className="block text-sm font-medium text-gray-700"
                >
                  Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="port"
                  name="port"
                  min="1"
                  max="65535"
                  value={newMonitor.port}
                  onChange={(e) =>
                    setNewMonitor({
                      ...newMonitor,
                      port: parseInt(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Port number (1-65535)
                </p>
              </div>
            </>
          ) : null}

          <div className="mb-4">
            <label
              htmlFor="badgeLabel"
              className="block text-sm font-medium text-gray-700"
            >
              Badge Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="badgeLabel"
              name="badgeLabel"
              value={newMonitor.badgeLabel}
              onChange={(e) =>
                setNewMonitor({ ...newMonitor, badgeLabel: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Short label for status badge"
            />
            <p className="mt-1 text-xs text-gray-500">
              Short label used on the status badge
            </p>
          </div>

          <div className="mb-4">
            <label
              htmlFor="interval"
              className="block text-sm font-medium text-gray-700"
            >
              Check Interval (seconds) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="interval"
              name="interval"
              min="5"
              max="300"
              value={newMonitor.interval}
              onChange={(e) =>
                setNewMonitor({
                  ...newMonitor,
                  interval: parseInt(e.target.value),
                })
              }
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
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              disabled={createMonitorMutation.isPending}
            >
              {createMonitorMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
