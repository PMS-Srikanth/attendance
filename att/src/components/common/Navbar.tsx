import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, FileUp, Layout, BarChart3, Menu, X, Sparkles, LogOut, User } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Upload', icon: FileUp, color: 'from-violet-500 to-purple-600' },
    { path: '/review', label: 'Review', icon: Layout, color: 'from-blue-500 to-cyan-600' },
    { path: '/planner', label: 'Planner', icon: Calendar, color: 'from-emerald-500 to-teal-600' },
    { path: '/summary', label: 'Summary', icon: BarChart3, color: 'from-orange-500 to-pink-600' },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="sticky top-0 z-50 relative">
      {/* Glassmorphic navbar with animated gradient border */}
      <div className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 p-[2px]">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Logo & Brand */}
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative">
                  {/* Animated gradient ring */}
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 text-white animate-pulse" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-black bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    AttendEase
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Smart Attendance Tracking</p>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2">
                  {navItems.map(({ path, label, icon: Icon, color }) => (
                    <Link
                      key={path}
                      to={path}
                      className="group relative"
                    >
                      {/* Active indicator */}
                      {isActive(path) && (
                        <div className={`absolute inset-0 bg-gradient-to-r ${color} rounded-2xl blur-xl opacity-60 animate-pulse`}></div>
                      )}
                      
                      <div className={`relative flex flex-col items-center px-4 py-2.5 rounded-2xl transition-all duration-300 ${
                        isActive(path)
                          ? `bg-gradient-to-r ${color} text-white shadow-2xl scale-105`
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105'
                      }`}>
                        <Icon size={20} className={`${isActive(path) ? 'animate-bounce' : 'group-hover:scale-110'} transition-transform`} />
                        <span className="text-xs font-bold mt-1">{label}</span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Theme Toggle */}
                <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                  <ThemeToggle />
                </div>

                {/* User Profile Menu */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all group"
                    >
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-cyan flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {(() => {
                              const parts = (user.displayName || '').split(' ').filter(Boolean);
                              const name = parts.length > 1 ? parts[1] : parts[0] || 'U';
                              return name.charAt(0).toUpperCase();
                            })()}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                        {(() => {
                          const parts = (user.displayName || '').split(' ').filter(Boolean);
                          return parts.length > 1 ? parts[1] : parts[0];
                        })()}
                      </span>
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-soft-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {(() => {
                              const parts = (user.displayName || '').split(' ').filter(Boolean);
                              return parts.length > 1 ? parts[1] : parts[0];
                            })()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-danger-600 dark:text-danger-400 font-medium"
                        >
                          <LogOut size={18} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t-2 border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
              <div className="px-4 py-6 space-y-3">
                {/* User Info (Mobile) */}
                {user && (
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-accent-cyan flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {(() => {
                              const parts = (user.displayName || '').split(' ').filter(Boolean);
                              const name = parts.length > 1 ? parts[1] : parts[0] || 'U';
                              return name.charAt(0).toUpperCase();
                            })()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {(() => {
                            const parts = (user.displayName || '').split(' ').filter(Boolean);
                            return parts.length > 1 ? parts[1] : parts[0];
                          })()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-danger-600 text-white rounded-xl font-medium hover:bg-danger-700 transition-colors"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}

                {navItems.map(({ path, label, icon: Icon, color }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group relative block"
                  >
                    {isActive(path) && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${color} rounded-2xl blur-md opacity-50`}></div>
                    )}
                    
                    <div className={`relative flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                      isActive(path)
                        ? `bg-gradient-to-r ${color} text-white shadow-xl`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}>
                      <Icon size={22} className={isActive(path) ? 'animate-pulse' : ''} />
                      <span className="font-bold text-lg">{label}</span>
                    </div>
                  </Link>
                ))}
                
                <div className="pt-4 flex items-center justify-between px-6">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ambient gradient animation below navbar */}
      <div className="absolute top-full left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 animate-pulse opacity-50"></div>
    </nav>
  );
};
