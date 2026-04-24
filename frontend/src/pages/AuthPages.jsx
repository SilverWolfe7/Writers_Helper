import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Feather } from "lucide-react";

const HERO =
  "https://images.unsplash.com/photo-1570626742839-59acd9822944?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODR8MHwxfHNlYXJjaHwyfHx3cml0ZXIlMjBkZXNrJTIwbm90ZWJvb2slMjB2aW50YWdlfGVufDB8fHx8MTc3NzA1OTU1NHww&ixlib=rb-4.1.0&q=85";

function AuthShell({ title, overline, children }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative border-r border-rule overflow-hidden">
        <img
          src={HERO}
          alt="Vintage typewriter on a writer's desk"
          className="w-full h-full object-cover grayscale-[20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-parchment/70 via-transparent to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-ink">
          <div className="overline mb-3">Writer&apos;s Helper · A writer&apos;s dictation studio</div>
          <p className="font-serif text-3xl leading-snug max-w-md">
            "The first draft is just you telling yourself the story."
          </p>
          <p className="overline mt-3">— Terry Pratchett</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-8 md:px-16 py-16 bg-parchment">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="flex items-center gap-3 mb-10">
            <span className="inline-flex items-center justify-center w-8 h-8 border border-ink">
              <Feather className="w-4 h-4" />
            </span>
            <span className="font-serif text-xl">Writer&apos;s Helper</span>
          </div>
          <div className="overline mb-4">{overline}</div>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-10">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (ok) navigate("/");
  };

  return (
    <AuthShell overline="Welcome back" title="The page is waiting.">
      <form onSubmit={onSubmit} className="space-y-6" data-testid="login-form">
        <div>
          <label className="overline block mb-2">Email</label>          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="editorial-input w-full"
            data-testid="login-email-input"
          />
        </div>
        <div>
          <label className="overline block mb-2">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="editorial-input w-full"
            data-testid="login-password-input"
          />
        </div>
        {error && (
          <div className="text-sm text-rust border border-rust/30 bg-rust/5 px-3 py-2" data-testid="login-error">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink text-parchment py-3 text-sm tracking-wide hover:bg-[#383632] transition-colors disabled:opacity-60"
          data-testid="login-submit-button"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <div className="text-sm text-muted2">
          No account yet?{" "}
          <Link to="/register" className="ink-link" data-testid="goto-register-link">
            Start writing →
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register, error } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await register(name, email, password);
    setSubmitting(false);
    if (ok) navigate("/");
  };

  return (
    <AuthShell overline="New here" title="Begin a new manuscript.">
      <form onSubmit={onSubmit} className="space-y-6" data-testid="register-form">
        <div>
          <label className="overline block mb-2">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="editorial-input w-full"
            data-testid="register-name-input"
          />
        </div>
        <div>
          <label className="overline block mb-2">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="editorial-input w-full"
            data-testid="register-email-input"
          />
        </div>
        <div>
          <label className="overline block mb-2">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="editorial-input w-full"
            data-testid="register-password-input"
          />
          <p className="text-xs text-muted2 mt-2">Minimum 6 characters.</p>
        </div>
        {error && (
          <div className="text-sm text-rust border border-rust/30 bg-rust/5 px-3 py-2" data-testid="register-error">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink text-parchment py-3 text-sm tracking-wide hover:bg-[#383632] transition-colors disabled:opacity-60"
          data-testid="register-submit-button"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
        <div className="text-sm text-muted2">
          Already have an account?{" "}
          <Link to="/login" className="ink-link" data-testid="goto-login-link">
            Sign in →
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
