import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Welcome to Yet Another Monitoring Service
      </h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        A modern monitoring service demo for the Advanced Web Applications course at Charles University.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link
          to="/projects"
          className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Get Started
        </Link>
      <a
        href="https://gitlab.mff.cuni.cz/teaching/nswi153/2024-25/team-008"
        target="_blank"
        rel="noopener noreferrer"
        className="relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-3xl hover:from-orange-400 hover:via-red-400 hover:to-pink-400 focus:outline-none focus:ring-4 focus:ring-orange-300 animate-pulse hover:animate-none active:scale-95 overflow-hidden group"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
        <span className="relative z-10 flex items-center gap-2 animate-bounce">
          View on GitLab 
        </span>
        <span className="absolute inset-0 bg-white opacity-20 blur-sm rounded-full animate-ping"></span>
      </a>

      </div>
    </div>
  );
} 