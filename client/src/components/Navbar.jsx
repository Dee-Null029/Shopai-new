import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiUser, FiLogOut, FiShoppingBag, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <FiShoppingBag className="w-7 h-7 text-brand-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              ShopAI
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across Amazon, Flipkart, Myntra..."
                className="input-field pl-10 pr-4"
              />
            </div>
          </form>

          {/* Nav Links */}
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/try-on" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors px-3 py-2">
              3D Try-On
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/admin" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FiUser className="w-4 h-4" />
                  {user.name}
                </div>
                <button onClick={logout} className="text-gray-500 hover:text-red-500 transition-colors">
                  <FiLogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm">Sign In</Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="sm:hidden p-2">
            {mobileOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200 p-4 space-y-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="input-field pl-10"
              />
            </div>
          </form>
          <Link to="/try-on" className="block py-2 text-gray-700" onClick={() => setMobileOpen(false)}>3D Try-On</Link>
          {user ? (
            <>
              <Link to="/admin" className="block py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <button onClick={() => { logout(); setMobileOpen(false); }} className="text-red-500 py-2">Logout</button>
            </>
          ) : (
            <Link to="/login" className="block btn-primary text-center" onClick={() => setMobileOpen(false)}>Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}
