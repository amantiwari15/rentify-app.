import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { Navbar } from '../components/Navbar';
import { MapPin, IndianRupee, Home, Bed, Bath, Square, Zap } from 'lucide-react';

const PropertyDetail = ({ user, onLogout }) => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await axios.get(`${API}/properties/${id}`);
      setProperty(response.data);
    } catch (error) {
      toast.error('Failed to fetch property details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="text-xl text-slate-600">Loading property details...</div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="text-xl text-slate-600">Property not found</div>
          <Link to="/properties" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            Browse all properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-slate-600">
          <Link to="/" className="hover:text-emerald-900">Home</Link>
          {' '}/{' '}
          <Link to="/properties" className="hover:text-emerald-900">Properties</Link>
          {' '}/{' '}
          <span className="text-emerald-900">{property.property_type}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg" data-testid="property-image-gallery">
              {property.images && property.images.length > 0 ? (
                <>
                  <img
                    src={property.images[currentImageIndex]}
                    alt={property.property_type}
                    className="w-full h-96 object-cover"
                  />
                  {property.images.length > 1 && (
                    <div className="flex space-x-2 p-4 overflow-x-auto">
                      {property.images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${currentImageIndex === index ? 'border-blue-600' : 'border-stone-200'
                            }`}
                        >
                          <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-96 bg-stone-200 flex items-center justify-center">
                  <span className="text-9xl">🏠</span>
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-xl p-8 shadow-lg" data-testid="property-details-section">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${property.purpose === 'Rent'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}
                  >
                    For {property.purpose}
                  </span>
                  <span className="ml-3 text-sm font-medium text-slate-500">{property.category}</span>
                </div>
              </div>

              <h1
                className="text-4xl font-bold text-emerald-900 mb-4"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {property.property_type}
              </h1>

              <div className="flex items-center text-slate-600 mb-6">
                <MapPin className="h-5 w-5 mr-2" />
                {property.address}, {property.locality}, {property.city} - {property.pincode}
              </div>

              {/* Specifications Grid */}
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                {property.bedrooms && (
                  <div className="bg-stone-50 rounded-lg p-4">
                    <Bed className="h-6 w-6 text-emerald-900 mb-2" />
                    <div className="text-2xl font-bold text-emerald-900">{property.bedrooms}</div>
                    <div className="text-sm text-slate-600">Bedrooms</div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="bg-stone-50 rounded-lg p-4">
                    <Bath className="h-6 w-6 text-emerald-900 mb-2" />
                    <div className="text-2xl font-bold text-emerald-900">{property.bathrooms}</div>
                    <div className="text-sm text-slate-600">Bathrooms</div>
                  </div>
                )}
                {property.plot_area_sqft && (
                  <div className="bg-stone-50 rounded-lg p-4">
                    <Square className="h-6 w-6 text-emerald-900 mb-2" />
                    <div className="text-2xl font-bold text-emerald-900">{property.plot_area_sqft}</div>
                    <div className="text-sm text-slate-600">sq.ft</div>
                  </div>
                )}
                {property.power_load_kva && (
                  <div className="bg-stone-50 rounded-lg p-4">
                    <Zap className="h-6 w-6 text-emerald-900 mb-2" />
                    <div className="text-2xl font-bold text-emerald-900">{property.power_load_kva}</div>
                    <div className="text-sm text-slate-600">KVA</div>
                  </div>
                )}
              </div>

              {/* AI Generated Description */}
              {property.ai_description && (
                <div className="border-t border-stone-200 pt-6">
                  <h3 className="text-xl font-bold text-emerald-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Property Description
                  </h3>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                    {property.ai_description}
                  </div>
                </div>
              )}

              {/* Amenities */}
              <div className="border-t border-stone-200 pt-6 mt-6">
                <h3 className="text-xl font-bold text-emerald-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Amenities & Features
                </h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    { key: 'has_lift', label: 'Lift' },
                    { key: 'has_parking', label: 'Parking' },
                    { key: 'has_gym', label: 'Gymnasium' },
                    { key: 'has_pool', label: 'Swimming Pool' },
                    { key: 'near_metro', label: 'Near Metro' },
                    { key: 'has_security', label: '24/7 Security' },
                    { key: 'has_cctv', label: 'CCTV Surveillance' },
                    { key: 'furnishing', label: property.furnishing ? `${property.furnishing}-Furnished` : null },
                  ].map(
                    (amenity, idx) =>
                      property[amenity.key] && (
                        <div key={idx} className="flex items-center text-slate-700">
                          <span className="text-emerald-900 mr-2">✓</span>
                          {amenity.label}
                        </div>
                      )
                  )}
                </div>
              </div>

              {/* Additional Details */}
              {(property.soil_type || property.irrigation_source || property.ceiling_height_ft) && (
                <div className="border-t border-stone-200 pt-6 mt-6">
                  <h3 className="text-xl font-bold text-emerald-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Additional Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {property.soil_type && (
                      <div>
                        <span className="font-semibold text-slate-700">Soil Type:</span>
                        <span className="ml-2 text-slate-600">{property.soil_type}</span>
                      </div>
                    )}
                    {property.irrigation_source && (
                      <div>
                        <span className="font-semibold text-slate-700">Irrigation:</span>
                        <span className="ml-2 text-slate-600">{property.irrigation_source}</span>
                      </div>
                    )}
                    {property.ceiling_height_ft && (
                      <div>
                        <span className="font-semibold text-slate-700">Ceiling Height:</span>
                        <span className="ml-2 text-slate-600">{property.ceiling_height_ft} ft</span>
                      </div>
                    )}
                    {property.floor_number && (
                      <div>
                        <span className="font-semibold text-slate-700">Floor:</span>
                        <span className="ml-2 text-slate-600">
                          {property.floor_number} of {property.total_floors}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Price & Contact */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-8 shadow-lg sticky top-24" data-testid="property-price-card">
              <div className="mb-6">
                <div className="text-sm text-slate-600 mb-2">
                  {property.purpose === 'Rent' ? 'Monthly Rent' : 'Sale Price'}
                </div>
                <div className="flex items-center text-4xl font-bold text-emerald-900">
                  <IndianRupee className="h-8 w-8" />
                  {property.price.toLocaleString('en-IN')}
                </div>
                {property.purpose === 'Rent' && property.deposit && (
                  <div className="text-sm text-slate-600 mt-2">
                    Deposit: ₹{property.deposit.toLocaleString('en-IN')}
                  </div>
                )}
                {property.maintenance && (
                  <div className="text-sm text-slate-600 mt-1">
                    Maintenance: ₹{property.maintenance.toLocaleString('en-IN')}/month
                  </div>
                )}
                {property.negotiable && (
                  <div className="inline-block mt-3 px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                    Negotiable
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-3 border border-blue-100">
                <div className="text-sm text-slate-500 mb-1">Listed by {property.listed_by}</div>
                <div className="font-semibold text-emerald-900 text-lg">{property.contact_name || 'Owner'}</div>
                {property.contact_phone && (
                  <a href={`tel:${property.contact_phone}`} className="flex items-center text-blue-600 font-medium mt-1 hover:text-blue-700">
                    <span className="mr-2">📞</span>
                    {property.contact_phone}
                  </a>
                )}
              </div>

              <button
                className="w-full bg-stone-100 hover:bg-stone-200 text-emerald-900 rounded-full px-6 py-3 font-semibold border border-stone-200 transition-all"
                data-testid="schedule-visit-btn"
                onClick={() => toast.info('Schedule visit feature coming soon!')}
              >
                Schedule Visit
              </button>

              {property.landmark && (
                <div className="mt-6 pt-6 border-t border-stone-200">
                  <div className="text-sm font-semibold text-slate-700 mb-2">Landmark</div>
                  <div className="text-slate-600">{property.landmark}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;