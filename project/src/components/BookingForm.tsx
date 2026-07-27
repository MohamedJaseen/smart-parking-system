import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import VehicleSelector from './VehicleSelector';
import { Calendar, Clock, IndianRupee, Grid } from 'lucide-react';

const BookingForm: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { selectedLocation, setBookingDetails, bookingDetails, slots } = useBooking();
  
  const [vehicleType, setVehicleType] = useState(bookingDetails?.vehicleType || 'sedan');
  const [vehicleNumber, setVehicleNumber] = useState(bookingDetails?.vehicleNumber || '');
  const [date, setDate] = useState<string>(
    bookingDetails?.startTime 
      ? new Date(bookingDetails.startTime).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>(
    bookingDetails?.startTime 
      ? new Date(bookingDetails.startTime).toTimeString().slice(0, 5)
      : new Date().toTimeString().slice(0, 5)
  );
  const [duration, setDuration] = useState<number>(1);
  const [selectedSlot, setSelectedSlot] = useState<string>(bookingDetails?.slotNumber || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!selectedLocation) {
      navigate('/');
    }
  }, [selectedLocation, navigate]);

  // Filter slots by location and vehicle type
  const locationSlots = slots.filter(
    s => s.locationId === selectedLocation?.id && s.vehicleType === vehicleType
  );

  // If vehicle type changes, clear selected slot
  useEffect(() => {
    setSelectedSlot('');
  }, [vehicleType]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    // Validate vehicle number (format: TN 01 AB 1234 or TN01AB1234)
    // Relax regex a little bit to make it easier for presentation, but keep it clean
    const vehicleRegex = /^[A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{1,2}[-\s]?\d{1,4}$/;
    if (!vehicleNumber) {
      newErrors.vehicleNumber = 'Vehicle number is required';
    } else if (!vehicleRegex.test(vehicleNumber.trim().toUpperCase())) {
      newErrors.vehicleNumber = 'Invalid format. Use: TN 01 AB 1234';
    }
    
    // Validate date & time
    const selectedDateTime = new Date(`${date}T${startTime}`);
    if (selectedDateTime < new Date(Date.now() - 60000)) { // 1 min buffer
      newErrors.time = 'Selected time cannot be in the past';
    }

    // Validate slot selection
    if (!selectedSlot) {
      newErrors.slot = 'Please select a parking slot from the grid below';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + duration);
    
    setBookingDetails({
      userId: user?.id || 'guest',
      locationId: selectedLocation?.id || '',
      vehicleType,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      slotNumber: selectedSlot,
      status: 'pending',
    });
    
    navigate('/payment');
  };

  if (!selectedLocation) return null;

  const hourlyRate = selectedLocation.rate.hourly;
  const totalAmount = hourlyRate * duration;

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Book Parking Space</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-1">Selected Location</h3>
        <p className="text-lg font-bold text-gray-800">{selectedLocation.name}</p>
        <p className="text-gray-600 text-sm">{selectedLocation.address}</p>
        <div className="mt-2 text-blue-700 text-xs font-semibold">
          <span>{selectedLocation.availableSlots}</span> out of <span>{selectedLocation.totalSlots}</span> slots available right now
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <VehicleSelector selectedVehicle={vehicleType} onChange={setVehicleType} />
        
        <div>
          <label htmlFor="vehicleNumber" className="block text-gray-700 font-semibold mb-2 text-sm">
            Vehicle Number
          </label>
          <input
            type="text"
            id="vehicleNumber"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            placeholder="e.g. TN 01 AB 1234"
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm ${
              errors.vehicleNumber
                ? 'border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:ring-blue-200'
            }`}
          />
          {errors.vehicleNumber && (
            <p className="text-red-500 text-xs mt-1 font-semibold">{errors.vehicleNumber}</p>
          )}
          <p className="text-gray-400 text-xs mt-1">Acceptable Format: TN 01 AB 1234</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-gray-700 font-semibold mb-2 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Date</span>
              </div>
            </label>
            <input
              type="date"
              id="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="time" className="block text-gray-700 font-semibold mb-2 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Start Time</span>
              </div>
            </label>
            <input
              type="time"
              id="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm ${
                errors.time
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200'
              }`}
            />
            {errors.time && (
              <p className="text-red-500 text-xs mt-1 font-semibold">{errors.time}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="duration" className="block text-gray-700 font-semibold mb-2 text-sm">
            Duration (Hours)
          </label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
          >
            {[1, 2, 3, 4, 5, 6, 12, 24].map((hour) => (
              <option key={hour} value={hour}>
                {hour} {hour === 1 ? 'hour' : 'hours'}
              </option>
            ))}
          </select>
        </div>

        {/* Live Slot Selection Grid */}
        <div className="border border-gray-200 rounded-lg p-5">
          <label className="block text-gray-700 font-bold mb-3 text-sm flex items-center">
            <Grid className="h-4 w-4 text-blue-600 mr-2" />
            Pick Your Parking Bay
          </label>
          
          {errors.slot && (
            <p className="text-red-500 text-xs font-semibold mb-3">{errors.slot}</p>
          )}

          {locationSlots.length === 0 ? (
            <p className="text-xs text-gray-400">No bays available for {vehicleType} vehicles at this location.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {locationSlots.map((slot) => {
                const isAvail = slot.status === 'available';
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={!isAvail}
                    onClick={() => setSelectedSlot(slot.slotNumber)}
                    className={`py-3 px-2 border text-center rounded-md font-mono text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                      selectedSlot === slot.slotNumber
                        ? 'bg-blue-600 border-blue-700 text-white shadow'
                        : isAvail
                          ? 'bg-green-50/50 border-green-200 text-green-700 hover:bg-green-100 hover:shadow-sm'
                          : slot.status === 'maintenance'
                            ? 'bg-red-50/30 border-red-150 text-red-400 cursor-not-allowed'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{slot.slotNumber}</span>
                    <span className="text-[8px] font-sans font-bold tracking-wide uppercase opacity-80">
                      {slot.status === 'available' ? 'Avail' : slot.status === 'maintenance' ? 'Maint' : 'Booked'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex gap-4 mt-4 flex-wrap text-[10px] text-gray-500 font-semibold border-t border-gray-100 pt-3">
            <div className="flex items-center"><span className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-1.5 inline-block"></span> Available</div>
            <div className="flex items-center"><span className="w-3 h-3 bg-blue-600 rounded mr-1.5 inline-block"></span> Selected</div>
            <div className="flex items-center"><span className="w-3 h-3 bg-gray-100 border border-gray-200 rounded mr-1.5 inline-block"></span> Occupied</div>
            <div className="flex items-center"><span className="w-3 h-3 bg-red-50 border border-red-150 rounded mr-1.5 inline-block"></span> Under Maintenance</div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-150">
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-600 font-medium">Rate per hour</span>
            <div className="flex items-center font-bold text-gray-800">
              <IndianRupee className="h-4 w-4 mr-0.5" />
              <span>{hourlyRate.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-600 font-medium">Duration</span>
            <span className="font-semibold text-gray-800">{duration} {duration === 1 ? 'hour' : 'hours'}</span>
          </div>
          
          <div className="border-t border-gray-200 my-2 pt-2"></div>
          
          <div className="flex justify-between items-center font-bold">
            <span className="text-gray-800">Total Amount</span>
            <div className="flex items-center text-lg text-blue-900 font-black">
              <IndianRupee className="h-5 w-5 mr-0.5" />
              <span>{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {!isAuthenticated && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-xs font-semibold text-yellow-700">
                  You're not logged in. Consider{' '}
                  <a href="/login" className="font-bold underline text-yellow-800 hover:text-yellow-600">
                    logging in
                  </a>
                  {' '}to manage your vehicles and booking history.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <button
          type="submit"
          className="w-full bg-blue-900 text-white py-3 rounded-md font-bold hover:bg-blue-800 transition shadow focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
        >
          Proceed to Payment
        </button>
      </form>
    </div>
  );
};

export default BookingForm;