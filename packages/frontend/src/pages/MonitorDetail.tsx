import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = import.meta.env.VITE_API_URL;

interface MonitorCheck {
  id: string;
  status: 'up' | 'down';
  responseTime: number;
  timestamp: string;
  error?: string;
}

interface Monitor {
  id: string;
  name: string;
  type: 'ping' | 'http';
  url: string;
  interval: number;
  status: 'up' | 'down' | 'pending';
  lastCheck: string | null;
  createdAt: string;
  updatedAt: string;
  checks: MonitorCheck[];
}

export function MonitorDetail() {
  const { monitorId } = useParams<{ monitorId: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedMonitor, setEditedMonitor] = useState<Partial<Monitor> | null>(null);

  const { data: monitor, isLoading } = useQuery<Monitor>({
    queryKey: ['monitor', monitorId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/monitors/${monitorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch monitor');
      }
      return response.json();
    },
  });

  const updateMonitorMutation = useMutation({
    mutationFn: async (data: Partial<Monitor>) => {
      const response = await fetch(`${API_URL}/api/monitors/${monitorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update monitor');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsEditModalOpen(false);
    },
  });

  const deleteMonitorMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/monitors/${monitorId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete monitor');
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

  const chartData = {
    labels: monitor.checks.map((check) =>
      new Date(check.timestamp).toLocaleTimeString()
    ),
    datasets: [
      {
        label: 'Response Time (ms)',
        data: monitor.checks.map((check) => check.responseTime),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Response Time History',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const uptime = monitor.checks.length
    ? (monitor.checks.filter((check) => check.status === 'up').length /
        monitor.checks.length) *
      100
    : 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">{monitor.name}</h1>
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
              if (window.confirm('Are you sure you want to delete this monitor?')) {
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
                monitor.status === 'up'
                  ? 'bg-green-100 text-green-800'
                  : monitor.status === 'down'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {monitor.status.toUpperCase()}
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
            {monitor.checks.length
              ? (
                  monitor.checks.reduce(
                    (acc, check) => acc + check.responseTime,
                    0
                  ) / monitor.checks.length
                ).toFixed(0)
              : 0}{' '}
            ms
          </dd>
        </div>
      </div>

      <div className="mt-8">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <Line options={chartOptions} data={chartData} />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Checks</h2>
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                    >
                      Timestamp
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
                      Response Time
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monitor.checks.map((check) => (
                    <tr key={check.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0">
                        {new Date(check.timestamp).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            check.status === 'up'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {check.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {check.responseTime} ms
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {check.error || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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
                  updateMonitorMutation.mutate(editedMonitor);
                }
              }}
            >
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={editedMonitor.name}
                  onChange={(e) =>
                    setEditedMonitor({ ...editedMonitor, name: e.target.value })
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
                  min="30"
                  value={editedMonitor.interval}
                  onChange={(e) =>
                    setEditedMonitor({
                      ...editedMonitor,
                      interval: parseInt(e.target.value, 10),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="submit"
                  disabled={updateMonitorMutation.isPending}
                  className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:col-start-2"
                >
                  {updateMonitorMutation.isPending ? 'Saving...' : 'Save'}
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