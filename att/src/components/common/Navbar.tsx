import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, FileUp, Layout, BarChart3, Menu, X, Sparkles, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Upload', icon: FileUp },
    { path: '/review', label: 'Review', icon: Layout },
    { path: '/planner', label: 'Planner', icon: Calendar },
    { path: '/summary', label: 'Summary', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
};

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex-col border-r border-gray-200/70 dark:border-gray-800/70 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl z-40">
        <div className="p-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                AttendEase
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Attendance planner</p>
            </div>
          </Link>
        </div>

        <div className="px-3 pb-4">
          <nav className="space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} className="block">
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive(path)
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={18} className="opacity-90" />
                  <span className="text-sm font-semibold">{label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 space-y-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-100/70 dark:bg-gray-800/70">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Theme</span>
            <ThemeToggle />
          </div>

          {user && (
            <div className="px-3 py-3 rounded-xl bg-gray-100/70 dark:bg-gray-800/70">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-danger-600 text-white rounded-xl font-medium hover:bg-danger-700 transition-colors"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-50 border-b border-gray-200/70 dark:border-gray-800/70 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl">
        <div className="px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black text-gray-900 dark:text-white">AttendEase</span>
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-200/70 dark:border-gray-800/70 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
            <div className="px-4 py-5 space-y-3">
              {user && (
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.displayName || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  <button
                    onClick={handleLogout}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-danger-600 text-white rounded-xl font-medium hover:bg-danger-700 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block"
                  >
                    <div
                      className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${
                        isActive(path)
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon size={20} className="opacity-90" />
                      <span className="font-semibold">{label}</span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between px-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

};
