import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Feather, LogOut, Settings } from "lucide-react";
import MicStatusIndicator from "./MicStatusIndicator";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header
      className="sticky top-0 z-30 bg-parchment border-b border-rule"
      data-testid="app-header"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group" data-testid="brand-link">
          <span className="inline-flex items-center justify-center w-8 h-8 border border-ink">
            <Feather className="w-4 h-4 text-ink" />
          </span>
          <span className="font-serif text-xl tracking-tight">Writer&apos;s Helper</span>
        </Link>
        <div className="flex items-center gap-6">
          {user && user !== false && (
            <>
              <span
                className="overline hidden sm:inline max-w-[200px] truncate"
                data-testid="header-user-email"
                title={user.email}
              >
                {user.email}
              </span>
              <MicStatusIndicator />
              <Link
                to="/setup"
                className="inline-flex items-center gap-2 text-sm text-ink hover:text-rust transition-colors"
                data-testid="header-setup-link"
              >
                <Settings className="w-4 h-4" /> Setup
              </Link>
              <button
                onClick={doLogout}
                className="inline-flex items-center gap-2 text-sm text-ink hover:text-rust transition-colors"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
