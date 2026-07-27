import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { User, Shield, Car, History, Save, Plus, Trash2, Key, Calendar, MapPin, Printer } from 'lucide-react';

const UserProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword, addVehicle, removeVehicle } = useAuth();
  const { completedBookings, locations, cancelBooking } = useBooking();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'vehicles' | 'history'>('profile');
  
  // Profile edit state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Change Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Add Vehicle state
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('sedan');
  const [modelName, setModelName] = useState('');
  const [vehicleMsg, setVehicleMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-28">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">Please sign in to view your profile.</p>
          <button 
            onClick={() => navigate('/login')} 
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Filter bookings for this user
  const userBookings = completedBookings.filter(b => b.userId === user.id);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!name || !phone) {
      setProfileMsg({ type: 'error', text: 'All fields are required' });
      return;
    }
    const success = await updateProfile(name, phone);
    if (success) {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setProfileMsg({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwMsg({ type: 'error', text: 'Incorrect current password' });
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleMsg(null);
    if (!licensePlate) {
      setVehicleMsg({ type: 'error', text: 'License plate number is required' });
      return;
    }
    const success = await addVehicle({ licensePlate, type: vehicleType, modelName });
    if (success) {
      setVehicleMsg({ type: 'success', text: 'Vehicle registered successfully!' });
      setLicensePlate('');
      setModelName('');
    } else {
      setVehicleMsg({ type: 'error', text: 'Failed to register vehicle' });
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking? This action will refund your slot.')) {
      await cancelBooking(bookingId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Side Navigation Panel */}
          <div className="w-full lg:w-1/4 bg-white rounded-lg shadow-sm border border-gray-200 p-6 self-start">
            <div className="text-center mb-6 border-b border-gray-100 pb-6">
              <div className="inline-flex items-center justify-center bg-blue-100 text-blue-800 p-4 rounded-full mb-3">
                <User className="h-12 w-12" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
              <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider mt-1 inline-block">
                {user.role} Account
              </span>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Shield className="mr-3 h-5 w-5" />
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'vehicles'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Car className="mr-3 h-5 w-5" />
                My Vehicles
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'history'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <History className="mr-3 h-5 w-5" />
                Booking History
              </button>
            </nav>
          </div>

          {/* Main Contents Panel */}
          <div className="w-full lg:w-3/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
              
              {/* Tab 1: Profile and Password Settings */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  {/* Account Information Form */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Profile Settings</h3>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      {profileMsg && (
                        <div className={`p-4 rounded-md text-sm ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {profileMsg.text}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-md cursor-not-allowed"
                        />
                        <span className="text-xs text-gray-400 mt-1 block">Email address cannot be changed.</span>
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition flex items-center"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </button>
                    </form>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Password Change Form */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Change Password</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      {pwMsg && (
                        <div className={`p-4 rounded-md text-sm ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {pwMsg.text}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition flex items-center"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Update Password
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Tab 2: Vehicle Management */}
              {activeTab === 'vehicles' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Registered Vehicles</h3>
                    <p className="text-sm text-gray-500 mb-6">Manage the vehicles you use for parking slot bookings.</p>
                    
                    {/* Add Vehicle Form */}
                    <form onSubmit={handleAddVehicle} className="bg-gray-50 p-5 rounded-lg border border-gray-150 mb-6 space-y-4">
                      <h4 className="font-semibold text-gray-800 text-sm flex items-center">
                        <Plus className="mr-1.5 h-4 w-4 text-blue-600" />
                        Register New Vehicle
                      </h4>
                      {vehicleMsg && (
                        <div className={`p-3 rounded text-xs ${vehicleMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {vehicleMsg.text}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">License Plate Number</label>
                          <input
                            type="text"
                            placeholder="e.g. TN-07-BY-1234"
                            value={licensePlate}
                            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Type</label>
                          <select
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm capitalize"
                          >
                            <option value="sedan">Sedan / Hatchback</option>
                            <option value="suv">SUV</option>
                            <option value="bike">Two-Wheeler</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Model Name (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Honda City / Activa"
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
                      >
                        Register Vehicle
                      </button>
                    </form>

                    {/* Vehicles List */}
                    <div className="space-y-3">
                      {(!user.vehicles || user.vehicles.length === 0) ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                          <Car className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">No vehicles registered yet.</p>
                        </div>
                      ) : (
                        user.vehicles.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
                          >
                            <div className="flex items-center">
                              <div className="p-3 bg-blue-50 text-blue-700 rounded-full mr-4">
                                <Car className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="font-mono font-bold text-gray-800 text-lg tracking-wide">
                                  {v.licensePlate}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                  {v.modelName ? `${v.modelName} (${v.type})` : v.type}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeVehicle(v.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete vehicle"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Booking History */}
              {activeTab === 'history' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Booking History</h3>
                  <p className="text-sm text-gray-500 mb-6">View your receipts, active tickets, and parking logs.</p>

                  <div className="space-y-4">
                    {userBookings.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                        <History className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500 mb-4">You haven't made any bookings yet.</p>
                        <button
                          onClick={() => navigate('/book')}
                          className="px-5 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition"
                        >
                          Book a Parking Spot
                        </button>
                      </div>
                    ) : (
                      userBookings.map((b) => {
                        const loc = locations.find(l => l.id === b.locationId);
                        const isUpcoming = new Date(b.startTime).getTime() > Date.now() && b.status === 'confirmed';
                        
                        return (
                          <div
                            key={b.id}
                            className={`p-5 rounded-lg border shadow-sm transition hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              b.status === 'cancelled'
                                ? 'bg-gray-50/50 border-gray-250 opacity-70'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="space-y-2 flex-grow">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-gray-800">{loc?.name || 'Chennai Parking Spot'}</h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                  b.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {b.status}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold uppercase font-mono">
                                  Slot: {b.slotNumber}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                                <div className="flex items-center">
                                  <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                  <span>{loc?.address}</span>
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                  <span>
                                    {new Date(b.startTime).toLocaleDateString('en-IN')} | {new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Car className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                  <span className="font-mono">{b.vehicleNumber.toUpperCase()} ({b.vehicleType})</span>
                                </div>
                                <div>
                                  <span className="font-semibold">Fee: </span>
                                  <span className="text-gray-800 font-bold">₹{b.amount.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-center">
                              {b.status === 'confirmed' && (
                                <button
                                  onClick={() => navigate('/payment', { state: { booking: b } })} // Wait, redirect back to receipt / confirm
                                  className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold hover:bg-blue-100 transition flex items-center"
                                >
                                  <Printer className="h-3.5 w-3.5 mr-1" />
                                  Receipt
                                </button>
                              )}
                              {isUpcoming && (
                                <button
                                  onClick={() => handleCancelBooking(b.id)}
                                  className="px-3 py-1.5 border border-red-200 text-red-600 rounded text-xs font-semibold hover:bg-red-50 transition"
                                >
                                  Cancel Booking
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
