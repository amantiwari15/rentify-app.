import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { Navbar } from '../components/Navbar';
import { MapPin, IndianRupee, Search, Filter } from 'lucide-react';

const AllProperties = ({ user, onLogout }) => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    purpose: '',
    category: '',
    searchTerm: '',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, properties]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${API}/properties`);
      setProperties(response.data);
      setFilteredProperties(response.data);
    } catch (error) {
      toast.error('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    if (filters.purpose) {
      filtered = filtered.filter((p) => p.purpose === filters.purpose);
    }

    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.city.toLowerCase().includes(term) ||
          p.locality.toLowerCase().includes(term) ||
          p.property_type.toLowerCase().includes(term)
      );
    }

    setFilteredProperties(filtered);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8" data-testid="all-properties-header">
          <h1 className="text-4xl font-bold text-emerald-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Browse Properties
          </h1>
          <p className="text-slate-600">Discover your perfect property from our curated listings</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8" data-testid="filters-section">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by city, locality, or property type..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 pl-12 pr-4 transition-all"
                  data-testid="search-input"
                />
              </div>
            </div>

            <div>
              <select
                value={filters.purpose}
                onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}
                className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                data-testid="purpose-filter"
              >
                <option value="">All Purposes</option>
                <option value="Rent">For Rent</option>
                <option value="Resale">For Sale</option>
              </select>
            </div>

            <div>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                data-testid="category-filter"
              >
                <option value="">All Categories</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Institutional">Institutional</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-slate-600">
              Showing {filteredProperties.length} of {properties.length} properties
            </div>
            {(filters.purpose || filters.category || filters.searchTerm) && (
              <button
                onClick={() => setFilters({ purpose: '', category: '', searchTerm: '' })}
                className="text-blue-600 hover:text-blue-700 font-medium"
                data-testid="clear-filters-btn"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-slate-600">Loading properties...</div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center" data-testid="no-properties-state">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-emerald-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              No Properties Found
            </h3>
            <p className="text-slate-600 mb-6">Try adjusting your filters to see more results</p>
            {(filters.purpose || filters.category || filters.searchTerm) && (
              <button
                onClick={() => setFilters({ purpose: '', category: '', searchTerm: '' })}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 font-semibold shadow-lg hover:shadow-blue-500/30 transition-all"
                data-testid="reset-filters-btn"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="all-properties-grid">
            {filteredProperties.map((property) => (
              <Link
                key={property.id}
                to={`/property/${property.id}`}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-xl transition-all property-card"
                data-testid={`property-card-${property.id}`}
              >
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.property_type}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-stone-200 flex items-center justify-center">
                    <span className="text-6xl">🏡</span>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        property.purpose === 'Rent'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {property.purpose}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{property.category}</span>
                  </div>

                  <h3 className="text-xl font-bold text-emerald-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {property.property_type}
                  </h3>

                  <div className="flex items-center text-slate-600 text-sm mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.locality}, {property.city}
                  </div>

                  {property.bedrooms && (
                    <div className="text-sm text-slate-600 mb-3">
                      {property.bedrooms} BHK {property.bathrooms && `• ${property.bathrooms} Bath`}
                    </div>
                  )}

                  <div className="flex items-center text-2xl font-bold text-emerald-900">
                    <IndianRupee className="h-6 w-6" />
                    {property.price.toLocaleString('en-IN')}
                    {property.purpose === 'Rent' && <span className="text-sm font-normal text-slate-600">/month</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllProperties;