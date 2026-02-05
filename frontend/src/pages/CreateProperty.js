import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { Navbar } from '../components/Navbar';
import { Upload, X, Loader2 } from 'lucide-react';

// Property type mappings
const PROPERTY_TYPES = {
  Residential: ['Apartment', 'Villa', 'Penthouse', 'Studio', 'Residential Plot', 'Independent House'],
  Commercial: ['Office Space', 'Retail Shop', 'Commercial Plot', 'Showroom', 'Warehouse'],
  Industrial: ['Factory', 'Industrial Shed', 'Industrial Plot', 'Manufacturing Unit'],
  Agricultural: ['Farm Land', 'Orchard', 'Agricultural Plot'],
  Institutional: ['School', 'Hospital', 'College', 'Government Building'],
  'PG/Co-living': ['Boys PG', 'Girls PG', 'Co-living', 'Student Housing'],
};

const PLOT_KEYWORDS = ['Plot', 'Land', 'Farm'];

const CreateProperty = ({ user, onLogout }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    purpose: 'Rent',
    category: 'Residential',
    property_type: 'Apartment',
    is_plot: false,
    city: '',
    locality: '',
    pincode: '',
    landmark: '',
    address: '',
    bedrooms: '',
    bathrooms: '',
    floor_number: '',
    total_floors: '',
    furnishing: 'None',
    power_load_kva: '',
    ceiling_height_ft: '',
    conference_rooms: '',
    plot_area_sqft: '',
    plot_area_acres: '',
    soil_type: '',
    irrigation_source: '',
    boundary_wall: false,
    price: '',
    deposit: '',
    maintenance: '',
    negotiable: false,
    has_lift: false,
    has_parking: false,
    has_gym: false,
    has_pool: false,
    near_metro: false,
    has_security: false,
    has_cctv: false,
    has_wifi: false,
    has_ac: false,
    has_geyser: false,
    has_video_doorbell: false,
    has_fire_safety: false,
    has_intercom: false,
    tenant_preference: 'Any',
    listed_by: 'Owner',
    contact_name: user?.name || '',
    contact_phone: user?.phone || '',
    images: [],
  });

  const [imageFiles, setImageFiles] = useState([]);

  // Check if property type is a plot
  const isPlot = PLOT_KEYWORDS.some((keyword) => formData.property_type.includes(keyword));

  // Handle dropzone
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxSize: 5242880, // 5MB
    onDrop: async (acceptedFiles) => {
      const uploadedImages = [];

      for (const file of acceptedFiles) {
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('file', file);

          const response = await axios.post(`${API}/upload-image`, formDataUpload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          uploadedImages.push(response.data.image_url);
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      setFormData({ ...formData, images: [...formData.images, ...uploadedImages] });
      setImageFiles([...imageFiles, ...acceptedFiles]);
    },
  });

  const removeImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data
      const submitData = {
        ...formData,
        is_plot: isPlot,
        price: parseFloat(formData.price),
        deposit: formData.deposit ? parseFloat(formData.deposit) : null,
        maintenance: formData.maintenance ? parseFloat(formData.maintenance) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
        total_floors: formData.total_floors ? parseInt(formData.total_floors) : null,
        power_load_kva: formData.power_load_kva ? parseInt(formData.power_load_kva) : null,
        ceiling_height_ft: formData.ceiling_height_ft ? parseFloat(formData.ceiling_height_ft) : null,
        conference_rooms: formData.conference_rooms ? parseInt(formData.conference_rooms) : null,
        plot_area_sqft: formData.plot_area_sqft ? parseFloat(formData.plot_area_sqft) : null,
        plot_area_acres: formData.plot_area_acres ? parseFloat(formData.plot_area_acres) : null,
      };

      const response = await axios.post(`${API}/properties`, submitData);
      toast.success('Property listed successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8" data-testid="create-property-header">
          <h1 className="text-4xl font-bold text-emerald-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            List Your Property
          </h1>
          <p className="text-slate-600">Create a new property listing with AI-generated description</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center space-x-4">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= num ? 'bg-blue-600 text-white' : 'bg-stone-200 text-slate-600'
                  }`}
                data-testid={`step-indicator-${num}`}
              >
                {num}
              </div>
              {num < 4 && <div className={`w-16 h-1 ${step > num ? 'bg-blue-600' : 'bg-stone-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Step 1: Basic Configuration */}
            {step === 1 && (
              <div className="space-y-6" data-testid="step-1-basic-config">
                <h2 className="text-2xl font-bold text-emerald-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Basic Configuration
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Purpose <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                      data-testid="purpose-select"
                    >
                      <option value="Rent">Rent</option>
                      <option value="Resale">Resale</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => {
                        const newCategory = e.target.value;
                        setFormData({
                          ...formData,
                          category: newCategory,
                          property_type: PROPERTY_TYPES[newCategory][0],
                        });
                      }}
                      className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                      data-testid="category-select"
                    >
                      {Object.keys(PROPERTY_TYPES).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Property Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.property_type}
                      onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                      className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                      data-testid="property-type-select"
                    >
                      {PROPERTY_TYPES[formData.category].map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tenant Preference
                    </label>
                    <select
                      value={formData.tenant_preference}
                      onChange={(e) => setFormData({ ...formData, tenant_preference: e.target.value })}
                      className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                      data-testid="tenant-preference-select"
                    >
                      <option value="Any">Any</option>
                      <option value="Family">Family</option>
                      <option value="Bachelor">Bachelor</option>
                      <option value="Students">Students</option>
                      <option value="Company Lease">Company Lease</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Listed By
                    </label>
                    <div className="flex space-x-4">
                      {['Owner', 'Broker', 'Builder'].map((type) => (
                        <label key={type} className="flex items-center space-x-2 cursor-pointer bg-stone-50 px-4 py-3 rounded-md border border-stone-200">
                          <input
                            type="radio"
                            name="listed_by"
                            value={type}
                            checked={formData.listed_by === type}
                            onChange={(e) => setFormData({ ...formData, listed_by: e.target.value })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-slate-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 grid md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center">
                        Contact Details
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Contact Name</label>
                      <input
                        type="text"
                        required
                        value={formData.contact_name}
                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                        className="w-full bg-white border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4"
                        placeholder="Name of contact person"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        required
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        className="w-full bg-white border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 font-semibold shadow-lg hover:shadow-blue-500/30 transition-all"
                  data-testid="step-1-next-btn"
                >
                  Next: Location Details
                </button>
              </div>
            )}

            {/* Step 2: Location & Specifications */}
            {step === 2 && (
              <div className="space-y-6" data-testid="step-2-location-specs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-emerald-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Location & Specifications
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                    data-testid="step-2-back-btn"
                  >
                    ← Back
                  </button>
                </div>

                {/* Location */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                      placeholder="Mumbai"
                      data-testid="city-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Locality <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                      className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                      placeholder="Bandra West"
                      data-testid="locality-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                      placeholder="400050"
                      data-testid="pincode-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Landmark</label>
                    <input
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                      placeholder="Near Metro Station"
                      data-testid="landmark-input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md px-4 py-3 transition-all"
                      rows={3}
                      placeholder="Complete address..."
                      data-testid="address-input"
                    />
                  </div>
                </div>

                {/* Dynamic Specifications based on property type */}
                {!isPlot && (
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="text-lg font-semibold text-emerald-900 mb-4">Building Specifications</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Bedrooms (BHK)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.bedrooms}
                          onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                          className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                          placeholder="3"
                          data-testid="bedrooms-input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Bathrooms</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.bathrooms}
                          onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                          className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                          placeholder="2"
                          data-testid="bathrooms-input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Floor Number</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.floor_number}
                          onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })}
                          className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                          placeholder="5"
                          data-testid="floor-number-input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Total Floors</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.total_floors}
                          onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })}
                          className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                          placeholder="10"
                          data-testid="total-floors-input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Furnishing</label>
                        <select
                          value={formData.furnishing}
                          onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                          className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                          data-testid="furnishing-select"
                        >
                          <option value="None">Unfurnished</option>
                          <option value="Semi">Semi-Furnished</option>
                          <option value="Full">Fully-Furnished</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Commercial/Industrial Specifications */}
                {(formData.category === 'Commercial' || formData.category === 'Industrial') && (
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="text-lg font-semibold text-emerald-900 mb-4">
                      {formData.category} Specifications
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Power Load (KVA)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.power_load_kva}
                          onChange={(e) => setFormData({ ...formData, power_load_kva: e.target.value })}
                          className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                          placeholder="100"
                          data-testid="power-load-input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ceiling Height (ft)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.ceiling_height_ft}
                          onChange={(e) => setFormData({ ...formData, ceiling_height_ft: e.target.value })}
                          className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                          placeholder="15"
                          data-testid="ceiling-height-input"
                        />
                      </div>

                      {formData.category === 'Commercial' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Conference Rooms</label>
                          <input
                            type="number"
                            min="0"
                            value={formData.conference_rooms}
                            onChange={(e) => setFormData({ ...formData, conference_rooms: e.target.value })}
                            className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                            placeholder="2"
                            data-testid="conference-rooms-input"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Land/Agricultural Specifications */}
                {(isPlot || formData.category === 'Agricultural') && (
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="text-lg font-semibold text-emerald-900 mb-4">Land Specifications</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Plot Area (sq.ft) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={formData.plot_area_sqft}
                          onChange={(e) => setFormData({ ...formData, plot_area_sqft: e.target.value })}
                          className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                          placeholder="5000"
                          data-testid="plot-area-sqft-input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Plot Area (Acres)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.plot_area_acres}
                          onChange={(e) => setFormData({ ...formData, plot_area_acres: e.target.value })}
                          className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                          placeholder="0.5"
                          data-testid="plot-area-acres-input"
                        />
                      </div>

                      {formData.category === 'Agricultural' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Soil Type</label>
                            <select
                              value={formData.soil_type}
                              onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                              className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                              data-testid="soil-type-select"
                            >
                              <option value="">Select Soil Type</option>
                              <option value="Black">Black Soil</option>
                              <option value="Red">Red Soil</option>
                              <option value="Alluvial">Alluvial Soil</option>
                              <option value="Clay">Clay Soil</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Irrigation Source</label>
                            <select
                              value={formData.irrigation_source}
                              onChange={(e) => setFormData({ ...formData, irrigation_source: e.target.value })}
                              className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                              data-testid="irrigation-source-select"
                            >
                              <option value="">Select Irrigation Source</option>
                              <option value="Canal">Canal</option>
                              <option value="Borewell">Borewell</option>
                              <option value="River">River</option>
                              <option value="Rainwater">Rainwater</option>
                            </select>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.boundary_wall}
                              onChange={(e) => setFormData({ ...formData, boundary_wall: e.target.checked })}
                              className="h-5 w-5 text-blue-600 rounded"
                              data-testid="boundary-wall-checkbox"
                            />
                            <label className="ml-2 text-sm font-medium text-slate-700">Has Boundary Wall</label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 font-semibold shadow-lg hover:shadow-blue-500/30 transition-all"
                  data-testid="step-2-next-btn"
                >
                  Next: Pricing & Amenities
                </button>
              </div>
            )}

            {/* Step 3: Pricing & Amenities */}
            {step === 3 && (
              <div className="space-y-6" data-testid="step-3-pricing-amenities">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-emerald-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Pricing & Amenities
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                    data-testid="step-3-back-btn"
                  >
                    ← Back
                  </button>
                </div>

                {/* Pricing */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {formData.purpose === 'Rent' ? 'Monthly Rent' : 'Sale Price'} (₹){' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                      placeholder="50000"
                      data-testid="price-input"
                    />
                  </div>

                  {formData.purpose === 'Rent' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Security Deposit (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.deposit}
                        onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                        className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                        placeholder="100000"
                        data-testid="deposit-input"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Maintenance (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maintenance}
                      onChange={(e) => setFormData({ ...formData, maintenance: e.target.value })}
                      className="w-full bg-stone-50 border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md h-12 px-4 transition-all"
                      placeholder="5000"
                      data-testid="maintenance-input"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.negotiable}
                      onChange={(e) => setFormData({ ...formData, negotiable: e.target.checked })}
                      className="h-5 w-5 text-blue-600 rounded"
                      data-testid="negotiable-checkbox"
                    />
                    <label className="ml-2 text-sm font-medium text-slate-700">Price Negotiable</label>
                  </div>
                </div>

                {/* Amenities */}
                <div className="border-t border-stone-200 pt-6">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-4">Amenities</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { key: 'has_lift', label: 'Lift', testid: 'has-lift-checkbox' },
                      { key: 'has_parking', label: 'Parking', testid: 'has-parking-checkbox' },
                      { key: 'has_gym', label: 'Gymnasium', testid: 'has-gym-checkbox' },
                      { key: 'has_pool', label: 'Swimming Pool', testid: 'has-pool-checkbox' },
                      { key: 'near_metro', label: 'Near Metro', testid: 'near-metro-checkbox' },
                      { key: 'has_security', label: '24/7 Security', testid: 'has-security-checkbox' },
                      { key: 'has_cctv', label: 'CCTV Surveillance', testid: 'has-cctv-checkbox' },
                      { key: 'has_wifi', label: 'WiFi', testid: 'has-wifi-checkbox' },
                      { key: 'has_ac', label: 'Air Conditioning', testid: 'has-ac-checkbox' },
                      { key: 'has_geyser', label: 'Geyser', testid: 'has-geyser-checkbox' },
                      { key: 'has_video_doorbell', label: 'Video Doorbell', testid: 'has-video-doorbell-checkbox' },
                      { key: 'has_fire_safety', label: 'Fire Safety', testid: 'has-fire-safety-checkbox' },
                      { key: 'has_intercom', label: 'Intercom', testid: 'has-intercom-checkbox' },
                    ].map((amenity) => (
                      <div key={amenity.key} className="flex items-center bg-stone-50 rounded-lg p-4">
                        <input
                          type="checkbox"
                          checked={formData[amenity.key]}
                          onChange={(e) => setFormData({ ...formData, [amenity.key]: e.target.checked })}
                          className="h-5 w-5 text-blue-600 rounded"
                          data-testid={amenity.testid}
                        />
                        <label className="ml-3 text-sm font-medium text-slate-700">{amenity.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 font-semibold shadow-lg hover:shadow-blue-500/30 transition-all"
                  data-testid="step-3-next-btn"
                >
                  Next: Upload Images
                </button>
              </div>
            )}

            {/* Step 4: Images & Submit */}
            {step === 4 && (
              <div className="space-y-6" data-testid="step-4-images-submit">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-emerald-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Upload Images
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                    data-testid="step-4-back-btn"
                  >
                    ← Back
                  </button>
                </div>

                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className="border-2 border-dashed border-stone-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  data-testid="image-dropzone"
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-700 mb-2">Drag & drop images here</p>
                  <p className="text-sm text-slate-500">or click to select files (Max 5MB each)</p>
                </div>

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div className="grid md:grid-cols-4 gap-4">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Property ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`remove-image-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-stone-200 pt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>AI Description:</strong> Once you submit, our AI will generate a professional,
                      SEO-optimized property description based on your inputs.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-900 hover:bg-emerald-800 text-white rounded-full px-8 py-4 font-semibold text-lg shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
                    data-testid="submit-property-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                        Creating Listing...
                      </>
                    ) : (
                      'Create Property Listing'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProperty;
