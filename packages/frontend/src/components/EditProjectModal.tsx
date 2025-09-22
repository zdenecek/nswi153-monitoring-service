import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL;

interface Project {
  id: string;
  label: string;
  description: string;
  tags?: string[];
}

interface ProjectFormState {
  label: string;
  description: string;
  tags: string;
}

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export function EditProjectModal({
  isOpen,
  onClose,
  project,
}: EditProjectModalProps) {
  const [projectForm, setProjectForm] = useState<ProjectFormState>({
    label: "",
    description: "",
    tags: "",
  });
  const [projectFormError, setProjectFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (project && isOpen) {
      setProjectForm({
        label: project.label,
        description: project.description,
        tags: project.tags?.join(", ") ?? "",
      });
      setProjectFormError(null);
    }
  }, [project, isOpen]);

  const updateProjectMutation = useMutation({
    mutationFn: async (payload: {
      label: string;
      description: string;
      tags: string[];
    }) => {
      const response = await fetch(`${API_URL}/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update project");
      }

      return response.json();
    },
    onSuccess: () => {
      setProjectFormError(null);
      onClose();
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: Error) => {
      setProjectFormError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProjectFormError(null);

    const trimmedLabel = projectForm.label.trim();
    const trimmedDescription = projectForm.description.trim();

    if (!trimmedLabel) {
      setProjectFormError("Label is required.");
      return;
    }

    if (!trimmedDescription) {
      setProjectFormError("Description is required.");
      return;
    }

    const tags = projectForm.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    updateProjectMutation.mutate({
      label: trimmedLabel,
      description: trimmedDescription,
      tags,
    });
  };

  const handleClose = () => {
    setProjectFormError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 text-center">
            Edit Project Details
          </h3>

          {projectFormError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {projectFormError}
            </div>
          )}

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="projectLabel"
                className="block text-sm font-medium text-gray-700"
              >
                Label
              </label>
              <input
                id="projectLabel"
                type="text"
                value={projectForm.label}
                onChange={(e) =>
                  setProjectForm((prev) => ({ ...prev, label: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="projectDescription"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="projectDescription"
                rows={3}
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="projectTags"
                className="block text-sm font-medium text-gray-700"
              >
                Tags
              </label>
              <input
                id="projectTags"
                type="text"
                value={projectForm.tags}
                onChange={(e) =>
                  setProjectForm((prev) => ({ ...prev, tags: e.target.value }))
                }
                placeholder="tag-one, tag-two"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Comma-separated list of tags.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProjectMutation.isPending}
                className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:bg-primary-400"
              >
                {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
