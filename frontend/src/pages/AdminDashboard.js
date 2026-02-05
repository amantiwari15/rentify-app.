import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Navbar } from '../components/Navbar';
import { API } from '../App';
import { Users, Home, Trash2, Activity, Shield } from 'lucide-react';

const AdminDashboard = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ total_users: 0, total_properties: 0 });
    const [users, setUsers] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.is_admin) {
            toast.error("Access denied. Admin privileges required.");
            navigate('/');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [statsRes, usersRes, propsRes] = await Promise.all([
                axios.get(`${API}/admin/stats`, { headers }),
                axios.get(`${API}/admin/users`, { headers }),
                axios.get(`${API}/admin/properties`, { headers })
            ]);

            setStats(statsRes.data);
            setUsers(usersRes.data);
            setProperties(propsRes.data);
        } catch (error) {
            console.error("Admin fetch error:", error);
            toast.error('Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API}/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("User deleted successfully");
            setUsers(users.filter(u => u.id !== userId));
            setStats({ ...stats, total_users: stats.total_users - 1 });
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    const handleDeleteProperty = async (propertyId) => {
        if (!window.confirm("Are you sure you want to delete this property?")) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API}/admin/properties/${propertyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Property deleted successfully");
            setProperties(properties.filter(p => p.id !== propertyId));
            setStats({ ...stats, total_properties: stats.total_properties - 1 });
        } catch (error) {
            toast.error("Failed to delete property");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50">Loading Admin Dashboard...</div>;

    return (
        <div className="min-h-screen bg-stone-50">
            <Navbar user={user} onLogout={onLogout} />

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center mb-8">
                    <Shield className="h-8 w-8 text-emerald-900 mr-3" />
                    <h1 className="text-3xl font-bold text-emerald-900">Admin Dashboard</h1>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex items-center">
                        <div className="p-4 bg-blue-100 rounded-full mr-4">
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500 font-medium">Total Users</div>
                            <div className="text-3xl font-bold text-slate-800">{stats.total_users}</div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex items-center">
                        <div className="p-4 bg-green-100 rounded-full mr-4">
                            <Home className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500 font-medium">Total Properties</div>
                            <div className="text-3xl font-bold text-slate-800">{stats.total_properties}</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="flex border-b border-stone-200">
                        <button
                            className={`px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'border-b-2 border-emerald-900 text-emerald-900 bg-stone-50' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                        <button
                            className={`px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'users' ? 'border-b-2 border-emerald-900 text-emerald-900 bg-stone-50' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('users')}
                        >
                            Manage Users ({users.length})
                        </button>
                        <button
                            className={`px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'properties' ? 'border-b-2 border-emerald-900 text-emerald-900 bg-stone-50' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('properties')}
                        >
                            Manage Properties ({properties.length})
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div className="text-center py-12 text-slate-500">
                                <Activity className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                <h3 className="text-lg font-medium text-slate-700 mb-2">System Overview</h3>
                                <p>Select a tab above to manage users or properties.</p>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-stone-50 text-slate-700 uppercase font-bold">
                                        <tr>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Email</th>
                                            <th className="px-6 py-3">Role</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-200">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-800">{u.name}</td>
                                                <td className="px-6 py-4">{u.email}</td>
                                                <td className="px-6 py-4">
                                                    {u.is_admin ? (
                                                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">Admin</span>
                                                    ) : (
                                                        <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-xs">User</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {!u.is_admin && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'properties' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-stone-50 text-slate-700 uppercase font-bold">
                                        <tr>
                                            <th className="px-6 py-3">Image</th>
                                            <th className="px-6 py-3">Title</th>
                                            <th className="px-6 py-3">Listed By</th>
                                            <th className="px-6 py-3">Price</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-200">
                                        {properties.map(p => (
                                            <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    {p.images && p.images[0] ? (
                                                        <img src={p.images[0]} alt="Prop" className="h-10 w-10 rounded object-cover" />
                                                    ) : (
                                                        <div className="h-10 w-10 bg-stone-200 rounded flex items-center justify-center">🏠</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-800">
                                                    {p.property_type} in {p.city}
                                                    <div className="text-xs text-slate-500 font-normal">{p.locality}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                                                        {p.listed_by}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">₹{p.price.toLocaleString('en-IN')}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteProperty(p.id)}
                                                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Delete Property"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
