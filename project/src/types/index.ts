export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  vehicles?: Vehicle[];
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  type: string; // sedan, suv, bike, hatchback
  modelName?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  totalSlots: number;
  availableSlots: number;
  image?: string;
  rate: {
    hourly: number;
    daily: number;
  };
}

export interface ParkingSlot {
  id: string;
  locationId: string;
  slotNumber: string;
  vehicleType: string; // sedan, suv, bike, hatchback
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
}

export interface VehicleType {
  id: string;
  name: string;
  icon: string;
  priceMultiplier: number;
}

export interface Booking {
  id: string;
  userId: string;
  locationId: string;
  vehicleType: string;
  vehicleNumber: string;
  startTime: string; // Store as ISO strings for clean JSON serialization
  endTime: string;   // Store as ISO strings
  slotNumber: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentId?: string;
  qrCodeData?: string;
  createdAt?: string;
}

export interface PaymentInfo {
  id: string;
  bookingId: string;
  amount: number;
  method: 'upi' | 'card';
  upiId?: string;
  cardNumber?: string;
  cardName?: string;
  status: 'success' | 'failure';
  transactionId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking_confirm' | 'booking_cancel' | 'payment_success' | 'payment_fail';
  timestamp: string;
  read: boolean;
}