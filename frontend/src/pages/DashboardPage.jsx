import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiError } from "../lib/api";
import AppHeader from "../components/AppHeader";
import { Plus, BookOpen, Mic, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/projects");
      setProjects(data);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail, "Failed to load projects"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const { data } = await api.post("/projects", { title, genre, description });
      setProjects((p) => [data, ...p]);
      setTitle("");
      setGenre("");
      setDescription("");
      setCreating(false);
      toast.success("Project created");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail, "Failed to create project"));
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this project and all its notes? This cannot be undone.")) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((p) => p.filter((x) => x.id !== id));
      toast.success("Project deleted");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail, "Failed to delete"));
    }
  };

  return (
    <div className="min-h-screen bg-parchment">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 md:px-10 py-16">
        <div className="flex items-end justify-between gap-6 mb-12">
          <div>
            <div className="overline mb-3">Your writing desk</div>
            <h1 className="font-serif text-4xl md:text-5xl tracking-tight max-w-2xl">
              Every idea deserves a page of its own.
            </h1>
          </div>
          <button
            onClick={() => setCreating((v) => !v)}
            className="inline-flex items-center gap-2 bg-ink text-parchment px-5 py-3 text-sm hover:bg-[#383632] transition-colors"
            data-testid="new-project-button"
          >
            <Plus className="w-4 h-4" /> {creating ? "Close" : "New project"}
          </button>
        </div>

        {creating && (
          <form
            onSubmit={create}
            className="mb-14 border border-rule p-6 md:p-8 bg-parchment-2 animate-fade-up"
            data-testid="new-project-form"
          >
            <div className="overline mb-5">Start a new project</div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="overline block mb-2">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="editorial-input w-full"
                  placeholder="The Hollow Lantern"
                  required
                  data-testid="project-title-input"
                />
              </div>
              <div>
                <label className="overline block mb-2">Genre</label>
                <input
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="editorial-input w-full"
                  placeholder="Gothic Mystery"
                  data-testid="project-genre-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="overline block mb-2">Logline / Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="editorial-input w-full resize-none"
                  placeholder="A widowed cartographer inherits a house that rearranges its rooms each night."
                  data-testid="project-description-input"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                className="bg-ink text-parchment px-5 py-2.5 text-sm hover:bg-[#383632] transition-colors"
                data-testid="project-create-submit"
              >
                Create project
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="text-sm text-muted2 hover:text-ink transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="overline">Loading projects…</div>
        ) : projects.length === 0 ? (
          <div className="border border-rule p-14 text-center" data-testid="empty-projects">
            <BookOpen className="w-6 h-6 mx-auto text-muted2" />
            <p className="font-serif text-2xl mt-4">No projects yet.</p>
            <p className="text-muted2 mt-2 text-sm">Start a project above to begin dictating notes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
            {projects.map((p) => (
              <div
                key={p.id}
                className="group border border-rule bg-parchment-2 p-6 flex flex-col justify-between min-h-[200px]"
                data-testid={`project-card-${p.id}`}
              >
                <div>
                  <div className="overline text-rust mb-3">{p.genre || "Project"}</div>
                  <Link to={`/projects/${p.id}`} className="font-serif text-2xl tracking-tight hover:text-rust transition-colors">
                    {p.title}
                  </Link>
                  {p.description && (
                    <p className="text-sm text-muted2 mt-3 leading-relaxed line-clamp-3">{p.description}</p>
                  )}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <Link
                    to={`/projects/${p.id}/dictate`}
                    className="inline-flex items-center gap-2 text-sm hover:text-rust transition-colors"
                    data-testid={`project-dictate-${p.id}`}
                  >
                    <Mic className="w-4 h-4" /> Dictate
                  </Link>
                  <button
                    onClick={() => del(p.id)}
                    className="text-muted2 hover:text-rust transition-colors"
                    aria-label="Delete project"
                    data-testid={`project-delete-${p.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
