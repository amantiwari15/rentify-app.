import { Link } from 'react-router-dom';
import { Home, Plus, LogOut } from 'lucide-react';

export const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2" data-testid="nav-logo-link">
            <Home className="h-8 w-8 text-emerald-900" />
            <span className="text-2xl font-bold text-emerald-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Rentify
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              to="/properties"
              className="text-slate-600 hover:text-emerald-900 font-medium"
              data-testid="nav-properties-link"
            >
              Browse Properties
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-slate-600 hover:text-emerald-900 font-medium"
                  data-testid="nav-dashboard-link"
                >
                  Dashboard
                </Link>
                <Link
                  to="/create-property"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2.5 font-semibold shadow-lg hover:shadow-blue-500/30 transition-all"
                  data-testid="nav-create-property-btn"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  List Property
                </Link>
                <button
                  onClick={onLogout}
                  className="text-slate-600 hover:text-red-600 p-2"
                  data-testid="nav-logout-btn"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-emerald-900 font-medium"
                  data-testid="nav-login-link"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2.5 font-semibold shadow-lg hover:shadow-blue-500/30 transition-all"
                  data-testid="nav-register-btn"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};