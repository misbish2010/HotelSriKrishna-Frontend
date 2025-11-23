import axios from 'axios';

const API_BASE_URL = "http://3.111.153.106:5000/api";
//const API_BASE_URL = "http://localhost:5000/api";
// Create an Axios instance with default configurations
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // Optional: Set a timeout for requests
    headers: {
        "Content-Type": "application/json",
    },
});


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


// API to create a booking
export const createBooking = async (bookingData) => {
    const response = await apiClient.post('/create-booking', bookingData);
    return response.data;
};

//API to fetch User Detail if existing
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


// Define API to Fetch Available Rooms
export const fetchAvailableRooms = async (
  durationOfStay,
  checkInDateTime,
  probableCheckOutDateTime,
  excludeBookingId = null
) => {
  try {
    const params = {
      durationOfStay,
      checkInDateTime,
      probableCheckOutDateTime,
    };

    if (excludeBookingId) {
      params.excludeBookingId = excludeBookingId;
    }

    const response = await apiClient.get("/available-rooms", { params });
    return response.data.available_rooms;
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    throw error;
  }
};


// Define API to Fetch All Rooms
export const fetchAllRooms = async (
) => {
  try {
    const response = await apiClient.get("/all-rooms");
    return response.data.all_rooms;
  } catch (error) {
    console.error("Error fetching all rooms:", error);
    throw error;
  }
};


//Search Booking
export const searchBooking = async ({ bookingId, phoneNumber, roomNumber, checkInDate, bookingStatus }) => {
    try {
        const response = await apiClient.get(`${API_BASE_URL}/search_booking`, {
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


// API to update a booking
export const updateBooking = async (bookingData) => {
    console.log(bookingData)
    const response = await apiClient.post('/update-booking', bookingData);
    return response.data;
};


// ✅ Cancel a booking
//export async function cancelBooking(bookingId) {
//  try {
//    const res = await apiClient.post(`/bookings/${bookingId}/cancel`, {
//        });
//    return res.data;
//  } catch (err) {
//    console.error("Error cancelling booking:", err);
//    return { success: false, message: "Network error" };
//  }
//}

//// ✅ Checkout a booking
//export async function checkoutBooking(bookingId) {
//  try {
//    const res = await apiClient.post(`/bookings/${bookingId}/checkout`, {
//    });
//    return res.data;
//  } catch (err) {
//    console.error("Error checking out booking:", err);
//    return { success: false, message: "Network error" };
//  }
//}
//
//// ✅ Mark as Checked-In
//export async function checkInBooking(bookingId, checkInDateTime) {
//  try {
//    const res = await apiClient.post(`/bookings/${bookingId}/checkin`, {
//        });
//    return res.data;
//  } catch (err) {
//    console.error("Error checking in booking:", err);
//    return { success: false, message: "Network error" };
//  }
//}

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


export const fetchDailyChart = async (date) => {
  try {
    const response = await apiClient.get("/daily-chart", {
      params: { date },
      headers: { "Accept": "application/json" }
    });

    return response.data; // contains { date, rooms }
  } catch (error) {
    // axios error catch
    const msg =
      error.response?.data?.error ||
      error.message ||
      "Failed to fetch daily chart";

    console.error("Daily chart error:", msg);
    throw new Error(msg);
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

// search by booking id (re-usable)
export const fetchBookingById = async ({ bookingId }) => {
      try {
          const response = await apiClient.get(`${API_BASE_URL}/search_booking?bookingId=${encodeURIComponent(bookingId)}`, {
              params: {
                  bookingId
              },
          });
          return response.data;
      } catch (error) {
          console.error("Error fetching booking details:", error);
          throw error;
      }
}

export const fetchGSTInvoice = async (bookingId) => {
  try {
    const response = await apiClient.get(`/bookings/${bookingId}/gst-invoice`);
    return response.data;
  } catch (error) {
    console.error("Error fetching GST invoice:", error);
  }
};

// update only GST mapping fields (works even after checkout)
export async function updateGSTInfo(bookingId, gstInfo) {
    try {
        const res = await apiClient.post(`/update-booking`, {
                bookingId,
                gstInfo
            });
        return res.data;
      } catch (err) {
        console.error("Error cancelling booking:", err);
        return { success: false, message: "Network error" };
      }
}

export const fetchBookingsByDateRange = async (payload) => {
    const response = await apiClient.post('/bookings-by-date-range', payload);
    return response.data;
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


export const fetchBookings = async () => {
    try {
        const response = await apiClient.get("/bookings");
        return response.data;
    } catch (error) {
        console.error("Error fetching bookings:", error);
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




// src/api.js

export default apiClient;
