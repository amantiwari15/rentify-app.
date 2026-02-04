import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { Navbar } from '../components/Navbar';
import { Plus, MapPin, IndianRupee, Edit, Trash2 } from 'lucide-react';

const Dashboard = ({ user, onLogout }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyProperties();
  }, []);

  const fetchMyProperties = async () => {
    try {
      const response = await axios.get(`${API}/properties/my`);
      setProperties(response.data);
    } catch (error) {
      toast.error('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;

    try {
      await axios.delete(`${API}/properties/${propertyId}`);
      toast.success('Property deleted successfully');
      fetchMyProperties();
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8" data-testid="dashboard-header">
          <h1 className="text-4xl font-bold text-emerald-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            My Properties
          </h1>
          <p className="text-slate-600">Manage all your property listings in one place</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-stone-100 rounded-lg p-6 shadow-sm">
            <div className="text-3xl font-bold text-emerald-900">{properties.length}</div>
            <div className="text-slate-600 mt-1">Total Listings</div>
          </div>
          <div className="bg-white border border-stone-100 rounded-lg p-6 shadow-sm">
            <div className="text-3xl font-bold text-blue-600">
              {properties.filter((p) => p.purpose === 'Rent').length}
            </div>
            <div className="text-slate-600 mt-1">For Rent</div>
          </div>
          <div className="bg-white border border-stone-100 rounded-lg p-6 shadow-sm">
            <div className="text-3xl font-bold text-amber-700">
              {properties.filter((p) => p.purpose === 'Resale').length}
            </div>
            <div className="text-slate-600 mt-1">For Sale</div>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-slate-600">Loading properties...</div>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center" data-testid="dashboard-empty-state">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-2xl font-bold text-emerald-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              No Properties Yet
            </h3>
            <p className="text-slate-600 mb-6">Start by creating your first property listing</p>
            <Link
              to="/create-property"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 font-semibold shadow-lg hover:shadow-blue-500/30 transition-all"
              data-testid="dashboard-create-first-btn"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create First Listing
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="dashboard-properties-grid">
            {properties.map((property) => (
              <div
                key={property.id}
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

                  <div className="flex items-center text-2xl font-bold text-emerald-900 mb-4">
                    <IndianRupee className="h-6 w-6" />
                    {property.price.toLocaleString('en-IN')}
                    {property.purpose === 'Rent' && <span className="text-sm font-normal text-slate-600">/month</span>}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/property/${property.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 font-semibold text-sm text-center transition-all"
                      data-testid={`view-property-${property.id}`}
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleDelete(property.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all"
                      data-testid={`delete-property-${property.id}`}
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;