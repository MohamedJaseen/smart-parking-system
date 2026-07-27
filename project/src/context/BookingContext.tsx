import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking, Location, PaymentInfo, ParkingSlot, Notification } from '../types';
import { locations as initialLocations } from '../data/locations';
import { API_MODE, apiClient } from '../config/api';

interface BookingContextType {
  locations: Location[];
  slots: ParkingSlot[];
  completedBookings: Booking[];
  notifications: Notification[];
  payments: PaymentInfo[];
  selectedLocation: Location | null;
  bookingDetails: Partial<Booking> | null;
  paymentInfo: Partial<PaymentInfo> | null;
  
  setSelectedLocation: (location: Location | null) => void;
  setBookingDetails: (details: Partial<Booking>) => void;
  setPaymentInfo: (info: Partial<PaymentInfo>) => void;
  completeBooking: () => Promise<Booking | null>;
  clearBooking: () => void;
  
  // Locations Management
  addLocation: (loc: Omit<Location, 'id'>) => Promise<boolean>;
  updateLocation: (loc: Location) => Promise<boolean>;
  deleteLocation: (id: string) => Promise<boolean>;
  
  // Slots Management
  getSlotsByLocation: (locId: string) => ParkingSlot[];
  addSlot: (slot: Omit<ParkingSlot, 'id'>) => Promise<boolean>;
  updateSlotStatus: (id: string, status: ParkingSlot['status']) => Promise<boolean>;
  deleteSlot: (id: string) => Promise<boolean>;
  
  // Booking Management
  cancelBooking: (id: string) => Promise<boolean>;
  approveBooking: (id: string) => Promise<boolean>;
  getAllBookings: () => Promise<Booking[]>;
  
  // Notifications Management
  addNotification: (title: string, message: string, type: Notification['type'], userId: string) => void;
  markNotificationRead: (id: string) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  
  const [selectedLocation, setSelectedLocationState] = useState<Location | null>(null);
  const [bookingDetails, setBookingDetailsState] = useState<Partial<Booking> | null>(null);
  const [paymentInfo, setPaymentInfoState] = useState<Partial<PaymentInfo> | null>(null);

  // Initialize DB in localStorage
  const initializeDB = () => {
    // 1. Initial Locations
    if (!localStorage.getItem('locations_db')) {
      localStorage.setItem('locations_db', JSON.stringify(initialLocations));
    }
    
    // 2. Initial Slots
    if (!localStorage.getItem('slots_db')) {
      const generatedSlots: ParkingSlot[] = [];
      const locs = JSON.parse(localStorage.getItem('locations_db') || '[]');
      locs.forEach((loc: Location) => {
        // Generate 10 slots for each location
        for (let i = 1; i <= 5; i++) {
          generatedSlots.push({ id: `s_${loc.id}_sedan_${i}`, locationId: loc.id, slotNumber: `A${i}`, vehicleType: 'sedan', status: 'available' });
        }
        for (let i = 1; i <= 3; i++) {
          generatedSlots.push({ id: `s_${loc.id}_suv_${i}`, locationId: loc.id, slotNumber: `B${i}`, vehicleType: 'suv', status: 'available' });
        }
        for (let i = 1; i <= 2; i++) {
          generatedSlots.push({ id: `s_${loc.id}_bike_${i}`, locationId: loc.id, slotNumber: `C${i}`, vehicleType: 'bike', status: 'available' });
        }
      });
      localStorage.setItem('slots_db', JSON.stringify(generatedSlots));
    }

    // 3. Initial Bookings
    if (!localStorage.getItem('bookings_db')) {
      localStorage.setItem('bookings_db', JSON.stringify([]));
    }

    // 4. Initial Payments
    if (!localStorage.getItem('payments_db')) {
      localStorage.setItem('payments_db', JSON.stringify([]));
    }

    // 5. Initial Notifications
    if (!localStorage.getItem('notifications_db')) {
      localStorage.setItem('notifications_db', JSON.stringify([]));
    }
  };

  const loadAllData = async () => {
    if (API_MODE) {
      try {
        const locResponse = await apiClient.get('/locations');
        setLocations(locResponse.data);
        
        const slotResponse = await apiClient.get('/slots');
        setSlots(slotResponse.data);

        const bookingResponse = await apiClient.get('/bookings');
        setCompletedBookings(bookingResponse.data);

        const paymentResponse = await apiClient.get('/payments');
        setPayments(paymentResponse.data);

        const notifResponse = await apiClient.get('/notifications');
        setNotifications(notifResponse.data);
      } catch (err) {
        console.error('Failed to load API data', err);
      }
    } else {
      // Mock Load
      setLocations(JSON.parse(localStorage.getItem('locations_db') || '[]'));
      setSlots(JSON.parse(localStorage.getItem('slots_db') || '[]'));
      setCompletedBookings(JSON.parse(localStorage.getItem('bookings_db') || '[]'));
      setPayments(JSON.parse(localStorage.getItem('payments_db') || '[]'));
      setNotifications(JSON.parse(localStorage.getItem('notifications_db') || '[]'));
    }
  };

  useEffect(() => {
    initializeDB();
    loadAllData();
  }, []);

  const setSelectedLocation = (location: Location | null) => {
    setSelectedLocationState(location);
  };

  const setBookingDetails = (details: Partial<Booking>) => {
    setBookingDetailsState(details);
  };

  const setPaymentInfo = (info: Partial<PaymentInfo>) => {
    setPaymentInfoState(info);
  };

  const clearBooking = () => {
    setSelectedLocationState(null);
    setBookingDetailsState(null);
    setPaymentInfoState(null);
  };

  const addNotification = (title: string, message: string, type: Notification['type'], userId: string) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    if (!API_MODE) {
      const currentNotifs = JSON.parse(localStorage.getItem('notifications_db') || '[]');
      const updatedNotifs = [newNotif, ...currentNotifs];
      localStorage.setItem('notifications_db', JSON.stringify(updatedNotifs));
      setNotifications(updatedNotifs);
    } else {
      // In API mode we would post to API or get updated via socket
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const markNotificationRead = (id: string) => {
    if (!API_MODE) {
      const currentNotifs = JSON.parse(localStorage.getItem('notifications_db') || '[]');
      const updatedNotifs = currentNotifs.map((n: Notification) => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('notifications_db', JSON.stringify(updatedNotifs));
      setNotifications(updatedNotifs);
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  // Complete Booking Transaction
  const completeBooking = async (): Promise<Booking | null> => {
    if (!selectedLocation || !bookingDetails || !paymentInfo) {
      return null;
    }

    const bookingId = Math.random().toString(36).substr(2, 9);
    const transactionId = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
    const paymentId = 'PAY-' + Math.random().toString(36).substr(2, 9);
    const slotNumber = bookingDetails.slotNumber || 'A1';

    // Calculate rates
    const hourlyRate = selectedLocation.rate.hourly;
    const sTime = bookingDetails.startTime ? new Date(bookingDetails.startTime) : new Date();
    const eTime = bookingDetails.endTime ? new Date(bookingDetails.endTime) : new Date(Date.now() + 3600000);
    const hours = Math.ceil((eTime.getTime() - sTime.getTime()) / (1000 * 60 * 60)) || 1;
    const amount = hourlyRate * hours;

    const qrData = JSON.stringify({
      bookingId,
      vehicleNumber: bookingDetails.vehicleNumber,
      location: selectedLocation.name,
      slot: slotNumber,
      entry: bookingDetails.startTime,
      exit: bookingDetails.endTime
    });

    const newBooking: Booking = {
      id: bookingId,
      userId: bookingDetails.userId || 'guest',
      locationId: selectedLocation.id,
      vehicleType: bookingDetails.vehicleType || 'sedan',
      vehicleNumber: bookingDetails.vehicleNumber || '',
      startTime: bookingDetails.startTime || new Date().toISOString(),
      endTime: bookingDetails.endTime || new Date(Date.now() + 3600000).toISOString(),
      slotNumber,
      amount,
      status: 'confirmed',
      paymentId,
      qrCodeData: qrData,
      createdAt: new Date().toISOString()
    };

    const newPayment: PaymentInfo = {
      id: paymentId,
      bookingId,
      amount,
      method: paymentInfo.method || 'card',
      upiId: paymentInfo.upiId,
      cardNumber: paymentInfo.cardNumber ? `**** **** **** ${paymentInfo.cardNumber.slice(-4)}` : undefined,
      cardName: paymentInfo.cardName,
      status: 'success',
      transactionId,
      createdAt: new Date().toISOString()
    };

    if (API_MODE) {
      try {
        const response = await apiClient.post('/bookings', { booking: newBooking, payment: newPayment });
        await loadAllData();
        return response.data;
      } catch (err) {
        console.error('API booking failure', err);
        return null;
      }
    } else {
      // Mock Transaction
      // 1. Add Booking
      const dbBookings = JSON.parse(localStorage.getItem('bookings_db') || '[]');
      dbBookings.push(newBooking);
      localStorage.setItem('bookings_db', JSON.stringify(dbBookings));

      // 2. Add Payment
      const dbPayments = JSON.parse(localStorage.getItem('payments_db') || '[]');
      dbPayments.push(newPayment);
      localStorage.setItem('payments_db', JSON.stringify(dbPayments));

      // 3. Mark Slot as Occupied
      const dbSlots = JSON.parse(localStorage.getItem('slots_db') || '[]');
      const updatedSlots = dbSlots.map((s: ParkingSlot) => {
        if (s.locationId === selectedLocation.id && s.slotNumber === slotNumber) {
          return { ...s, status: 'occupied' };
        }
        return s;
      });
      localStorage.setItem('slots_db', JSON.stringify(updatedSlots));

      // 4. Update available slot count in Location
      const dbLocations = JSON.parse(localStorage.getItem('locations_db') || '[]');
      const updatedLocations = dbLocations.map((l: Location) => {
        if (l.id === selectedLocation.id) {
          return { ...l, availableSlots: Math.max(0, l.availableSlots - 1) };
        }
        return l;
      });
      localStorage.setItem('locations_db', JSON.stringify(updatedLocations));

      // Save states
      setCompletedBookings(dbBookings);
      setPayments(dbPayments);
      setSlots(updatedSlots);
      setLocations(updatedLocations);

      // Create Success Notifications
      addNotification(
        'Booking Confirmed!',
        `Your slot ${slotNumber} at ${selectedLocation.name} is reserved.`,
        'booking_confirm',
        newBooking.userId
      );
      
      addNotification(
        'Payment Success!',
        `₹${amount} paid successfully via ${newPayment.method.toUpperCase()}. Transaction ID: ${transactionId}`,
        'payment_success',
        newBooking.userId
      );

      return newBooking;
    }
  };

  // Locations Management CRUD
  const addLocation = async (loc: Omit<Location, 'id'>): Promise<boolean> => {
    const newLoc: Location = {
      id: 'loc_' + Math.random().toString(36).substr(2, 9),
      ...loc
    };
    if (API_MODE) {
      try {
        await apiClient.post('/locations', newLoc);
        await loadAllData();
        return true;
      } catch (err) {
        return false;
      }
    } else {
      const dbLocations = JSON.parse(localStorage.getItem('locations_db') || '[]');
      dbLocations.push(newLoc);
      localStorage.setItem('locations_db', JSON.stringify(dbLocations));
      setLocations(dbLocations);

      // Also generate default slots for this new location
      const dbSlots = JSON.parse(localStorage.getItem('slots_db') || '[]');
      const newSlots: ParkingSlot[] = [];
      const sedanCapacity = Math.floor(newLoc.totalSlots * 0.5);
      const suvCapacity = Math.floor(newLoc.totalSlots * 0.3);
      const bikeCapacity = newLoc.totalSlots - sedanCapacity - suvCapacity;

      for (let i = 1; i <= sedanCapacity; i++) {
        newSlots.push({ id: `s_${newLoc.id}_sedan_${i}`, locationId: newLoc.id, slotNumber: `A${i}`, vehicleType: 'sedan', status: 'available' });
      }
      for (let i = 1; i <= suvCapacity; i++) {
        newSlots.push({ id: `s_${newLoc.id}_suv_${i}`, locationId: newLoc.id, slotNumber: `B${i}`, vehicleType: 'suv', status: 'available' });
      }
      for (let i = 1; i <= bikeCapacity; i++) {
        newSlots.push({ id: `s_${newLoc.id}_bike_${i}`, locationId: newLoc.id, slotNumber: `C${i}`, vehicleType: 'bike', status: 'available' });
      }

      const updatedSlots = [...dbSlots, ...newSlots];
      localStorage.setItem('slots_db', JSON.stringify(updatedSlots));
      setSlots(updatedSlots);
      return true;
    }
  };

  const updateLocation = async (loc: Location): Promise<boolean> => {
    if (API_MODE) {
      try {
        await apiClient.put(`/locations/${loc.id}`, loc);
        await loadAllData();
        return true;
      } catch (err) {
        return false;
      }
    } else {
      const dbLocations = JSON.parse(localStorage.getItem('locations_db') || '[]');
      const updated = dbLocations.map((l: Location) => l.id === loc.id ? loc : l);
      localStorage.setItem('locations_db', JSON.stringify(updated));
      setLocations(updated);
      return true;
    }
  };

  const deleteLocation = async (id: string): Promise<boolean> => {
    if (API_MODE) {
      try {
        await apiClient.delete(`/locations/${id}`);
        await loadAllData();
        return true;
      } catch (err) {
        return false;
      }
    } else {
      const dbLocations = JSON.parse(localStorage.getItem('locations_db') || '[]');
      const filteredLocs = dbLocations.filter((l: Location) => l.id !== id);
      localStorage.setItem('locations_db', JSON.stringify(filteredLocs));
      setLocations(filteredLocs);

      // Filter slots
      const dbSlots = JSON.parse(localStorage.getItem('slots_db') || '[]');
      const filteredSlots = dbSlots.filter((s: ParkingSlot) => s.locationId !== id);
      localStorage.setItem('slots_db', JSON.stringify(filteredSlots));
      setSlots(filteredSlots);
      return true;
    }
  };

  // Slots Management CRUD
  const getSlotsByLocation = (locId: string): ParkingSlot[] => {
    return slots.filter(s => s.locationId === locId);
  };

  const addSlot = async (slot: Omit<ParkingSlot, 'id'>): Promise<boolean> => {
    const newSlot: ParkingSlot = {
      id: 'slot_' + Math.random().toString(36).substr(2, 9),
      ...slot
    };
    if (API_MODE) {
      try {
        await apiClient.post('/slots', newSlot);
        await loadAllData();
        return true;
      } catch (err) {
        return false;
      }
    } else {
      const dbSlots = JSON.parse(localStorage.getItem('slots_db') || '[]');
      dbSlots.push(newSlot);
      localStorage.setItem('slots_db', JSON.stringify(dbSlots));
      setSlots(dbSlots);

      // Update location capacity
      const dbLocations = JSON.parse(localStorage.getItem('locations_db') || '[]');
      const updatedLocs = dbLocations.map((l: Location) => {
        if (l.id === slot.locationId) {
          return {
            ...l,
            totalSlots: l.totalSlots + 1,
            availableSlots: slot.status === 'available' ? l.availableSlots + 1 : l.availableSlots
          };
        }
        return l;
      });
      localStorage.setItem('locations_db', JSON.stringify(updatedLocs));
      setLocations(updatedLocs);
      return true;
    }
  };

  const updateSlotStatus = async (id: string, status: ParkingSlot['status']): Promise<boolean> => {
    if (API_MODE) {
      try {
        await apiClient.put(`/slots/${id}/status`, { status });
        await loadAllData();
        return true;
      } catch (err) {
        return false;
      }
    } else {
      const dbSlots = JSON.parse(localStorage.getItem('slots_db') || '[]');
      let oldStatus: ParkingSlot['status'] = 'available';
      let locId = '';
      
      const updated = dbSlots.map((s: ParkingSlot) => {
        if (s.id === id) {
          oldStatus = s.status;
          locId = s.locationId;
          return { ...s, status };
        }
        return s;
      });
      
      localStorage.setItem('slots_db', JSON.stringify(updated));
      setSlots(updated);

      // Adjust available slot counts on the location
      if (locId && oldStatus !== status) {
        const dbLocations = JSON.parse(localStorage.getItem('locations_db') || '[]');
        const updatedLocs = dbLocations.map((l: Location) => {
          if (l.id === locId) {
            let availableDiff = 0;
            // If it became available
            if (status === 'available') availableDiff = 1;
            // If it was available and now is occupied/maintenance
            else if (oldStatus === 'available') availableDiff = -1;
            
            return { ...l, availableSlots: Math.max(0, Math.min(l.totalSlots, l.availableSlots + availableDiff)) };
          }
          return l;
        });
        localStorage.setItem('locations_db', JSON.stringify(updatedLocs));
        setLocations(updatedLocs);
      }
      return true;
    }
  };

  const deleteSlot = async (id: string): Promise<boolean> => {
    if (API_MODE) {
      try {
        await apiClient.delete(`/slots/${id}`);
        await loadAllData();
        return true;
      } catch (err) {
        return false;
      }
    } else {
      const dbSlots = JSON.parse(localStorage.getItem('slots_db') || '[]');
      const slotToDelete = dbSlots.find((s: ParkingSlot) => s.id === id);
      if (!slotToDelete) return false;

      const filtered = dbSlots.filter((s: ParkingSlot) => s.id !== id);
      localStorage.setItem('slots_db', JSON.stringify(filtered));
      setSlots(filtered);

      // Update location totals
      const dbLocations = JSON.parse(localStorage.getItem('locations_db') || '[]');
      const updatedLocs = dbLocations.map((l: Location) => {
        if (l.id === slotToDelete.locationId) {
          return {
            ...l,
            totalSlots: Math.max(0, l.totalSlots - 1),
            availableSlots: slotToDelete.status === 'available' ? Math.max(0, l.availableSlots - 1) : l.availableSlots
          };
        }
        return l;
      });
      localStorage.setItem('locations_db', JSON.stringify(updatedLocs));
      setLocations(updatedLocs);
      return true;
    }
  };

  // Booking Cancellations & Approvals
  const cancelBooking = async (id: string): Promise<boolean> => {
    if (API_MODE) {
      try {
        await apiClient.post(`/bookings/${id}/cancel`);
        await loadAllData();
        return true;
      } catch (err) {
        return false;
      }
    } else {
      const dbBookings = JSON.parse(localStorage.getItem('bookings_db') || '[]');
      const booking = dbBookings.find((b: Booking) => b.id === id);
      if (!booking) return false;

      const updated = dbBookings.map((b: Booking) => b.id === id ? { ...b, status: 'cancelled' } : b);
      localStorage.setItem('bookings_db', JSON.stringify(updated));
      setCompletedBookings(updated);

      // Restore slot to available
      const dbSlots = JSON.parse(localStorage.getItem('slots_db') || '[]');
      const updatedSlots = dbSlots.map((s: ParkingSlot) => {
        if (s.locationId === booking.locationId && s.slotNumber === booking.slotNumber) {
          return { ...s, status: 'available' };
        }
        return s;
      });
      localStorage.setItem('slots_db', JSON.stringify(updatedSlots));
      setSlots(updatedSlots);

      // Restore Location Count
      const dbLocations = JSON.parse(localStorage.getItem('locations_db') || '[]');
      const updatedLocations = dbLocations.map((l: Location) => {
        if (l.id === booking.locationId) {
          return { ...l, availableSlots: Math.min(l.totalSlots, l.availableSlots + 1) };
        }
        return l;
      });
      localStorage.setItem('locations_db', JSON.stringify(updatedLocations));
      setLocations(updatedLocations);

      // Trigger cancel notification
      addNotification(
        'Booking Cancelled',
        `Your booking for slot ${booking.slotNumber} has been cancelled successfully.`,
        'booking_cancel',
        booking.userId
      );

      return true;
    }
  };

  const approveBooking = async (id: string): Promise<boolean> => {
    if (API_MODE) {
      try {
        await apiClient.post(`/bookings/${id}/approve`);
        await loadAllData();
        return true;
      } catch (err) {
        return false;
      }
    } else {
      const dbBookings = JSON.parse(localStorage.getItem('bookings_db') || '[]');
      const updated = dbBookings.map((b: Booking) => b.id === id ? { ...b, status: 'confirmed' } : b);
      localStorage.setItem('bookings_db', JSON.stringify(updated));
      setCompletedBookings(updated);
      return true;
    }
  };

  const getAllBookings = async (): Promise<Booking[]> => {
    if (API_MODE) {
      const res = await apiClient.get('/bookings');
      return res.data;
    }
    return JSON.parse(localStorage.getItem('bookings_db') || '[]');
  };

  return (
    <BookingContext.Provider
      value={{
        locations,
        slots,
        completedBookings,
        notifications,
        payments,
        selectedLocation,
        bookingDetails,
        paymentInfo,
        setSelectedLocation,
        setBookingDetails,
        setPaymentInfo,
        completeBooking,
        clearBooking,
        addLocation,
        updateLocation,
        deleteLocation,
        getSlotsByLocation,
        addSlot,
        updateSlotStatus,
        deleteSlot,
        cancelBooking,
        approveBooking,
        getAllBookings,
        addNotification,
        markNotificationRead
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};