import axios from 'axios';

const API_BASE_URL = "http://3.111.153.106:5000/api";

// Create an Axios instance with default configurations
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // Optional: Set a timeout for requests
    headers: {
        "Content-Type": "application/json",
    },
});

// Define API methods

export const fetchAvailableRooms = async (durationOfStay, checkInDateTime, probableCheckOutDateTime) => {
  try {
    const response = await apiClient.get("/available-rooms", {
      params: {
        durationOfStay,
        checkInDateTime,
        probableCheckOutDateTime
      },
    });
    return response.data.available_rooms; // Return the available rooms
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    throw error; // Rethrow to handle it in the calling component
  }
};

export const fetchBookingsInDateRange = async (dateRange) => {
  try {
    const response = await apiClient.post('/bookings-by-date-range', dateRange);
    return response.data; // Return the available rooms
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    throw error; // Rethrow to handle it in the calling component
  }
};

export const fetchGSTDetails = async (bookingId, guestGSTNumber, companyName) => {
  try {
    const response = await apiClient.get("/retrieve-gst-bill-number", {
      params: {
        bookingId,
        guestGSTNumber,
        companyName
      },
    });
    return response.data; // Returns gst_bill_no, guest_gst_no, guest_company_name, gst_bill_date
  } catch (error) {
    console.error("Error fetching GST Bill Number:", error);
    throw error;
  }
};



export const fetchUserDetails = async (phoneNumber) => {
  console.log(phoneNumber)
  if (!phoneNumber || phoneNumber.length === 0) {
    throw new Error('Invalid phone number'); // Handle invalid input gracefully
  }

  try {
    const response = await apiClient.get("/existing_customers", {
      params: {
        phoneNumber
      },
    });
    return response.data; // Return the response data
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error; // Rethrow the error for the calling function to handle
  }
};

export const fetchBookings = async () => {
    try {
        const response = await apiClient.get("/bookings");
        return response.data;
    } catch (error) {
        console.error("Error fetching bookings:", error);
        throw error;
    }
};

// Fetch room status based on selected date and window period
export const fetchRoomStatus = async (selectedDate, windowPeriod) => {
    try {
        console.log(selectedDate)
        console.log(windowPeriod)
        const response = await apiClient.get("/room/status", {
          params: {
                checkInDateTime: selectedDate,
                booking_window: windowPeriod,
          },
        });
        return response.data; // Return the API response
    } catch (error) {
        console.error("Error fetching room data:", error);
        throw error; // Rethrow to handle errors in calling code
    }
};

export const fetchBookingDashboard = async (fromDate, toDate) => {
    try {
        const response = await apiClient.get("/room/dashboard", {
          params: {
                startDate: fromDate,
                endDate: toDate
          },
        });
        return response.data; // Return the API response
    } catch (error) {
        console.error("Error fetching room data:", error);
        throw error; // Rethrow to handle errors in calling code
    }
};


// Function to fetch payment details
export const fetchPaymentDetails = async (startDate, endDate) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get_payment`, {
      params: { startDate, endDate },
    });
    return response.data ;
  } catch (error) {
    console.error("Error ;l fetching payment data:", error);
    throw error; // Re-throw error to handle in calling component
  }
};
//Search Booking
export const searchBooking = async ({ bookingId, phoneNumber, roomNumber, checkInDate, bookingStatus }) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/search_booking`, {
            params: {
                bookingId,
                phoneNumber,
                roomNumber,
                checkInDate,
                bookingStatus
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching booking details:", error);
        throw error;
    }
};

//Api to Cancel or Checkout booking
export const checkoutOrCancelBooking = async (bookingId,checkOutDateTime, stayDuration, bookingStatus) => {
    try {
        console.log(bookingId)
        const response = await apiClient.post('/update_booking', {
            bookingId,
            checkOutDateTime,
            stayDuration,
            bookingStatus
        });
        return response.data; // Return data for success handling
    } catch (error) {
        throw error.response ? error.response.data : new Error("Unknown error occurred"); // Handle error details
    }
};


//Api to pay or refund
export const addOrRefundPayment = async (bookingId, transactionType, {paymentAmount, paymentMode, paymentNote,paymentDate}) => {
    try {
        console.log(bookingId)
        const response = await apiClient.post('/update_payment', {
            bookingId,
            transactionType,
            paymentAmount,
            paymentMode,
            paymentNote,
            paymentDate
        });
        return response.data; // Return data for success handling
    } catch (error) {
        throw error.response ? error.response.data : new Error("Unknown error occurred"); // Handle error details
    }
};


// API to create a booking
export const createBooking = async (bookingData) => {
    const response = await apiClient.post('/create-booking', bookingData);
    return response.data;
};

// API to update a booking
export const updateBooking = async (bookingData) => {
    const response = await apiClient.post('/update-booking', bookingData);
    return response.data;
};

// API to Login
export const doLogin = async (loginData) => {
    const response = await apiClient.post('/login', loginData);
    return response.data;
};

// API to Logout
export const doLogout = async () => {
    const response = await apiClient.post('/logout');
    console.log(response)
    return response;
};

// API to Add User
export const addUser = async (signupData) => {
    const response = await apiClient.post('/add_user', signupData);
    return response.data;
};

// API to send a message
export const sendMessage = async (messageData) => {
    const response = await apiClient.post('/send-message', messageData, {
        timeout: 120000, // timeout in milliseconds (15 seconds)
    });
    return response.data;
};

// Add more methods as needed
export default apiClient;
