import { useState } from 'react';
import { MonitorGraphView } from './MonitorGraphView';
import { MonitorHistoryView } from './MonitorHistoryView';

interface MonitorCheck {
  id: string;
  status: 'up' | 'down';
  responseTime: number;
  timestamp: string;
  error?: string;
}

interface MonitorChartViewProps {
  checks: MonitorCheck[];
}

export function MonitorChartView({ checks }: MonitorChartViewProps) {
  const [chartMode, setChartMode] = useState<'graph' | 'history'>('graph');

  return (
    <div className="mt-8">
      {/* Chart Mode Toggle */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setChartMode('graph')}
            className={`px-4 py-2 text-sm font-medium border rounded-l-lg focus:z-10 focus:ring-2 focus:ring-blue-500 ${
              chartMode === 'graph'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Graph
          </button>
          <button
            type="button"
            onClick={() => setChartMode('history')}
            className={`px-4 py-2 text-sm font-medium border rounded-r-lg focus:z-10 focus:ring-2 focus:ring-blue-500 ${
              chartMode === 'history'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Render the selected chart mode */}
      {chartMode === 'graph' ? (
        <MonitorGraphView checks={checks} />
      ) : (
        <MonitorHistoryView checks={checks} />
      )}
    </div>
  );
}
