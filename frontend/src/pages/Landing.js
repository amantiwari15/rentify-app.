import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

const Landing = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-stone-100">
      <Navbar user={user} onLogout={onLogout} />

      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden" data-testid="hero-section">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1766603636562-531bb3e1dda8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBsdXh1cnklMjBob21lJTIwZXh0ZXJpb3IlMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzcwMjMyNTQ2fDA&ixlib=rb-4.1.0&q=85)',
          }}
        />
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl animate-fadeInUp">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Find Your Perfect Property with AI-Powered Listings
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8">
              Premium property listings with intelligent descriptions. Rent or buy your dream space today.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to={user ? '/create-property' : '/register'}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 font-semibold shadow-lg hover:shadow-blue-500/30 transition-all inline-block"
                data-testid="hero-cta-btn"
              >
                {user ? 'List Your Property' : 'Get Started Free'}
              </Link>
              <Link
                to="/properties"
                className="bg-white hover:bg-stone-100 text-emerald-900 rounded-full px-8 py-3 font-semibold border border-white transition-all inline-block"
                data-testid="hero-browse-btn"
              >
                Browse Properties
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-4xl sm:text-5xl font-bold text-emerald-900 mb-4"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Why Choose Rentify?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Experience the future of property listings with our AI-powered platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-stone-50 rounded-xl p-8 hover-lift" data-testid="feature-card-ai">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-2xl font-bold text-emerald-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                AI-Generated Descriptions
              </h3>
              <p className="text-slate-600">
                Get professional, SEO-optimized property descriptions powered by Claude AI
              </p>
            </div>

            <div className="bg-stone-50 rounded-xl p-8 hover-lift" data-testid="feature-card-dynamic">
              <div className="w-16 h-16 bg-amber-700 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-2xl font-bold text-emerald-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Smart Dynamic Forms
              </h3>
              <p className="text-slate-600">
                Intelligent forms that adapt based on your property type - residential, commercial, agricultural & more
              </p>
            </div>

            <div className="bg-stone-50 rounded-xl p-8 hover-lift" data-testid="feature-card-manage">
              <div className="w-16 h-16 bg-emerald-900 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-emerald-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Easy Management
              </h3>
              <p className="text-slate-600">
                Manage all your property listings from one simple dashboard. Edit, update, or delete anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-emerald-900" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-4xl sm:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Ready to List Your Property?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of landlords and brokers using Rentify to reach more buyers and renters
          </p>
          <Link
            to={user ? '/create-property' : '/register'}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 py-4 font-semibold text-lg shadow-lg hover:shadow-blue-500/30 transition-all inline-block"
            data-testid="cta-action-btn"
          >
            {user ? 'Create Your First Listing' : 'Start Free Today'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600">
          <p>&copy; 2025 Rentify. Built with FastAPI, React & Claude AI.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;