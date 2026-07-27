import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { Location, ParkingSlot, Booking, PaymentInfo } from '../types';
import { 
  BarChart3, MapPin, Grid, Layers, ClipboardList, TrendingUp, Users, 
  Plus, Edit, Trash2, Search, X, CheckCircle, AlertTriangle, Download, 
  ShieldCheck, RefreshCw, FileText
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    locations, slots, completedBookings, payments,
    addLocation, updateLocation, deleteLocation,
    addSlot, updateSlotStatus, deleteSlot,
    cancelBooking, approveBooking
  } = useBooking();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'metrics' | 'locations' | 'slots' | 'bookings' | 'scanner' | 'reports'>('metrics');

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-28">
        <div className="text-center p-8 bg-white border border-gray-200 rounded-lg shadow-sm max-w-sm mx-auto">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm mb-6">Admin privileges are required to view the console panel.</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-2 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Stats variables
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [availableSlotsCount, setAvailableSlotsCount] = useState(0);
  const [occupiedSlotsCount, setOccupiedSlotsCount] = useState(0);
  const [maintenanceSlotsCount, setMaintenanceSlotsCount] = useState(0);

  // Search filter lists
  const [bookingSearch, setBookingSearch] = useState('');

  // CRUD Forms State
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locForm, setLocForm] = useState({ name: '', address: '', totalSlots: 10, hourlyRate: 40, dailyRate: 200 });

  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [slotLocationId, setSlotLocationId] = useState('');
  const [slotForm, setSlotForm] = useState({ slotNumber: '', vehicleType: 'sedan', status: 'available' as ParkingSlot['status'] });

  // QR Code Scanner simulator state
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<{ status: 'valid' | 'invalid' | 'expired'; booking?: Booking; location?: Location } | null>(null);

  // Load metrics
  useEffect(() => {
    // Read total users from Mock DB
    const mockUsers = JSON.parse(localStorage.getItem('users_db') || '[]');
    setTotalUsers(mockUsers.length || 2);
    setTotalBookings(completedBookings.length);
    
    // Revenue sum
    const rev = payments.reduce((acc, curr) => curr.status === 'success' ? acc + curr.amount : acc, 0);
    setTotalRevenue(rev);

    // Slot counts
    let avail = 0;
    let occ = 0;
    let maint = 0;
    slots.forEach(s => {
      if (s.status === 'available') avail++;
      else if (s.status === 'occupied') occ++;
      else if (s.status === 'maintenance') maint++;
    });
    setAvailableSlotsCount(avail);
    setOccupiedSlotsCount(occ);
    setMaintenanceSlotsCount(maint);

    if (locations.length > 0 && !slotLocationId) {
      setSlotLocationId(locations[0].id);
    }
  }, [locations, slots, completedBookings, payments, slotLocationId]);

  // Handle Location CRUD Submit
  const handleLocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locForm.name || !locForm.address) return;

    if (editingLocation) {
      const updated: Location = {
        ...editingLocation,
        name: locForm.name,
        address: locForm.address,
        totalSlots: Number(locForm.totalSlots),
        rate: { hourly: Number(locForm.hourlyRate), daily: Number(locForm.dailyRate) }
      };
      await updateLocation(updated);
    } else {
      await addLocation({
        name: locForm.name,
        address: locForm.address,
        totalSlots: Number(locForm.totalSlots),
        availableSlots: Number(locForm.totalSlots),
        rate: { hourly: Number(locForm.hourlyRate), daily: Number(locForm.dailyRate) }
      });
    }

    setIsLocModalOpen(false);
    setEditingLocation(null);
    setLocForm({ name: '', address: '', totalSlots: 10, hourlyRate: 40, dailyRate: 200 });
  };

  const handleEditLoc = (loc: Location) => {
    setEditingLocation(loc);
    setLocForm({
      name: loc.name,
      address: loc.address,
      totalSlots: loc.totalSlots,
      hourlyRate: loc.rate.hourly,
      dailyRate: loc.rate.daily
    });
    setIsLocModalOpen(true);
  };

  const handleDeleteLoc = async (id: string) => {
    if (window.confirm('Deleting this location will remove all associated slots and history. Proceed?')) {
      await deleteLocation(id);
    }
  };

  // Handle Slot CRUD Submit
  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotForm.slotNumber || !slotLocationId) return;

    await addSlot({
      locationId: slotLocationId,
      slotNumber: slotForm.slotNumber.toUpperCase(),
      vehicleType: slotForm.vehicleType,
      status: slotForm.status
    });

    setIsSlotModalOpen(false);
    setSlotForm({ slotNumber: '', vehicleType: 'sedan', status: 'available' });
  };

  const handleUpdateSlot = async (slotId: string, status: ParkingSlot['status']) => {
    await updateSlotStatus(slotId, status);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (window.confirm('Delete this parking slot?')) {
      await deleteSlot(slotId);
    }
  };

  // Handle Scanning Simulation
  const handleScanSimulate = () => {
    setScanResult(null);
    if (!qrInput) return;

    try {
      // Check if scanner input is a JSON string (QR code payload)
      let bookingId = qrInput.trim();
      if (qrInput.startsWith('{') && qrInput.endsWith('}')) {
        const parsed = JSON.parse(qrInput);
        bookingId = parsed.bookingId;
      }

      const matchBooking = completedBookings.find(b => b.id.toLowerCase() === bookingId.toLowerCase());
      if (matchBooking) {
        const matchLoc = locations.find(l => l.id === matchBooking.locationId);
        
        // Simple expiry logic: check if date is past
        const isPast = new Date(matchBooking.endTime).getTime() < Date.now();
        const status = isPast ? 'expired' : (matchBooking.status === 'cancelled' ? 'invalid' : 'valid');
        
        setScanResult({
          status,
          booking: matchBooking,
          location: matchLoc
        });
      } else {
        setScanResult({ status: 'invalid' });
      }
    } catch (e) {
      setScanResult({ status: 'invalid' });
    }
  };

  // Generate Reports CSV Export
  const downloadCSVReport = (reportType: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (reportType === 'bookings') {
      csvContent += "Booking ID,User ID,Location,Slot,Vehicle,Start,End,Amount,Status\n";
      completedBookings.forEach(b => {
        const loc = locations.find(l => l.id === b.locationId)?.name || '';
        csvContent += `"${b.id}","${b.userId}","${loc}","${b.slotNumber}","${b.vehicleNumber}","${b.startTime}","${b.endTime}",${b.amount},"${b.status}"\n`;
      });
    } else if (reportType === 'revenue') {
      csvContent += "Transaction ID,Booking ID,Amount,Method,Status,Date\n";
      payments.forEach(p => {
        csvContent += `"${p.transactionId}","${p.bookingId}",${p.amount},"${p.method}","${p.status}","${p.createdAt}"\n`;
      });
    } else if (reportType === 'usage') {
      csvContent += "Location,Total Slots,Available Slots,Occupancy Rate (%)\n";
      locations.forEach(l => {
        const occupied = l.totalSlots - l.availableSlots;
        const rate = l.totalSlots > 0 ? ((occupied / l.totalSlots) * 100).toFixed(1) : "0";
        csvContent += `"${l.name}",${l.totalSlots},${l.availableSlots},${rate}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Bookings by search
  const filteredBookings = completedBookings.filter(b => 
    b.id.toLowerCase().includes(bookingSearch.toLowerCase()) || 
    b.vehicleNumber.toLowerCase().includes(bookingSearch.toLowerCase()) ||
    b.slotNumber.toLowerCase().includes(bookingSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Console</h1>
            <p className="text-gray-500 text-sm mt-1">Manage parking spots, coordinate booking slots, and extract reports.</p>
          </div>
          <div className="flex items-center text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded px-3 py-1.5 font-semibold">
            Logged in as: {user?.email}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap mb-6 scrollbar-hide">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-3 px-5 border-b-2 font-medium text-sm flex items-center transition-colors ${
              activeTab === 'metrics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`py-3 px-5 border-b-2 font-medium text-sm flex items-center transition-colors ${
              activeTab === 'locations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Parking Areas
          </button>
          <button
            onClick={() => setActiveTab('slots')}
            className={`py-3 px-5 border-b-2 font-medium text-sm flex items-center transition-colors ${
              activeTab === 'slots'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Grid className="mr-2 h-4 w-4" />
            Slots & Bays
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-3 px-5 border-b-2 font-medium text-sm flex items-center transition-colors ${
              activeTab === 'bookings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`py-3 px-5 border-b-2 font-medium text-sm flex items-center transition-colors ${
              activeTab === 'scanner'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            E-Ticket Validator
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-3 px-5 border-b-2 font-medium text-sm flex items-center transition-colors ${
              activeTab === 'reports'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="mr-2 h-4 w-4" />
            Reports Panel
          </button>
        </div>

        {/* Tab content 1: Overview metrics */}
        {activeTab === 'metrics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-md mr-4"><Users className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Registered Users</p>
                  <p className="text-2xl font-bold text-gray-800">{totalUsers}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
                <div className="p-3 bg-green-50 text-green-600 rounded-md mr-4"><ClipboardList className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-800">{totalBookings}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
                <div className="p-3 bg-yellow-50 text-yellow-600 rounded-md mr-4"><TrendingUp className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Gross Revenue Collected</p>
                  <p className="text-2xl font-bold text-gray-800">₹{totalRevenue.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-md mr-4"><Grid className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Locations Managed</p>
                  <p className="text-2xl font-bold text-gray-800">{locations.length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Slots Status Distribution */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
                <h3 className="text-base font-bold text-gray-800 mb-6">Bay Status Allocation</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                      <span>Available Slots ({availableSlotsCount})</span>
                      <span>{slots.length > 0 ? ((availableSlotsCount / slots.length) * 100).toFixed(0) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${slots.length > 0 ? (availableSlotsCount / slots.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                      <span>Occupied Slots ({occupiedSlotsCount})</span>
                      <span>{slots.length > 0 ? ((occupiedSlotsCount / slots.length) * 100).toFixed(0) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${slots.length > 0 ? (occupiedSlotsCount / slots.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                      <span>Under Maintenance ({maintenanceSlotsCount})</span>
                      <span>{slots.length > 0 ? ((maintenanceSlotsCount / slots.length) * 100).toFixed(0) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${slots.length > 0 ? (maintenanceSlotsCount / slots.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Occupancy Rate by Location */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
                <h3 className="text-base font-bold text-gray-800 mb-4">Location Occupancy Rates</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-400">
                      <tr>
                        <th className="p-3">Location</th>
                        <th className="p-3 text-center">Total Slots</th>
                        <th className="p-3 text-center">Available</th>
                        <th className="p-3 text-right">Occupancy (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {locations.map(loc => {
                        const occupied = loc.totalSlots - loc.availableSlots;
                        const rate = loc.totalSlots > 0 ? Math.round((occupied / loc.totalSlots) * 100) : 0;
                        return (
                          <tr key={loc.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-semibold text-gray-700">{loc.name}</td>
                            <td className="p-3 text-center text-gray-600">{loc.totalSlots}</td>
                            <td className="p-3 text-center text-gray-600">{loc.availableSlots}</td>
                            <td className="p-3 text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                                rate > 80 ? 'bg-red-50 text-red-700' : (rate > 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700')
                              }`}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab content 2: Locations CRUD */}
        {activeTab === 'locations' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Parking Locations</h2>
              <button
                onClick={() => {
                  setEditingLocation(null);
                  setLocForm({ name: '', address: '', totalSlots: 10, hourlyRate: 40, dailyRate: 200 });
                  setIsLocModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition flex items-center"
              >
                <Plus className="mr-1.5 h-4.5 w-4.5" />
                Add Location
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((loc) => (
                <div key={loc.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between">
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-1">{loc.name}</h3>
                    <p className="text-gray-500 text-xs mb-4 flex items-start">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                      {loc.address}
                    </p>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md text-sm">
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block">Hourly Charge</span>
                        <span className="font-extrabold text-gray-800">₹{loc.rate.hourly}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block">Daily Charge</span>
                        <span className="font-extrabold text-gray-800">₹{loc.rate.daily}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block">Total Slots</span>
                        <span className="font-bold text-gray-700">{loc.totalSlots}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block">Available</span>
                        <span className="font-bold text-green-600">{loc.availableSlots}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border-t border-gray-100 px-6 py-3.5 flex justify-end gap-3">
                    <button
                      onClick={() => handleEditLoc(loc)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center py-1 px-2.5 hover:bg-blue-50 rounded transition"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLoc(loc.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center py-1 px-2.5 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Location CRUD Modal */}
            {isLocModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
                <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-md overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-5 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{editingLocation ? 'Modify Location' : 'New Parking Location'}</h3>
                    <button onClick={() => setIsLocModalOpen(false)} className="text-white hover:text-blue-200 transition">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleLocSubmit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={locForm.name}
                        onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Address</label>
                      <input
                        type="text"
                        required
                        value={locForm.address}
                        onChange={(e) => setLocForm({ ...locForm, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Capacity</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={locForm.totalSlots}
                          onChange={(e) => setLocForm({ ...locForm, totalSlots: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Rate/Hr (₹)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={locForm.hourlyRate}
                          onChange={(e) => setLocForm({ ...locForm, hourlyRate: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Rate/Day (₹)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={locForm.dailyRate}
                          onChange={(e) => setLocForm({ ...locForm, dailyRate: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm transition"
                    >
                      {editingLocation ? 'Save Changes' : 'Create Location'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab content 3: Slot CRUD & status controls */}
        {activeTab === 'slots' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-grow max-w-sm">
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Select Location</label>
                <select
                  value={slotLocationId}
                  onChange={(e) => setSlotLocationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm capitalize"
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsSlotModalOpen(true)}
                disabled={!slotLocationId}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
              >
                <Plus className="mr-1.5 h-4.5 w-4.5" />
                Add Custom Slot
              </button>
            </div>

            {/* Slots Grid */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 text-base mb-6 border-b border-gray-100 pb-3">Slot Allocation Grid</h3>
              
              {slots.filter(s => s.locationId === slotLocationId).length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-sm text-gray-400">No slots defined for this area. Add a new slot to get started.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {slots.filter(s => s.locationId === slotLocationId).map((slot) => (
                    <div 
                      key={slot.id} 
                      className={`p-3.5 rounded-lg border text-center relative group flex flex-col justify-between min-h-[100px] ${
                        slot.status === 'available' ? 'bg-green-50/50 border-green-200 text-green-700' :
                        slot.status === 'occupied' ? 'bg-blue-50/30 border-blue-200 text-blue-700' :
                        slot.status === 'reserved' ? 'bg-yellow-50/50 border-yellow-200 text-yellow-700' :
                        'bg-red-50/30 border-red-200 text-red-600'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold font-mono tracking-wider block">{slot.slotNumber}</span>
                        <span className="text-[9px] uppercase font-bold tracking-wide mt-0.5 block">{slot.vehicleType}</span>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <select
                          value={slot.status}
                          onChange={(e) => handleUpdateSlot(slot.id, e.target.value as ParkingSlot['status'])}
                          className="w-full text-[9px] font-bold border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-700 cursor-pointer focus:outline-none"
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="reserved">Reserved</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="w-full text-[9px] font-semibold text-red-600 hover:bg-red-100 rounded py-0.5 transition block md:hidden md:group-hover:block"
                        >
                          Delete Slot
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slot Addition Modal */}
            {isSlotModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
                <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-5 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Add Custom Slot</h3>
                    <button onClick={() => setIsSlotModalOpen(false)} className="text-white hover:text-blue-200 transition">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSlotSubmit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Slot Identifier</label>
                      <input
                        type="text"
                        placeholder="e.g. A6, B4"
                        required
                        value={slotForm.slotNumber}
                        onChange={(e) => setSlotForm({ ...slotForm, slotNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Vehicle Classification</label>
                      <select
                        value={slotForm.vehicleType}
                        onChange={(e) => setSlotForm({ ...slotForm, vehicleType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm capitalize"
                      >
                        <option value="sedan">Sedan / Hatchback</option>
                        <option value="suv">SUV</option>
                        <option value="bike">Two-Wheeler</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Initial Status</label>
                      <select
                        value={slotForm.status}
                        onChange={(e) => setSlotForm({ ...slotForm, status: e.target.value as ParkingSlot['status'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="reserved">Reserved</option>
                        <option value="maintenance">Under Maintenance</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm transition"
                    >
                      Save Slot
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab content 4: Bookings Management */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-800">Booking Management Log</h2>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Booking, Vehicle, Slot..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-400">
                  <tr>
                    <th className="p-3">Booking ID</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Slot</th>
                    <th className="p-3">Vehicle</th>
                    <th className="p-3">Entry/Exit Duration</th>
                    <th className="p-3 text-center">Amount</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-gray-600">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-gray-400">No booking matches found.</td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const locName = locations.find(l => l.id === b.locationId)?.name || 'Chennai Parking';
                      const start = new Date(b.startTime).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                      const end = new Date(b.endTime).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <tr key={b.id} className="hover:bg-gray-50/50">
                          <td className="p-3 font-mono font-bold text-gray-900">{b.id.toUpperCase()}</td>
                          <td className="p-3 font-medium text-gray-700">{locName}</td>
                          <td className="p-3 text-center font-mono font-bold text-blue-700">{b.slotNumber}</td>
                          <td className="p-3 font-mono font-bold">{b.vehicleNumber.toUpperCase()}</td>
                          <td className="p-3 text-xs leading-relaxed">
                            <span className="block font-semibold">In: {start}</span>
                            <span className="block text-gray-400">Out: {end}</span>
                          </td>
                          <td className="p-3 text-center font-bold text-gray-800">₹{b.amount}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              b.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            {b.status === 'confirmed' && (
                              <button
                                onClick={async () => {
                                  if (window.confirm('Cancel this booking on behalf of the customer?')) {
                                    await cancelBooking(b.id);
                                  }
                                }}
                                className="text-xs text-red-600 hover:text-red-800 font-semibold hover:bg-red-50 py-1 px-2 rounded transition"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab content 5: QR scanner simulator */}
        {activeTab === 'scanner' && (
          <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Gate E-Ticket Scanner Simulator</h2>
            <p className="text-sm text-gray-500 mb-6">Scan QR Code payloads or input Booking Reference IDs to verify entrance/exit permissions.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Scan Input (Paste QR Code text or Booking ID)</label>
                <textarea
                  rows={3}
                  placeholder='Paste the ticket QR Code text (JSON format) or just the Booking ID here...'
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                />
              </div>
              <button
                onClick={handleScanSimulate}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm transition"
              >
                Scan Ticket QR / ID
              </button>
            </div>

            {scanResult && (
              <div className="mt-8 border-t border-gray-150 pt-6">
                <h3 className="font-bold text-gray-700 mb-4">Verification Result</h3>

                {scanResult.status === 'valid' && scanResult.booking && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-5 flex items-start">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-4 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 text-sm text-green-800">
                      <p className="font-extrabold text-lg flex items-center">
                        ACCESS GRANTED
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
                        <p><strong>Booking ID:</strong> {scanResult.booking.id.toUpperCase()}</p>
                        <p><strong>Location:</strong> {scanResult.location?.name}</p>
                        <p><strong>Bay Slot:</strong> {scanResult.booking.slotNumber}</p>
                        <p><strong>Plate Num:</strong> {scanResult.booking.vehicleNumber.toUpperCase()}</p>
                        <p className="col-span-2"><strong>Exit Time:</strong> {new Date(scanResult.booking.endTime).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {scanResult.status === 'expired' && scanResult.booking && (
                  <div className="bg-yellow-50 border border-yellow-250 rounded-lg p-5 flex items-start">
                    <AlertTriangle className="h-8 w-8 text-yellow-600 mr-4 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 text-sm text-yellow-800">
                      <p className="font-extrabold text-lg">TICKET EXPIRED</p>
                      <p className="text-xs">The booked parking time window has closed. Additional hourly charges apply.</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs mt-2 text-yellow-900">
                        <p><strong>Booking ID:</strong> {scanResult.booking.id.toUpperCase()}</p>
                        <p><strong>Bays Slot:</strong> {scanResult.booking.slotNumber}</p>
                        <p><strong>Plate Num:</strong> {scanResult.booking.vehicleNumber.toUpperCase()}</p>
                        <p className="col-span-2"><strong>Exit Time:</strong> {new Date(scanResult.booking.endTime).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {scanResult.status === 'invalid' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-5 flex items-start">
                    <X className="h-8 w-8 text-red-600 mr-4 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 text-sm text-red-800">
                      <p className="font-extrabold text-lg">ACCESS DENIED</p>
                      <p className="text-xs">Invalid Ticket reference or cancelled booking. Please contact customer helpdesk.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab content 6: Reports Panel */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Reports Panel</h2>
            <p className="text-sm text-gray-500">Generate, print, and export CSV/Excel sheets of booking logs, payouts, and usage rates.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Report Card 1 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <h3 className="font-bold text-base text-gray-800 mb-2">Bookings History Log</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">Detailed records of entries, exits, slot numbers, and client vehicle details.</p>
                </div>
                <button
                  onClick={() => downloadCSVReport('bookings')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition flex items-center justify-center"
                >
                  <Download className="mr-2 h-4 w-4" /> Export CSV Report
                </button>
              </div>

              {/* Report Card 2 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <h3 className="font-bold text-base text-gray-800 mb-2">Revenue Transaction Sheet</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">Gross collections, transactions mapping, date-wise revenues, and checkout modes.</p>
                </div>
                <button
                  onClick={() => downloadCSVReport('revenue')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition flex items-center justify-center"
                >
                  <Download className="mr-2 h-4 w-4" /> Export CSV Report
                </button>
              </div>

              {/* Report Card 3 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <h3 className="font-bold text-base text-gray-800 mb-2">Location Bay Occupancy</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">Current allocation rates, maximum usage areas, and availability ratios.</p>
                </div>
                <button
                  onClick={() => downloadCSVReport('usage')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition flex items-center justify-center"
                >
                  <Download className="mr-2 h-4 w-4" /> Export CSV Report
                </button>
              </div>
            </div>

            {/* Print Friendly Report Table Preview */}
            <div className="bg-white rounded-lg border border-gray-250 p-6">
              <div className="flex justify-between items-center mb-4 border-b border-gray-150 pb-3 print:hidden">
                <h3 className="font-bold text-gray-850 text-base">Interactive Report Preview (Today's Logs)</h3>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Print Preview Report
                </button>
              </div>

              <div className="overflow-x-auto print:block">
                <div className="text-center mb-6 hidden print:block">
                  <h1 className="text-2xl font-bold text-gray-900">Chennai Parking System - Daily Operations Report</h1>
                  <p className="text-xs text-gray-500 mt-1">Generated Date: {new Date().toLocaleDateString()}</p>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-400 font-bold uppercase border-b border-gray-150">
                    <tr>
                      <th className="p-2">ID</th>
                      <th className="p-2">Vehicle</th>
                      <th className="p-2">Location</th>
                      <th className="p-2">Slot</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-gray-600 font-mono">
                    {completedBookings.slice(-10).map((b) => (
                      <tr key={b.id}>
                        <td className="p-2 font-bold">{b.id.toUpperCase()}</td>
                        <td className="p-2">{b.vehicleNumber.toUpperCase()}</td>
                        <td className="p-2">{locations.find(l => l.id === b.locationId)?.name}</td>
                        <td className="p-2 font-bold text-blue-700">{b.slotNumber}</td>
                        <td className="p-2 text-gray-900">₹{b.amount}</td>
                        <td className="p-2 uppercase">{b.status}</td>
                        <td className="p-2">{new Date(b.startTime).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                    {completedBookings.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-gray-400">No data logs recorded today.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
