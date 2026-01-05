import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/useAuth';
import Logo from '../Logo';
import { useEffect, useRef, useState } from 'react';

function nameFromEmail(email?: string | null) {
  if (!email) return '';
  const before = email.split('@')[0] || email;
  // replace dots/underscores/dashes with spaces and capitalize
  return before
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function initialsFromName(name?: string | null) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const displayName = user?.fullName ? user.fullName : nameFromEmail(user?.email ?? null);
  const photoUrl = user?.photoURL ?? null;
  const initials = initialsFromName(displayName);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (e.target instanceof Node && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside className="w-64 bg-emerald-800 text-white min-h-screen flex flex-col justify-between">
      <div>
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-10 h-10">
            <Logo className="w-10 h-10" />
          </div>
          <div>
            <div className="font-bold text-lg">U4GreenAFRICA</div>
            <div className="text-xs opacity-80">Real-time monitoring</div>
          </div>
        </div>

        <nav className="px-4 mt-6">
          <ul className="space-y-3">
            <li>
              <Link to="/dashboard" className="block px-3 py-2 rounded hover:bg-emerald-700">Dashboard Overview</Link>
            </li>
            <li>
              <Link to="/analyse" className="block px-3 py-2 rounded hover:bg-emerald-700">Advanced Analytics</Link>
            </li>
            <li>
              <Link to="/predictions" className="block px-3 py-2 rounded hover:bg-emerald-700">AI Predictions & Reports</Link>
            </li>
            <li>
              <Link to="/support" className="block px-3 py-2 rounded hover:bg-emerald-700">Support</Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="px-4 py-6">
        <div className="relative" ref={containerRef}>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-3 focus:outline-none"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt={displayName || 'User'} className="w-full h-full object-cover" />
              ) : initials ? (
                <span className="font-semibold">{initials}</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 0114 0H5z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <div className="font-medium">{displayName || 'User'}</div>
              <div className="text-xs opacity-80">{user?.email ?? ''}</div>
            </div>
          </button>

          {open && (
            <div className="absolute left-0 bottom-full mb-2 w-48 bg-white text-emerald-900 rounded shadow-lg z-50">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/profil');
                }}
                className="w-full text-left px-4 py-2 hover:bg-emerald-50"
              >
                Profile
              </button>
              <button
                onClick={async () => {
                  setOpen(false);
                  await logout();
                  navigate('/auth');
                }}
                className="w-full text-left px-4 py-2 hover:bg-emerald-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
