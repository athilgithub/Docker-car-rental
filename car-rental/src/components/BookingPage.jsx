import React, { useState, useEffect } from 'react';
import CarMap from './CarMap';
import CarAvailability from './CarAvailability';
import './BookingPage.css';

const BookingPage = ({ car, onBookingSuccess, onBackToCars }) => {
  console.log('BookingPage received car:', car);

  const [bookingDetails, setBookingDetails] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    pickupLocation: '',
    dropoffLocation: '',
    driverOption: 'with-driver',
    drivingLicense: '',
    licenseExpiry: '',
    licenseState: '',
    bookingType: 'daily', // 'hourly' or 'daily'
    paymentMethod: 'online', // 'online' or 'cash'
  });

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [errors, setErrors] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [rentalDuration, setRentalDuration] = useState({ days: 0, hours: 0 });
  const [user, setUser] = useState(null);
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [bookingReference, setBookingReference] = useState('');
  const [isCarAvailable, setIsCarAvailable] = useState(true);

  // Auto-refresh logic for booking status/details
  useEffect(() => {
    const fetchAvailability = () => {
      // TODO: Add API call here to check car availability
      // Example: fetch(`/api/cars/${car.id}/availability?...`).then(...)
      // You can update isCarAvailable state here
    };
    const interval = setInterval(fetchAvailability, 10000);
    return () => clearInterval(interval);
  }, [car]);
  // Persist booking confirmation to prevent loss on re-render
  useEffect(() => {
    const savedBooking = localStorage.getItem('currentBooking');
    if (savedBooking) {
      try {
        const booking = JSON.parse(savedBooking);
        console.log('🔄 Checking saved booking:', booking);
        
        // Only restore if:
        // 1. Booking is confirmed
        // 2. It's for the same car
        // 3. It's less than 1 hour old (to prevent stale data)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const isSameCar = booking.carId === car._id || booking.carId === car.id;
        const isRecent = booking.timestamp && booking.timestamp > oneHourAgo;
        
        if (booking.isConfirmed && isSameCar && isRecent) {
          console.log('✅ Restoring booking for same car');
          setIsConfirmed(true);
          setBookingReference(booking.reference);
          setPaymentStatus(booking.paymentStatus);
          setTotalPrice(booking.totalPrice || 0);
          setRentalDuration(booking.rentalDuration || { days: 0, hours: 0 });
        } else {
          console.log('🗑️ Clearing stale or different car booking');
          localStorage.removeItem('currentBooking');
        }
      } catch (err) {
        console.warn('⚠️ Failed to restore booking:', err);
        localStorage.removeItem('currentBooking');
      }
    }
  }, [car]);

  // Save booking state when confirmed
  useEffect(() => {
    if (isConfirmed && bookingReference) {
      const bookingData = {
        isConfirmed,
        carId: car._id || car.id,
        carName: car.name,
        reference: bookingReference,
        paymentStatus,
        totalPrice,
        rentalDuration,
        timestamp: Date.now()
      };
      console.log('💾 Saving booking to localStorage:', bookingData);
      localStorage.setItem('currentBooking', JSON.stringify(bookingData));
    }
  }, [isConfirmed, bookingReference, paymentStatus, totalPrice, rentalDuration, car]);

  // Debug: Monitor isConfirmed state changes
  useEffect(() => {
    console.log('🔔 isConfirmed state changed:', isConfirmed);
    console.log('🔔 Current bookingReference:', bookingReference);
    console.log('🔔 Current paymentStatus:', paymentStatus);
  }, [isConfirmed, bookingReference, paymentStatus]);

  // Check if user is logged in
  useEffect(() => {
    const userData = localStorage.getItem('user');
    console.log('📦 Raw user data from localStorage:', userData);
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('✅ Parsed user:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('❌ Failed to parse user data:', error);
      }
    } else {
      console.warn('⚠️ No user data in localStorage');
    }
  }, []);

  // Calculate total price based on dates and booking type
  useEffect(() => {
    if (bookingDetails.startDate && bookingDetails.endDate && car) {
      const startDateTime = bookingDetails.startTime 
        ? new Date(`${bookingDetails.startDate}T${bookingDetails.startTime}`)
        : new Date(bookingDetails.startDate);
      
      const endDateTime = bookingDetails.endTime 
        ? new Date(`${bookingDetails.endDate}T${bookingDetails.endTime}`)
        : new Date(bookingDetails.endDate);

      const timeDiff = endDateTime.getTime() - startDateTime.getTime();
      
      if (bookingDetails.bookingType === 'hourly') {
        // Hourly calculation
        const hourDiff = Math.ceil(timeDiff / (1000 * 3600));
        const hourlyRate = car.hourlyRate || Math.ceil(car.price / 24); // Daily rate / 24
        
        if (hourDiff > 0) {
          setTotalPrice(hourDiff * hourlyRate);
          setRentalDuration({ hours: hourDiff, days: 0 });
        } else {
          setTotalPrice(hourlyRate);
          setRentalDuration({ hours: 1, days: 0 });
        }
      } else {
        // Daily calculation
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (dayDiff > 0) {
          setTotalPrice(dayDiff * car.price);
          setRentalDuration({ days: dayDiff, hours: 0 });
        } else {
          setTotalPrice(car.price);
          setRentalDuration({ days: 1, hours: 0 });
        }
      }
    }
  }, [bookingDetails.startDate, bookingDetails.endDate, bookingDetails.startTime, bookingDetails.endTime, bookingDetails.bookingType, car]);

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  // Helper function to get proper image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-car.svg';
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) return imagePath;
    
    // If it's a backend upload path, prepend server URL
    if (imagePath.startsWith('/uploads/')) {
      return `http://192.168.37.130:3001${imagePath}`;
    }
    
    // If it's a static image name, use public folder
    return `/${imagePath}`;
  };

  // Handle missing car prop
  if (!car) {
    return (
      <div className="booking-page">
        <div className="container" style={{ padding: "2rem", textAlign: "center" }}>
          <div className="booking-error">
            <h2>🚗 No car selected for booking</h2>
            <p>Please select a car from our collection to proceed with booking.</p>
          </div>
          <button className="btn btn-primary" onClick={onBackToCars}>
            Browse Cars
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvailabilityChange = (available) => {
    setIsCarAvailable(available);
  };

  const validateForm = () => {
    console.log('🔍 Starting form validation...');
    const newErrors = {};
    
    if (!bookingDetails.startDate) {
      newErrors.startDate = 'Start date is required';
      console.log('❌ Validation error: Start date missing');
    } else if (new Date(bookingDetails.startDate) < new Date(today)) {
      newErrors.startDate = 'Start date cannot be in the past';
      console.log('❌ Validation error: Start date in past');
    }
    
    if (!bookingDetails.endDate) {
      newErrors.endDate = 'End date is required';
      console.log('❌ Validation error: End date missing');
    } else if (new Date(bookingDetails.endDate) <= new Date(bookingDetails.startDate)) {
      newErrors.endDate = 'End date must be after start date';
      console.log('❌ Validation error: End date before start date');
    }
    
    if (!bookingDetails.pickupLocation.trim()) {
      newErrors.pickupLocation = 'Pickup location is required';
      console.log('❌ Validation error: Pickup location missing');
    }

    // Check car availability (only block if explicitly marked as unavailable)
    // Don't block if availability check failed or is still loading
    if (isCarAvailable === false) {
      newErrors.availability = 'This car is not available for the selected dates';
      console.log('❌ Validation error: Car unavailable');
      alert('⚠️ This car appears to be unavailable for your selected dates. Please choose different dates or another car.');
    }

    // Validate driving license for self-drive option
    if (bookingDetails.driverOption === 'self-drive') {
      console.log('🔍 Validating self-drive license details...');
      
      if (!bookingDetails.drivingLicense.trim()) {
        newErrors.drivingLicense = 'Driving license number is required for self-drive';
        console.log('❌ Validation error: License number missing');
      } else if (bookingDetails.drivingLicense.length < 10) {
        newErrors.drivingLicense = 'Please enter a valid driving license number';
        console.log('❌ Validation error: License number too short');
      }
      
      if (!bookingDetails.licenseExpiry) {
        newErrors.licenseExpiry = 'License expiry date is required';
        console.log('❌ Validation error: License expiry missing');
      } else if (new Date(bookingDetails.licenseExpiry) <= new Date()) {
        newErrors.licenseExpiry = 'Driving license must be valid (not expired)';
        console.log('❌ Validation error: License expired');
      }
      
      if (!bookingDetails.licenseState.trim()) {
        newErrors.licenseState = 'License issuing state is required';
        console.log('❌ Validation error: License state missing');
      }
    }
    
    console.log('📊 Total validation errors found:', Object.keys(newErrors).length);
    console.log('📋 Error details:', newErrors);
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('✅ Form is valid:', isValid);
    
    return isValid;
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const createRazorpayOrder = async (amount) => {
    try {
      console.log('🔄 Creating order for amount:', amount);
      
      const response = await fetch('http://192.168.37.130:3001/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          receipt: `order_${Date.now()}`
        })
      });
      
      const responseData = await response.json();
      console.log('📊 Order creation response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return responseData;
    } catch (error) {
      console.error('❌ Error creating Razorpay order:', error);
      throw new Error(`Payment setup failed: ${error.message}`);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    console.log('🔘 Confirm Booking button clicked!');
    console.log('📋 Current booking details:', bookingDetails);
    console.log('👤 User:', user);
    console.log('💰 Payment method:', bookingDetails.paymentMethod);
    
    const isValid = validateForm();
    console.log('✅ Form validation result:', isValid);
    console.log('❌ Validation errors:', errors);
    
    if (!isValid) {
      console.error('❌ Form validation failed. Errors:', errors);
      alert('Please fill in all required fields correctly:\n' + Object.values(errors).join('\n'));
      return;
    }

    if (!user) {
      alert('Please log in to make a booking');
      return;
    }

    // Handle cash payment differently
    if (bookingDetails.paymentMethod === 'cash') {
      console.log('💵 Proceeding with cash payment...');
      await handleCashPayment();
      return;
    }

    console.log('🔄 Initiating online payment process...');
    
    // Check if Razorpay SDK is loaded
    if (!window.Razorpay) {
      console.error('❌ Razorpay SDK not loaded');
      alert('Payment system is not ready. Please refresh the page and try again.');
      return;
    }

    setPaymentStatus('processing');

    try {
      // Test backend connectivity first
      const testResponse = await fetch('http://192.168.37.130:3001/api/test-razorpay');
      const testData = await testResponse.json();
      console.log('🔧 Razorpay config test:', testData);
      
      if (!testData.configured) {
        throw new Error('Payment gateway is not properly configured. Please contact support.');
      }

      // Create Razorpay order
      console.log('💰 Total price for payment:', totalPrice);
      const order = await createRazorpayOrder(totalPrice);
      setPaymentOrderId(order.id);
      
      console.log('📋 Order created, opening Razorpay modal...');

      const options = {
        key: 'rzp_test_Ri3dUwgsmbbH8K', // Updated to match backend test key
        amount: order.amount,
        currency: order.currency,
        name: 'CarRental Pro',
        description: `Booking for ${car.name}`,
        image: '/logo192.png',
        order_id: order.id,
        prefill: {
          name: user.name || user.email,
          email: user.email,
          contact: user.phone || '9999999999'
        },
        notes: {
          car_id: car.id,
          car_name: car.name,
          pickup_location: bookingDetails.pickupLocation,
          driver_option: bookingDetails.driverOption
        },
        theme: {
          color: '#667eea'
        },
        handler: async function (response) {
          console.log('✅ Payment successful:', response);
          await handlePaymentSuccess(response);
        },
        modal: {
          ondismiss: function() {
            console.log('❌ Payment modal dismissed by user');
            setPaymentStatus('pending');
          },
          confirm_close: true
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        console.error('❌ Payment failed:', response.error);
        setPaymentStatus('failed');
        const errorMsg = response.error?.description || response.error?.reason || 'Payment failed';
        alert(`Payment failed: ${errorMsg}`);
        setTimeout(() => setPaymentStatus('pending'), 3000);
      });

      console.log('🎯 Opening Razorpay payment modal...');
      rzp.open();
      
    } catch (error) {
      console.error('❌ Payment initiation error:', error);
      setPaymentStatus('failed');
      
      // Show more specific error message
      let errorMessage = 'Failed to initiate payment. ';
      if (error.message.includes('fetch')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.message.includes('not configured')) {
        errorMessage += 'Payment system is not set up. Please contact support.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      alert(errorMessage);
      setTimeout(() => setPaymentStatus('pending'), 3000);
    }
  };

  const handleCashPayment = async () => {
    try {
      setPaymentStatus('processing');
      console.log('💵 Processing cash payment booking...');
      console.log('Car object:', car);
      console.log('User:', user);
      console.log('Booking Details:', bookingDetails);

      // Validate required fields before sending
      if (!car || (!car.id && !car._id)) {
        throw new Error('Car information is missing');
      }
      if (!user || (!user.sub && !user.email)) {
        throw new Error('User information is missing');
      }
      if (!bookingDetails.startDate || !bookingDetails.endDate || !bookingDetails.pickupLocation) {
        throw new Error('Please fill in all required booking details');
      }

      const bookingData = {
        carId: car._id || car.id,  // Try both _id and id
        carName: car.name,
        carPrice: car.price,
        userId: user.sub || user.email,
        userEmail: user.email,
        startDate: bookingDetails.startDate,
        endDate: bookingDetails.endDate,
        startTime: bookingDetails.startTime,
        endTime: bookingDetails.endTime,
        pickupLocation: bookingDetails.pickupLocation,
        dropoffLocation: bookingDetails.dropoffLocation || bookingDetails.pickupLocation,
        driverOption: bookingDetails.driverOption,
        drivingLicense: bookingDetails.driverOption === 'self-drive' ? bookingDetails.drivingLicense : null,
        licenseExpiry: bookingDetails.driverOption === 'self-drive' ? bookingDetails.licenseExpiry : null,
        licenseState: bookingDetails.driverOption === 'self-drive' ? bookingDetails.licenseState : null,
        bookingType: bookingDetails.bookingType,
        rentalDuration: rentalDuration,
        totalPrice: totalPrice,
        bookingDate: new Date().toISOString(),
        status: "pending", // Cash bookings are pending until payment received
        paymentMethod: 'cash',
        paymentStatus: 'success', // Match backend logic for cash bookings
      };

      console.log('📤 Sending booking data:', bookingData);
      console.log('📤 Validating: carId=', bookingData.carId, 'userId=', bookingData.userId);

      const response = await fetch('http://192.168.37.130:3001/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      console.log('📥 Response status:', response.status);
      const result = await response.json();
      console.log('📥 Response data:', result);

      if (response.ok) {
        console.log('✅ Cash booking created successfully');
        console.log('✅ Booking ID:', result._id || result.id);
        
        // Generate booking reference
        const reference = `BK${Date.now().toString().slice(-8)}`;
        console.log('📝 Generated reference:', reference);
        
        // Update all states together to ensure they're set
        console.log('✅ Updating all states...');
        setBookingReference(reference);
        setPaymentStatus('success');
        
        // Use functional update to ensure latest state
        console.log('✅ Setting isConfirmed to TRUE - Invoice should show now');
        setIsConfirmed(prev => {
          console.log('🔄 isConfirmed update - prev:', prev, '→ new: true');
          return true;
        });
        
        setShowSuccessToast(true);
        
        // 🎉 Trigger celebration animation
        triggerCelebration();
        
        // Scroll to top
        console.log('📜 Scrolling to top');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Hide toast after 5 seconds
        setTimeout(() => setShowSuccessToast(false), 5000);
        
        // DON'T call onBookingSuccess - it navigates away!
        // User should stay on invoice page to see confirmation
        console.log('✅ Booking complete - staying on invoice page');
        
      } else {
        // Show backend error details if available
        let errorMsg = result.error || 'Failed to create cash booking';
        if (result.details) errorMsg += `\nDetails: ${result.details}`;
        if (result.fields && Array.isArray(result.fields) && result.fields.length > 0) {
          errorMsg += '\nField errors:';
          result.fields.forEach(f => {
            errorMsg += `\n- ${f.field}: ${f.message}`;
          });
        }
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Cash booking error:', error);
      setPaymentStatus('failed');
      alert(`Cash booking failed: ${error.message}`);
      setTimeout(() => setPaymentStatus('pending'), 3000);
    }
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    const bookingData = {
      carId: car._id || car.id,  // Try both _id and id
      carName: car.name,
      carPrice: car.price,
      userId: user.sub || user.email,
      userEmail: user.email,
      startDate: bookingDetails.startDate,
      endDate: bookingDetails.endDate,
      startTime: bookingDetails.startTime,
      endTime: bookingDetails.endTime,
      pickupLocation: bookingDetails.pickupLocation,
      dropoffLocation: bookingDetails.dropoffLocation || bookingDetails.pickupLocation,
      driverOption: bookingDetails.driverOption,
      drivingLicense: bookingDetails.driverOption === 'self-drive' ? bookingDetails.drivingLicense : null,
      licenseExpiry: bookingDetails.driverOption === 'self-drive' ? bookingDetails.licenseExpiry : null,
      licenseState: bookingDetails.driverOption === 'self-drive' ? bookingDetails.licenseState : null,
      bookingType: bookingDetails.bookingType,
      rentalDuration: rentalDuration,
      totalPrice: totalPrice,
      bookingDate: new Date().toISOString(),
      status: "confirmed",
      paymentId: paymentResponse.razorpay_payment_id,
      orderId: paymentResponse.razorpay_order_id,
      signature: paymentResponse.razorpay_signature
    };

    try {
      const response = await fetch('http://192.168.37.130:3001/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      
      if (response.ok) {
        // Generate booking reference
        const reference = `BK${Date.now().toString().slice(-8)}`;
        setBookingReference(reference);
        
        setPaymentStatus('success');
        setIsConfirmed(true);
        setShowSuccessToast(true);
        
        // 🎉 Trigger celebration animation
        triggerCelebration();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Hide toast after 5 seconds
        setTimeout(() => setShowSuccessToast(false), 5000);
        
        // DON'T call onBookingSuccess - it navigates away!
        // User should stay on invoice page to see confirmation
        console.log('✅ Online payment complete - staying on invoice page');
        
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Booking failed');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setPaymentStatus('failed');
      alert('Booking failed: ' + err.message);
      setTimeout(() => setPaymentStatus('pending'), 3000);
    }
  };

  // 🎉 Celebration Animation Functions
  const triggerCelebration = () => {
    setShowCelebration(true);
    
    // Create confetti particles
    const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    const newConfetti = [];
    
    for (let i = 0; i < 100; i++) {
      newConfetti.push({
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 3,
        backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        rotation: Math.random() * 360,
      });
    }
    
    setConfetti(newConfetti);
    
    // Hide celebration popup after 5 seconds
    setTimeout(() => {
      setShowCelebration(false);
    }, 5000);
    
    // Clear confetti after animation
    setTimeout(() => {
      setConfetti([]);
    }, 6000);
  };

  // Download invoice as text file
  const downloadInvoice = () => {
    const invoiceText = `
═══════════════════════════════════════
       CAR RENTAL BOOKING INVOICE
═══════════════════════════════════════

Booking Reference: ${bookingReference}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}

───────────────────────────────────────
CUSTOMER DETAILS
───────────────────────────────────────
Name: ${user?.name || 'Guest'}
Email: ${user?.email || 'N/A'}

───────────────────────────────────────
BOOKING DETAILS
───────────────────────────────────────
Car: ${car.name}
Category: ${car.category || 'N/A'}
Booking Type: ${bookingDetails.bookingType === 'daily' ? 'Daily' : 'Hourly'}

Pickup Location: ${bookingDetails.pickupLocation}
${bookingDetails.dropoffLocation ? `Dropoff Location: ${bookingDetails.dropoffLocation}` : ''}

Start Date: ${bookingDetails.startDate}
End Date: ${bookingDetails.endDate}
${bookingDetails.bookingType === 'hourly' ? `Start Time: ${bookingDetails.startTime}\nEnd Time: ${bookingDetails.endTime}` : ''}

Duration: ${bookingDetails.bookingType === 'daily' 
  ? `${rentalDuration.days} day${rentalDuration.days > 1 ? 's' : ''}` 
  : `${rentalDuration.hours} hour${rentalDuration.hours > 1 ? 's' : ''}`}

Driver Option: ${bookingDetails.driverOption === 'with-driver' ? 'With Driver' : 'Self Drive'}
${bookingDetails.driverOption === 'self-drive' ? `License Number: ${bookingDetails.drivingLicense || 'N/A'}` : ''}

───────────────────────────────────────
PAYMENT DETAILS
───────────────────────────────────────
Rate: ₹${bookingDetails.bookingType === 'daily' ? car.price : (car.hourlyRate || Math.ceil(car.price / 24))} per ${bookingDetails.bookingType === 'daily' ? 'day' : 'hour'}
Subtotal: ₹${totalPrice.toLocaleString()}
Tax (0%): ₹0
Total Amount: ₹${totalPrice.toLocaleString()}

Payment Method: ${bookingDetails.paymentMethod === 'cash' ? 'Cash on Pickup' : 'Online Payment'}
Payment Status: ${bookingDetails.paymentMethod === 'cash' ? 'Pending' : 'Paid'}

${bookingDetails.paymentMethod === 'cash' ? `
⚠ IMPORTANT: Please bring ₹${totalPrice.toLocaleString()} in cash
   at the time of pickup.
` : ''}

───────────────────────────────────────
TERMS & CONDITIONS
───────────────────────────────────────
• Valid ID and driving license required
• Fuel charges not included
• Late return may incur additional charges
• Vehicle must be returned in same condition
• Security deposit may be required

───────────────────────────────────────
CONTACT INFORMATION
───────────────────────────────────────
Email: support@carrental.com
Phone: +91-1234567890
Website: www.carrental.com

Thank you for choosing our service!
═══════════════════════════════════════
    `;

    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${bookingReference}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Share invoice via email
  const shareViaEmail = () => {
    const subject = `Car Rental Booking - ${bookingReference}`;
    const body = `
Hi,

Your car rental booking has been confirmed!

Booking Reference: ${bookingReference}
Car: ${car.name}
Pickup: ${bookingDetails.pickupLocation}
Dates: ${bookingDetails.startDate} to ${bookingDetails.endDate}
Total Amount: ₹${totalPrice.toLocaleString()}

Please keep this reference number for your records.

Thank you!
    `.trim();
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Debug: Log state before render decision
  console.log('🔍 RENDER CHECK:', {
    isConfirmed,
    bookingReference,
    paymentStatus,
    showCelebration,
    hasUser: !!user,
    hasCar: !!car
  });

  if (isConfirmed) {
    console.log('🎉 INVOICE RENDERING - isConfirmed is TRUE');
    console.log('📋 Booking Reference:', bookingReference);
    console.log('🚗 Car:', car);
    console.log('👤 User:', user);
    
    const currentDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return (
      <div className="booking-page booking-confirmation">
        {/* Self-drive pickup instructions at the top */}
        {bookingDetails.driverOption === 'self-drive' && (
          <div className="pickup-instructions" style={{
            background: '#e3f7e3',
            border: '2px solid #4caf50',
            borderRadius: '8px',
            padding: '1.5rem',
            margin: '2rem auto 2rem auto',
            textAlign: 'center',
            color: '#2e7d32',
            fontWeight: '500',
            maxWidth: '600px',
            boxShadow: '0 2px 12px rgba(76,175,80,0.08)'
          }}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'0.5rem'}}>
              <svg width="40" height="40" viewBox="0 0 52 52" style={{marginRight:'0.5rem'}}>
                <circle cx="26" cy="26" r="25" fill="#4caf50"/>
                <path d="M14.1 27.2l7.1 7.2 16.7-16.8" stroke="#fff" strokeWidth="4" fill="none"/>
              </svg>
              <h2 style={{margin:0,fontWeight:'bold',fontSize:'1.5rem'}}>Self-Drive Pickup Details</h2>
            </div>
            <p style={{fontSize:'1.1rem'}}>Please collect your vehicle at:</p>
            <div style={{fontSize: '1.25rem', fontWeight: 'bold', margin: '0.5rem 0'}}>
              {bookingDetails.pickupLocation}
            </div>
 ❌ Cash booking error: Error: Failed to create booking
    handleCashPayment BookingPage.jsx:541           <p>Show your booking reference and valid driving license at the counter.</p>
            <div style={{marginTop:'0.7rem',fontSize:'1rem'}}>
              <span style={{fontWeight:'bold'}}>Need help?</span> Call <span style={{fontWeight:'bold',color:'#1b5e20'}}>+91 6381014350</span> <br/>
              <span style={{fontWeight:'bold'}}>Email:</span> <a href="mailto:athils.23cse@kongu.edu" style={{color:'#388e3c',textDecoration:'underline'}}>athils.23cse@kongu.edu</a>
            </div>
          </div>
        )}

        {/* 🎉 Celebration Popup */}
        {showCelebration && (
          <div className="celebration-overlay">
            <div className="celebration-popup">
              <div className="celebration-icon">🎉</div>
              <h1 className="celebration-title">Congratulations!</h1>
              <p className="celebration-message">You have successfully booked your car!</p>
              <div className="celebration-checkmark">
                <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                  <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                  <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
              <div className="celebration-details">
                <p className="celebration-ref">Booking Reference</p>
                <p className="celebration-ref-number">{bookingReference}</p>
              </div>
            </div>
          </div>
        )}

        {/* 🎊 Confetti Animation */}
        {confetti.length > 0 && (
          <div className="confetti-container">
            {confetti.map((particle) => (
              <div
                key={particle.id}
                className="confetti-particle"
                style={{
                  left: `${particle.left}%`,
                  animationDelay: `${particle.animationDelay}s`,
                  backgroundColor: particle.backgroundColor,
                  transform: `rotate(${particle.rotation}deg)`,
                }}
              />
            ))}
          </div>
        )}

        <div className="invoice-container">
          {/* Invoice Header */}
          <div className="invoice-header">
            <div className="company-info">
              <h1 className="company-name">🚗 Car Rental Service</h1>
              <p className="company-tagline">Your Journey, Our Priority</p>
            </div>
            <div className="invoice-meta">
              <h2 className="invoice-title">BOOKING INVOICE</h2>
              <div className="invoice-number">#{bookingReference}</div>
              <p className="invoice-date">Date: {currentDate}</p>
              <p className="invoice-time">Time: {currentTime}</p>
            </div>
          </div>

          {/* Success Banner */}
          <div className="success-banner">
            <div className="success-icon">✅</div>
            <div className="success-content">
              <h3>Booking Confirmed!</h3>
              <p>Your reservation has been successfully processed</p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="invoice-section">
            <h3 className="section-title">Customer Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{user?.name || 'Guest'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Booking Reference:</span>
                <span className="info-value reference-highlight">{bookingReference}</span>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="invoice-section">
            <h3 className="section-title">Booking Details</h3>
            <div className="booking-details-table">
              <table className="details-table">
                <tbody>
                  <tr>
                    <td className="detail-label">Vehicle</td>
                    <td className="detail-value"><strong>{car.name}</strong></td>
                  </tr>
                  <tr>
                    <td className="detail-label">Category</td>
                    <td className="detail-value">{car.category || 'Standard'}</td>
                  </tr>
                  <tr>
                    <td className="detail-label">Booking Type</td>
                    <td className="detail-value">
                      <span className={`booking-type-badge ${bookingDetails.bookingType}`}>
                        {bookingDetails.bookingType === 'daily' ? '📅 Daily' : '🕐 Hourly'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="detail-label">Pickup Location</td>
                    <td className="detail-value">📍 {bookingDetails.pickupLocation}</td>
                  </tr>
                  {bookingDetails.dropoffLocation && (
                    <tr>
                      <td className="detail-label">Dropoff Location</td>
                      <td className="detail-value">📍 {bookingDetails.dropoffLocation}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="detail-label">Start Date</td>
                    <td className="detail-value">{bookingDetails.startDate}</td>
                  </tr>
                  <tr>
                    <td className="detail-label">End Date</td>
                    <td className="detail-value">{bookingDetails.endDate}</td>
                  </tr>
                  {bookingDetails.bookingType === 'hourly' && (
                    <>
                      <tr>
                        <td className="detail-label">Start Time</td>
                        <td className="detail-value">{bookingDetails.startTime}</td>
                      </tr>
                      <tr>
                        <td className="detail-label">End Time</td>
                        <td className="detail-value">{bookingDetails.endTime}</td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td className="detail-label">Duration</td>
                    <td className="detail-value">
                      <strong>
                        {bookingDetails.bookingType === 'daily' 
                          ? `${rentalDuration.days} day${rentalDuration.days > 1 ? 's' : ''}`
                          : `${rentalDuration.hours} hour${rentalDuration.hours > 1 ? 's' : ''}`
                        }
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="detail-label">Driver Option</td>
                    <td className="detail-value">
                      {bookingDetails.driverOption === 'with-driver' ? '👤 With Driver' : '🚗 Self Drive'}
                    </td>
                  </tr>
                  {bookingDetails.driverOption === 'self-drive' && bookingDetails.drivingLicense && (
                    <tr>
                      <td className="detail-label">License Number</td>
                      <td className="detail-value">{bookingDetails.drivingLicense}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="invoice-section payment-section">
            <h3 className="section-title">Payment Summary</h3>
            <div className="payment-table">
              <div className="payment-row">
                <span>Rate per {bookingDetails.bookingType === 'daily' ? 'day' : 'hour'}:</span>
                <span>₹{bookingDetails.bookingType === 'daily' ? car.price : (car.hourlyRate || Math.ceil(car.price / 24))}</span>
              </div>
              <div className="payment-row">
                <span>Subtotal ({bookingDetails.bookingType === 'daily' 
                  ? `${rentalDuration.days} day${rentalDuration.days > 1 ? 's' : ''}`
                  : `${rentalDuration.hours} hour${rentalDuration.hours > 1 ? 's' : ''}`
                }):</span>
                <span>₹{totalPrice.toLocaleString()}</span>
              </div>
              <div className="payment-row">
                <span>Tax (GST 0%):</span>
                <span>₹0</span>
              </div>
              <div className="payment-row total-row">
                <span>Total Amount:</span>
                <span>₹{totalPrice.toLocaleString()}</span>
              </div>
              <div className="payment-row payment-method-row">
                <span>Payment Method:</span>
                <span className={`payment-badge ${bookingDetails.paymentMethod}`}>
                  {bookingDetails.paymentMethod === 'cash' ? '💵 Cash on Pickup' : '💳 Online Payment'}
                </span>
              </div>
              <div className="payment-row">
                <span>Payment Status:</span>
                <span className={`status-badge ${bookingDetails.paymentMethod === 'cash' ? 'pending' : 'paid'}`}>
                  {bookingDetails.paymentMethod === 'cash' ? '⏳ Pending' : '✅ Paid'}
                </span>
              </div>
            </div>
          </div>

          {/* Cash Payment Alert */}
          {bookingDetails.paymentMethod === 'cash' && (
            <div className="cash-alert">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <h4>Payment Required at Pickup</h4>
                <p>Please bring <strong>₹{totalPrice.toLocaleString()}</strong> in cash at the time of vehicle pickup.</p>
                <p className="alert-note">Carry a valid ID and driving license (if self-driving).</p>
              </div>
            </div>
          )}

          {/* Important Notes */}
          <div className="invoice-section notes-section">
            <h3 className="section-title">Important Information</h3>
            <ul className="notes-list">
              <li>✓ Please arrive 15 minutes before your scheduled pickup time</li>
              <li>✓ Valid government-issued ID is mandatory</li>
              <li>✓ Driving license required for self-drive bookings</li>
              <li>✓ Vehicle must be returned in the same condition</li>
              <li>✓ Fuel charges are not included in the rental price</li>
              <li>✓ Late return may incur additional charges</li>
              <li>✓ Security deposit may be required at pickup</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="invoice-actions">
            <button className="action-btn primary-btn" onClick={() => window.print()}>
              🖨️ Print Invoice
            </button>
            <button className="action-btn secondary-btn" onClick={downloadInvoice}>
              📥 Download
            </button>
            <button className="action-btn secondary-btn" onClick={shareViaEmail}>
              📧 Email
            </button>
            <button className="action-btn outline-btn" onClick={() => {
              // Clear saved booking before going back
              localStorage.removeItem('currentBooking');
              console.log('🗑️ Cleared saved booking');
              if (onBackToCars) onBackToCars();
            }}>
              🚗 Book Another Car
            </button>
          </div>

          {/* Footer */}
          <div className="invoice-footer">
            <p className="footer-text">Thank you for choosing our car rental service!</p>
            <p className="footer-contact">
              📞 +91-1234567890 | 📧 support@carrental.com | 🌐 www.carrental.com
            </p>
            <p className="footer-note">
              For any queries regarding this booking, please quote your reference number: <strong>{bookingReference}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      {/* Car Unavailable Alert */}
      {isCarAvailable === false && (
        <div className="car-unavailable-alert" style={{background:'#ffeaea',color:'#b71c1c',padding:'1rem',borderRadius:'8px',margin:'1rem 0',textAlign:'center',fontWeight:'bold',fontSize:'1.1rem'}}>
          🚫 This car is currently unavailable for your selected dates. Please choose different dates or another car.
        </div>
      )}
      {/* Loading Overlay */}
      {paymentStatus === 'processing' && (
        <div className="booking-loading-overlay">
          <div className="booking-loading-spinner">
            <div className="spinner"></div>
            <h3>Processing Your Booking...</h3>
            <p>Please wait while we confirm your reservation</p>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="booking-success-toast">
          <div className="toast-icon">✅</div>
          <div className="toast-content">
            <h4>Booking Confirmed!</h4>
            <p>Your booking reference: {bookingReference}</p>
          </div>
        </div>
      )}

      <div className="cars-hero">
        <div className="container">
          <h1>Booking for {car.name}</h1>
          <p>Complete your reservation in a few simple steps.</p>
        </div>
      </div>
      <div className="booking-content container">
        <div className="booking-layout">
          <div className="booking-form-section">
            <h2 className="form-title">Enter Your Details</h2>
            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label htmlFor="pickupLocation">Pickup Location *</label>
                <input
                  type="text"
                  id="pickupLocation"
                  name="pickupLocation"
                  value={bookingDetails.pickupLocation}
                  onChange={handleInputChange}
                  placeholder="Enter pickup location"
                  className={errors.pickupLocation ? 'error' : ''}
                  required
                />
                {errors.pickupLocation && <span className="error-message">{errors.pickupLocation}</span>}
              </div>

              {/* Booking Type Selection */}
              <div className="form-group">
                <label>Booking Type *</label>
                <div className="booking-type-options">
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="daily-booking"
                      name="bookingType"
                      value="daily"
                      checked={bookingDetails.bookingType === 'daily'}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="daily-booking" className="radio-label-container">
                      <span className="radio-label">📅 Daily Rental</span>
                      <small className="radio-description">₹{car.price}/day</small>
                    </label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="hourly-booking"
                      name="bookingType"
                      value="hourly"
                      checked={bookingDetails.bookingType === 'hourly'}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="hourly-booking" className="radio-label-container">
                      <span className="radio-label">⏱️ Hourly Rental</span>
                      <small className="radio-description">₹{car.hourlyRate || Math.ceil(car.price / 24)}/hour</small>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={bookingDetails.startDate}
                  onChange={handleInputChange}
                  min={today}
                  className={errors.startDate ? 'error' : ''}
                  required
                />
                {errors.startDate && <span className="error-message">{errors.startDate}</span>}
              </div>

              {bookingDetails.bookingType === 'hourly' && (
                <div className="form-group">
                  <label htmlFor="startTime">Start Time *</label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={bookingDetails.startTime}
                    onChange={handleInputChange}
                    className={errors.startTime ? 'error' : ''}
                    required
                  />
                  {errors.startTime && <span className="error-message">{errors.startTime}</span>}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="endDate">End Date *</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={bookingDetails.endDate}
                  onChange={handleInputChange}
                  min={bookingDetails.startDate || today}
                  className={errors.endDate ? 'error' : ''}
                  required
                />
                {errors.endDate && <span className="error-message">{errors.endDate}</span>}
              </div>

              {bookingDetails.bookingType === 'hourly' && (
                <div className="form-group">
                  <label htmlFor="endTime">End Time *</label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={bookingDetails.endTime}
                    onChange={handleInputChange}
                    className={errors.endTime ? 'error' : ''}
                    required
                  />
                  {errors.endTime && <span className="error-message">{errors.endTime}</span>}
                </div>
              )}

              {/* Rental Duration Display */}
              {(rentalDuration.days > 0 || rentalDuration.hours > 0) && (
                <div className="rental-duration-display">
                  <div className="duration-badge">
                    <span className="duration-icon">📆</span>
                    <span className="duration-text">
                      {bookingDetails.bookingType === 'daily' 
                        ? `${rentalDuration.days} Day${rentalDuration.days > 1 ? 's' : ''}`
                        : `${rentalDuration.hours} Hour${rentalDuration.hours > 1 ? 's' : ''}`
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Car Availability Check */}
              {bookingDetails.startDate && bookingDetails.endDate && (
                <CarAvailability
                  carId={car.id}
                  startDate={bookingDetails.startDate}
                  endDate={bookingDetails.endDate}
                  onAvailabilityChange={handleAvailabilityChange}
                />
              )}
              
              <div className="form-group">
                <label htmlFor="dropoffLocation">Drop-off Location</label>
                <input
                  type="text"
                  id="dropoffLocation"
                  name="dropoffLocation"
                  value={bookingDetails.dropoffLocation}
                  onChange={handleInputChange}
                  placeholder="Enter drop-off location (optional)"
                />
                <small className="help-text">Leave empty to use same as pickup location</small>
              </div>

              <div className="form-group">
                <label>Driver Option *</label>
                <div className="driver-options">
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="with-driver"
                      name="driverOption"
                      value="with-driver"
                      checked={bookingDetails.driverOption === 'with-driver'}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="with-driver" className="radio-label-container">
                      <span className="radio-label">🧑‍✈️ With Driver</span>
                      <small className="radio-description">Professional driver included</small>
                    </label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="self-drive"
                      name="driverOption"
                      value="self-drive"
                      checked={bookingDetails.driverOption === 'self-drive'}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="self-drive" className="radio-label-container">
                      <span className="radio-label">🚗 Self Drive</span>
                      <small className="radio-description">Drive yourself (requires valid license)</small>
                    </label>
                  </div>
                </div>
              </div>

              {bookingDetails.driverOption === 'self-drive' && (
                <div className="license-details">
                  <h3 className="license-title">📄 Driving License Details</h3>
                  <p className="license-info">Please provide your valid driving license information for verification.</p>
                  
                  <div className="form-group">
                    <label htmlFor="drivingLicense">Driving License Number *</label>
                    <input
                      type="text"
                      id="drivingLicense"
                      name="drivingLicense"
                      value={bookingDetails.drivingLicense}
                      onChange={handleInputChange}
                      placeholder="e.g., MH01 20240012345"
                      className={errors.drivingLicense ? 'error' : ''}
                      maxLength="20"
                      pattern="[A-Z0-9\s-]+"
                      title="Enter a valid driving license number (letters, numbers, spaces, and hyphens only)"
                      required
                    />
                    <small className="help-text">Format: State Code + Numbers (e.g., MH01 20240012345)</small>
                    {errors.drivingLicense && <span className="error-message">{errors.drivingLicense}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="licenseExpiry">License Expiry Date *</label>
                    <input
                      type="date"
                      id="licenseExpiry"
                      name="licenseExpiry"
                      value={bookingDetails.licenseExpiry}
                      onChange={handleInputChange}
                      min={today}
                      className={errors.licenseExpiry ? 'error' : ''}
                      required
                    />
                    {errors.licenseExpiry && <span className="error-message">{errors.licenseExpiry}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="licenseState">License Issuing State *</label>
                    <select
                      id="licenseState"
                      name="licenseState"
                      value={bookingDetails.licenseState}
                      onChange={handleInputChange}
                      className={errors.licenseState ? 'error' : ''}
                      required
                    >
                      <option value="">Select State</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Odisha">Odisha</option>
                      <option value="Assam">Assam</option>
                      <option value="Bihar">Bihar</option>
                    </select>
                    {errors.licenseState && <span className="error-message">{errors.licenseState}</span>}
                  </div>
                </div>
              )}

              {totalPrice > 0 && (
                <div className="price-calculation">
                  <h3>💰 Price Breakdown</h3>
                  <div className="price-item">
                    <span>
                      {bookingDetails.bookingType === 'daily' 
                        ? `Rate per day:`
                        : `Rate per hour:`
                      }
                    </span>
                    <span>₹{bookingDetails.bookingType === 'daily' ? car.price : (car.hourlyRate || Math.ceil(car.price / 24))}</span>
                  </div>
                  <div className="price-item">
                    <span>Duration:</span>
                    <span>
                      {bookingDetails.bookingType === 'daily' 
                        ? `${rentalDuration.days} day${rentalDuration.days > 1 ? 's' : ''}`
                        : `${rentalDuration.hours} hour${rentalDuration.hours > 1 ? 's' : ''}`
                      }
                    </span>
                  </div>
                  <div className="price-item total">
                    <span>Total Amount:</span>
                    <span>₹{totalPrice}</span>
                  </div>
                </div>
              )}

              {!user && (
                <div className="login-required">
                  <h3>🔐 Login Required</h3>
                  <p>Please log in to your account to make a booking.</p>
                  <p>You can use Google Sign-In for quick access.</p>
                </div>
              )}

              {/* Payment Method Selection */}
              <div className="form-group">
                <label>Payment Method *</label>
                <div className="payment-method-options">
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="online-payment"
                      name="paymentMethod"
                      value="online"
                      checked={bookingDetails.paymentMethod === 'online'}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="online-payment" className="radio-label-container">
                      <span className="radio-label">💳 Online Payment</span>
                      <small className="radio-description">Pay securely via Razorpay</small>
                    </label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="cash-payment"
                      name="paymentMethod"
                      value="cash"
                      checked={bookingDetails.paymentMethod === 'cash'}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="cash-payment" className="radio-label-container">
                      <span className="radio-label">💵 Cash Payment</span>
                      <small className="radio-description">Pay at pickup location</small>
                    </label>
                  </div>
                </div>
              </div>

              {bookingDetails.paymentMethod === 'cash' && (
                <div className="cash-payment-info">
                  <div className="info-banner">
                    <span className="info-icon">ℹ️</span>
                    <div className="info-content">
                      <strong>Cash Payment Instructions:</strong>
                      <ul>
                        <li>Payment will be collected at the time of vehicle pickup</li>
                        <li>Please bring exact change if possible</li>
                        <li>Booking will be confirmed after payment verification</li>
                        <li>Keep your booking reference handy</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {bookingDetails.paymentMethod === 'online' && (
                <>
                  <h2 className="payment-title">💳 Secure Online Payment</h2>
                  <div className="payment-gateway">
                    <div className="payment-info">
                      <div className="payment-secure">
                        <span className="secure-icon">🔒</span>
                        <span>Secured by Razorpay</span>
                      </div>
                      <div className="payment-methods">
                        <span>💳 Cards</span>
                        <span>🏦 NetBanking</span>
                        <span>📱 UPI</span>
                        <span>💰 Wallets</span>
                      </div>
                    </div>
                    
                    {paymentStatus === 'pending' && (
                      <button type="submit" className="btn btn-primary payment-btn" disabled={!user || isCarAvailable === false}>
                        {user ? (
                          isCarAvailable === false ? (
                            'Car Unavailable'
                          ) : (
                            <>
                              <span className="razorpay-icon">⚡</span>
                              Pay ₹{totalPrice || car.price} with Razorpay
                            </>
                          )
                        ) : (
                          'Please Login to Book'
                        )}
                      </button>
                    )}
                    {paymentStatus === 'processing' && (
                      <div className="payment-processing">
                        <div className="spinner"></div>
                        <span>Setting up secure payment...</span>
                      </div>
                    )}
                    {paymentStatus === 'failed' && (
                      <div className="payment-failed">
                        <span>❌ Payment setup failed. Please try again.</span>
                        <button 
                          type="button" 
                          className="btn btn-secondary retry-btn"
                      onClick={() => {
                        console.log('🔄 Retrying payment...');
                        setPaymentStatus('pending');
                      }}
                    >
                      Retry Payment
                    </button>
                  </div>
                )}
              </div>
                </>
              )}

              {bookingDetails.paymentMethod === 'cash' && (
                <div className="cash-booking-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={!user || paymentStatus === 'processing' || isCarAvailable === false}
                    style={{
                      opacity: paymentStatus === 'processing' || isCarAvailable === false ? 0.7 : 1,
                      cursor: paymentStatus === 'processing' || isCarAvailable === false ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {paymentStatus === 'processing' ? (
                      <>
                        <span>⏳</span>
                        Processing...
                      </>
                    ) : user ? (
                      isCarAvailable === false ? (
                        'Car Unavailable'
                      ) : (
                        <>
                          <span>✓</span>
                          Confirm Booking (Pay at Pickup)
                        </>
                      )
                    ) : (
                      'Please Login to Book'
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
          <div className="car-summary-section">
            <div className="car-card">
              <img 
                src={getImageUrl(car.image)} 
                alt={car.name} 
                className="car-image-summary" 
                style={{ height: '300px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/placeholder-car.svg';
                }}
              />
              <div className="car-details">
                <h3 className="car-name">{car.name}</h3>
                <p className="car-category">{car.category}</p>
                <div className="car-specs">
                  <div className="spec"><span>👥 {car.seats} Seats</span></div>
                  <div className="spec"><span>🚪 {car.doors} Doors</span></div>
                  <div className="spec"><span>⛽ {car.fuel}</span></div>
                  <div className="spec"><span>⚙️ {car.transmission}</span></div>
                </div>
                <div className="price-summary">
                  <span className="price-amount">₹{car.price}</span>
                  <span className="price-period">/day</span>
                </div>
              </div>
            </div>
            {/* GPS Map for car tracking */}
            <div style={{ marginTop: '2rem' }}>
              <h3>Car GPS Location</h3>
              <CarMap location={{
                lat: car.latitude || 28.6139, // fallback to Delhi
                lng: car.longitude || 77.2090
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;