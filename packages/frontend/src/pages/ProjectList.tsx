import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { PlusIcon } from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 9;

interface Project {
  id: string;
  label: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function ProjectList() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ label: '', description: '', tags: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ label: '', tags: '' });
  const [appliedFilters, setAppliedFilters] = useState({ label: '', tags: '' });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const {
    data: projectsResponse,
    isLoading,
    isFetching,
    error,
  } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects', { page, sortOrder, label: appliedFilters.label, tags: appliedFilters.tags }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', PAGE_SIZE.toString());

      if (appliedFilters.label.trim()) {
        params.set('label', appliedFilters.label.trim());
      }

      const tags = appliedFilters.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      tags.forEach((tag) => params.append('tags', tag));

      params.set('sortBy', 'label');
      params.set('sortOrder', sortOrder);

      const response = await fetch(`${API_URL}/api/projects?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!projectsResponse) {
      return;
    }

    const calculatedTotalPages = Math.max(
      1,
      Math.ceil(projectsResponse.total / (projectsResponse.pageSize || PAGE_SIZE)),
    );

    if (page > calculatedTotalPages) {
      setPage(calculatedTotalPages);
    }
  }, [projectsResponse, page]);

  const projects = projectsResponse?.data ?? [];
  const totalItems = projectsResponse?.total ?? 0;
  const totalPages = projectsResponse
    ? Math.max(1, Math.ceil(projectsResponse.total / (projectsResponse.pageSize || PAGE_SIZE)))
    : 1;

  const createProjectMutation = useMutation({
    mutationFn: async (project: { label: string; description: string; tags: string }) => {
      const payload = {
        label: project.label,
        description: project.description,
        tags: project.tags
          ? project.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      };
      const response = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create project' }));
        throw new Error(errorData.error || 'Failed to create project');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewProject({ label: '', description: '', tags: '' });
      setFormError(null);
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => {
        // Best effort; errors are surfaced via React Query
      });
    },
    onError: (mutationError: Error) => {
      setFormError(mutationError.message);
    },
  });


  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({ ...filters });
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ label: '', tags: '' });
    setAppliedFilters({ label: '', tags: '' });
    setPage(1);
  };


  if (isLoading && !projectsResponse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const queryError = error instanceof Error ? error.message : null;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all your monitoring projects.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setIsCreateModalOpen(true);
              setFormError(null);
            }}
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New Project
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
        <form onSubmit={handleApplyFilters} className="grid gap-4 sm:grid-cols-5 sm:items-end">
          <div className="sm:col-span-2">
            <label htmlFor="filter-label" className="block text-sm font-medium text-gray-700">
              Filter by label
            </label>
            <input
              id="filter-label"
              name="label"
              type="text"
              value={filters.label}
              onChange={(event) => setFilters((prev) => ({ ...prev, label: event.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Search by label"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="filter-tags" className="block text-sm font-medium text-gray-700">
              Filter by tags (comma-separated)
            </label>
            <input
              id="filter-tags"
              name="tags"
              type="text"
              value={filters.tags}
              onChange={(event) => setFilters((prev) => ({ ...prev, tags: event.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="uptime, critical"
            />
          </div>
          <div>
            <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700">
              Sort by label
            </label>
            <select
              id="sort-order"
              name="sortOrder"
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value as 'asc' | 'desc');
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="asc">A to Z</option>
              <option value="desc">Z to A</option>
            </select>
          </div>
          <div className="sm:col-span-5 flex gap-2 sm:justify-end">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {queryError && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{queryError}</p>
        </div>
      )}

      {isFetching && !isLoading && (
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600"></div>
          Updating projects…
        </div>
      )}

      {projects.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500">No projects found. Adjust your filters or create a new project.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="relative flex items-start space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{project.label}</p>
                    <p className="mt-1 text-sm text-gray-500 truncate">{project.description}</p>
                  </div>
                </div>
                {project.tags && project.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-gray-600">
          Showing page {totalPages === 0 ? 0 : page} of {totalPages}. Total projects: {totalItems}.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || totalItems === 0}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white px-4 pt-5 pb-4 shadow-xl sm:p-6 sm:pb-4">
            <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900">Create New Project</h3>

            {formError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
                <p className="text-sm font-medium">Error: {formError}</p>
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setFormError(null);

                if (!newProject.label.trim()) {
                  setFormError('Project name is required');
                  return;
                }

                if (!newProject.description.trim()) {
                  setFormError('Project description is required');
                  return;
                }

                createProjectMutation.mutate(newProject);
              }}
            >
              <div className="mb-4">
                <label htmlFor="label" className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="label"
                  id="label"
                  value={newProject.label}
                  onChange={(event) => setNewProject({ ...newProject, label: event.target.value })}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 sm:text-sm ${
                    formError && !newProject.label.trim()
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-primary-500'
                  }`}
                  placeholder="Enter project name"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={newProject.description}
                  onChange={(event) => setNewProject({ ...newProject, description: event.target.value })}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 sm:text-sm ${
                    formError && !newProject.description.trim()
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-primary-500'
                  }`}
                  placeholder="Enter project description"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  id="tags"
                  value={newProject.tags}
                  onChange={(event) => setNewProject({ ...newProject, tags: event.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="e.g. uptime, critical, website"
                />
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:col-start-2"
                >
                  {createProjectMutation.isPending ? 'Creating…' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setFormError(null);
                    setNewProject({ label: '', description: '', tags: '' });
                  }}
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
