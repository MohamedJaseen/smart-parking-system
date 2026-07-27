import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import QRCode from 'qrcode';
import { CheckCircle2, Download, Printer, ArrowLeft, Calendar, Clock, MapPin, Car } from 'lucide-react';

const BookingConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const locationState = useLocation();
  const { completedBookings, locations, payments } = useBooking();
  const { user } = useAuth();
  
  const [qrUrl, setQrUrl] = useState<string>('');
  const [booking, setBooking] = useState<any>(null);
  const [parkingLoc, setParkingLoc] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    // Attempt to get booking from navigation state or use last completed booking
    let currentBooking = locationState.state?.booking;
    if (!currentBooking && completedBookings.length > 0) {
      currentBooking = completedBookings[completedBookings.length - 1];
    }

    if (currentBooking) {
      setBooking(currentBooking);
      
      const loc = locations.find(l => l.id === currentBooking.locationId);
      setParkingLoc(loc);

      const pay = payments.find(p => p.bookingId === currentBooking.id);
      setPayment(pay);

      // Generate QR Code containing booking details
      const qrData = currentBooking.qrCodeData || JSON.stringify({
        bookingId: currentBooking.id,
        vehicleNumber: currentBooking.vehicleNumber,
        location: loc?.name || 'Chennai Parking',
        slot: currentBooking.slotNumber,
        entry: currentBooking.startTime,
        exit: currentBooking.endTime
      });

      QRCode.toDataURL(qrData, { width: 200, margin: 2 }, (err, url) => {
        if (!err) setQrUrl(url);
      });
    }
  }, [completedBookings, locations, payments, locationState.state]);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-28">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">No active booking details found.</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `Parking_QR_${booking.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20 print:pt-0 print:pb-0 print:bg-white">
      <div className="container mx-auto px-4 max-w-2xl">
        
        {/* Back Button (hidden during print) */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium transition-colors print:hidden"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </button>

        {/* Success Card Header (hidden during print) */}
        <div className="text-center mb-8 print:hidden">
          <div className="inline-flex items-center justify-center bg-green-100 text-green-600 p-3 rounded-full mb-3">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Confirmed!</h1>
          <p className="text-gray-600 mt-1">Your parking ticket is generated successfully.</p>
        </div>

        {/* Ticket Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-none">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-5 text-center">
            <h2 className="text-xl font-bold tracking-wide uppercase">Chennai Parking E-Ticket</h2>
            <p className="text-xs text-blue-200 mt-1">Scan at entrance and exit checkpoints</p>
          </div>

          {/* Ticket Body */}
          <div className="p-6 md:p-8 space-y-8">
            
            {/* Booking Reference ID */}
            <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-4">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Booking ID</span>
                <p className="text-lg font-bold text-gray-800 tracking-wide">{booking.id.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Slot Number</span>
                <p className="text-2xl font-extrabold text-blue-600">{booking.slotNumber}</p>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded-lg border border-gray-100">
              {qrUrl ? (
                <img src={qrUrl} alt="Booking QR Code" className="w-48 h-48 border border-gray-200 p-2 bg-white rounded-md shadow-sm" />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded">
                  <span className="text-sm text-gray-400">Generating QR...</span>
                </div>
              )}
              <span className="text-xs text-gray-400 mt-2 font-mono">{booking.id}</span>
            </div>

            {/* Ticket Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Location */}
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Parking Spot</span>
                  <p className="font-semibold text-gray-800">{parkingLoc?.name || 'Chennai Parking Spot'}</p>
                  <p className="text-xs text-gray-500">{parkingLoc?.address}</p>
                </div>
              </div>

              {/* Vehicle info */}
              <div className="flex items-start">
                <Car className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vehicle Details</span>
                  <p className="font-semibold text-gray-800 font-mono">{booking.vehicleNumber.toUpperCase()}</p>
                  <p className="text-xs text-gray-500 capitalize">{booking.vehicleType} type vehicle</p>
                </div>
              </div>

              {/* Start Time */}
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Entry Time</span>
                  <p className="text-sm font-semibold text-gray-800">{formatDateTime(booking.startTime)}</p>
                </div>
              </div>

              {/* End Time */}
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Exit Time</span>
                  <p className="text-sm font-semibold text-gray-800">{formatDateTime(booking.endTime)}</p>
                </div>
              </div>

            </div>

            {/* Payment Summary */}
            <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment Mode</span>
                <p className="text-sm font-semibold text-gray-700 capitalize">
                  {payment?.method === 'card' ? '💳 Credit/Debit Card' : '📱 UPI payment'}
                </p>
                {payment?.transactionId && (
                  <p className="text-[10px] text-gray-400 font-mono">TXN: {payment.transactionId}</p>
                )}
              </div>
              <div className="sm:text-right">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Charge</span>
                <p className="text-xl font-extrabold text-blue-900">₹{booking.amount.toFixed(2)}</p>
              </div>
            </div>

          </div>

          {/* Ticket Footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
            <button
              onClick={handleDownloadQR}
              className="w-full sm:w-auto px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition flex items-center justify-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Download QR
            </button>
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto px-5 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 transition flex items-center justify-center"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </button>
          </div>
        </div>

        {/* Warning / Instructions */}
        <div className="mt-6 text-center text-xs text-gray-400 leading-relaxed print:hidden">
          <p>Please make sure to have this QR code ready on your device when arriving at the facility.</p>
          <p>Cancellations are allowed up to 1 hour before scheduled entry time.</p>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
