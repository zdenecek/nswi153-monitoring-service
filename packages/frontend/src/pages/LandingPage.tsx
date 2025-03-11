import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Welcome to Monitoring Service
      </h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        A modern monitoring service that helps you track the status of your services and endpoints.
        Monitor your infrastructure with ease using our powerful monitoring tools.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link
          to="/projects"
          className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Get Started
        </Link>
        <a
          href="https://github.com/yourusername/monitoring-service"
          className="text-sm font-semibold leading-6 text-gray-900"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub <span aria-hidden="true">→</span>
        </a>
      </div>

      <div className="mt-20">
        <h2 className="text-2xl font-bold text-gray-900">Features</h2>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Project Management</h3>
            <p className="mt-2 text-gray-600">
              Organize your monitors into projects with labels, descriptions, and tags.
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Multiple Monitor Types</h3>
            <p className="mt-2 text-gray-600">
              Support for various monitor types including ping and website monitoring.
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Real-time Monitoring</h3>
            <p className="mt-2 text-gray-600">
              Monitor your services in real-time with configurable check intervals.
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Visualization</h3>
            <p className="mt-2 text-gray-600">
              View monitoring results in various formats: list, calendar, and graph views.
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">API Support</h3>
            <p className="mt-2 text-gray-600">
              Access your monitoring data through RESTful API and GraphQL endpoints.
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Status Badges</h3>
            <p className="mt-2 text-gray-600">
              Share your service status with customizable status badges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 