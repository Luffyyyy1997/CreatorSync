/** Responsive top navigation bar — glassmorphism + animated hamburger + active highlights. */
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/posts/new', label: 'New Post' },
  { to: '/ai-assistant', label: 'AI Assistant' },
  { to: '/connect-platforms', label: 'Platforms' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'text-white bg-white/20 shadow-inner'
        : 'text-purple-100 hover:text-white hover:bg-white/10'
    }`

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-gradient-to-r from-purple-700/90 via-indigo-700/90 to-blue-700/90 border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">CreatorSync</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* User menu — desktop */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-bold">
                {user?.display_name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-sm text-purple-100">{user?.display_name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-purple-200 hover:text-white font-medium transition-colors px-2 py-1 rounded hover:bg-white/10"
            >
              Logout
            </button>
          </div>

          {/* Hamburger — mobile */}
          <button
            className="md:hidden p-2 rounded-lg text-purple-100 hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <motion.svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              animate={menuOpen ? 'open' : 'closed'}
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </motion.svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/10 bg-gradient-to-b from-indigo-800/95 to-purple-900/95 px-4 pb-4 space-y-1 overflow-hidden"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClass}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm text-purple-200">{user?.display_name}</span>
              <button onClick={handleLogout} className="text-sm text-red-300 hover:text-red-200 font-medium">
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
