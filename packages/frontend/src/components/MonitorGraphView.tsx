import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface MonitorCheck {
  id: string;
  status: "up" | "down";
  responseTime: number;
  timestamp: string;
  error?: string;
}

interface MonitorGraphViewProps {
  checks: MonitorCheck[];
}

export function MonitorGraphView({ checks }: MonitorGraphViewProps) {
  const chartData = {
    labels: checks.map((check) =>
      new Date(check.timestamp).toLocaleTimeString(),
    ),
    datasets: [
      {
        label: "Response Time (ms)",
        data: checks.map((check) => check.responseTime),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Response Time History",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Response Time (ms)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Time",
        },
      },
    },
  };

  if (checks.length === 0) {
    return (
      <div className="mt-8">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6 text-center text-gray-500">
            <p>No data available for chart visualization</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <Line options={chartOptions} data={chartData} />
        </div>
      </div>
    </div>
  );
}
