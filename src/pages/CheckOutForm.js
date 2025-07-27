import React, { useState, useEffect } from "react";
import { Form, Button, Card, Row, Col } from "react-bootstrap";
import axios from "axios";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parse, isValid } from "date-fns";
import { updateBooking, searchBooking, fetchAvailableRooms, checkoutOrCancelBooking, addOrRefundPayment } from "../api";

const CheckoutForm = ({ bookingId, bookingStatus, isAdmin }) => {

    const readOnlyFieldStyle = {
        backgroundColor: "#e9ecef", // Light gray (disabled look)
        color: "#6c757d", // Gray text color
        border: "1px solid #ced4da", // Subtle border
        fontWeight: "normal",
        cursor: "not-allowed",
        borderColor: "transparent"
    };

    const editFieldStyle = {
        backgroundColor: "white", // Light gray (disabled look)
        cursor: "text",
        color: "#6c757d", // Gray text color
        border: "1px solid #ced4da", // Subtle border
        borderColor: "#ced4da",
        fontWeight: "normal",
    };

    const [searchInput, setSearchInput] = useState({
        bookingId: "",
        phoneNumber: "",
        roomNumber: "",
        selectDate: null,
        bookingStatus: "ACTIVE"
    });

    const [updateInput, setUpdateInput] = useState({
            paymentAmount: '',
            paymentMode: '',
            paymentNote:'',
            paymentDate:''
    });

    const defaultFormData = {
        personal_info:
            {
                name: '',
                phoneNumber: '',
                identity: '',
                address: '',
                email: '',
            },
        stay_info:
            {
                checkInDateTime: '',
                probableCheckOutDateTime: '',
                durationOfStay: 1,
                bookingMode: '',
                bookingStatus: '',
                bookingId: ''
            },
        rooms: [
            {
                roomType: '',
                roomNumber: "",
                isAcRoom: false,
                occupancy: '',
                extraPersons: 0,
                room_id: 0
            },
        ],
        payment_info:[
            {
                paymentAmount: '',
                paymentMode: '',
                paymentNote: "",
                paymentStatus: "",
                pricePerNight: 0.0
            },
            ],
        finalPricePerNight: 0.0,
        isUpdateRoomRequired: false
    }

    const [formData, setFormData] = useState(defaultFormData);

    const [isEditable, setIsEditable] = useState(false);
    const [isChangeRoom, setIsChangeRoom] = useState(false);
    const [isCheckout, setIsCheckout] = useState(false);
    const [isCancel, setIsCancel] = useState(false);

    const [bookingDetails, setBookingDetails] = useState(null);
    const [error, setError] = useState("");
    const [totalPrice, setTotalPrice] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [paymentInstructions, setPaymentInstructions] = useState("");
    const [balance, setBalance] = useState(0);
    const [stayDuration , setStayDuration] = useState(0);
    const [stayDurationText , setStayDurationText] = useState("");
    const [lastBookingStatus, setLastBookingStatus] = useState('')
    const [availableRooms, setAvailableRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [priceBreakup, setPriceBreakup] = useState('');
    const [checkOutDateTime,setCheckOutDateTime] = useState('');
    const [initialAssignedRooms, setInitialAssignedRooms] = useState([]);

    const roomTypeOccupancyMap = {
        Studio: ['Single', 'Double'],
        Luxury: ['Single', 'Double'],
        Triple: ['Triple']
    };
// Formatting the date in dd/mm/yyyy hh:mm AM/PM format
    const formatDate = (date) => {
        return format(date, "dd/MM/yyyy hh:mm a");
    };

    const handleSearchSubmit = async (e) => {
        if (e) e.preventDefault(); // Prevent page reload on form submit

        // Validate that at least one search field is entered
        const { bookingId, phoneNumber, roomNumber } = searchInput;
        if (!bookingId && !phoneNumber && !roomNumber) {
          setError("Please enter at least one search field.");
          return;
        }

        try {
            const data = await searchBooking(searchInput);
            console.log(data.bookingDetails)
            setBookingDetails(data.bookingDetails);
            const initialData = data.bookingDetails[0];

            const roomsData = initialData.room_details.map((room) => ({
                roomType: room.room_type,
                roomNumber: room.room_number,
                isAcRoom: room.is_ac,
                occupancy: room.occupancy || '', // Default to empty string if not provided
                extraPersons: room.extra_persons || 0, // Default to 0 if not provided
            }));

            const paymentData = initialData.payment_info.map((payment) => ({
                paymentAmount: payment.amount,
                paymentMode: payment.mode,
                paymentDate: payment.date || '', // Default to empty string if not provided
                paymentNote: payment.notes || '',
                paymentStatus: payment.status || '',
            }));
            console.log(paymentData)
            setLastBookingStatus(initialData.booking_status)
            setFormData({
                            personal_info: {
                                name: initialData.customer_info.name,
                                phoneNumber: initialData.customer_info.phone,
                                identity: initialData.customer_info.identity,
                                address: initialData.customer_info.address,
                                email: initialData.customer_info.email,
                            },
                            stay_info:
                                {
                                    checkInDateTime: initialData.stay_info.check_in_date ,
                                    probableCheckOutDateTime: initialData.stay_info.probable_check_out_date ,
                                    durationOfStay: initialData.stay_info.duration,
                                    bookingMode: initialData.booking_mode,
                                    bookingStatus:  initialData.booking_status,
                                    bookingId:  initialData.booking_id,
                                },
                            rooms: roomsData,
                            payment_info: paymentData,
                            isUpdateRoomRequired: false,
                            finalPricePerNight: initialData.price_per_night || '', // Default to empty string if not provided
                            // Add other necessary fields from the response here
                        });
                        setInitialAssignedRooms(roomsData);  // this preserves original room info

            const totalPayments = initialData.payment_info.reduce((sum, payment) => sum + payment.amount, 0);
            setPaidAmount(totalPayments.toFixed(2));

            const paymentsBreakdown = initialData.payment_info
                .map(
                    (payment, index) =>
                        `${index+1})   ${formatDate(payment.date)}  -  ₹${payment.amount.toFixed(2)} - ${payment.mode} - ${payment.notes || 'PAID'}  `
                )
                .join("\n");
            const paymentInstructionsText = `${paymentsBreakdown}\nTotal Paid: ₹${totalPayments.toFixed(2)}`;
            setPaymentInstructions(paymentInstructionsText);

            const finalPrice = initialData.price_per_night * initialData.stay_info.duration
            setTotalPrice(finalPrice);

            const balanceAmount = finalPrice - totalPayments;
            setBalance(balanceAmount);

            setError(""); // Clear error if successful
        } catch (error) {
            setBookingDetails(null);
            setError("No booking found or an error occurred.");
        }
    };

    useEffect(() => {
      if (bookingId) {
        setSearchInput((prevState) => ({
          ...prevState,
          bookingId: bookingId,
          bookingStatus: bookingStatus,
        }));
      }
    }, [bookingId,bookingStatus]);

    useEffect(() => {
      if (searchInput.bookingId) {
        handleSearchSubmit();
      }
    }, [searchInput]);

    const handleEdit = () =>   { setIsEditable(true); }

    const handleCheckoutChange = (e) => {
        setIsCheckout(e.target.checked); // Set checkout status
    };

    const handleCheckoutDateChange = (date) => {
            setCheckOutDateTime(date); // Set checkout status
        };

    const handleCancelChange = (e) => {
        setIsCancel(e.target.checked); // Set checkout status
    };

    const handleEditDateChange = (date, field) => {
        setFormData((prevData) => ({
            ...prevData,
            stay_info: {
                ...prevData.stay_info,
                [field]: date,
            },
        }));
    };

    const handleChangeRoom = (e) => {
            setIsChangeRoom(e.target.checked); // Set checkout status
        // Update formData state immutably
            setFormData((prevData) => ({
                ...prevData,
                isUpdateRoomRequired: e.target.checked, // Reflect checkbox value
            }));
        };

    // Fetch available rooms
    useEffect(() => {
        if (!isEditable) return; // Run the effect only when `isEditable` is true

       const loadAvailableRooms = async () => {
       const checkInDateTime =
            typeof formData.stay_info.checkInDateTime === "string"
                ? new Date(formData.stay_info.checkInDateTime)
                : formData.stay_info.checkInDateTime;

       const probableCheckOutDateTime =
            typeof formData.stay_info.probableCheckOutDateTime === "string"
                ? new Date(formData.stay_info.probableCheckOutDateTime)
                : formData.stay_info.probableCheckOutDateTime;

         if (!formData.stay_info.durationOfStay) return;
          try {
            const rooms = await fetchAvailableRooms(
              formData.stay_info.durationOfStay,
              checkInDateTime,
              probableCheckOutDateTime
            );
// 🔧 Use original assigned room from initialAssignedRooms if missing
if (isChangeRoom && initialAssignedRooms.length > 0) {
  initialAssignedRooms.forEach((assignedRoom) => {
    const exists = rooms.some((r) => r.room_number === assignedRoom.roomNumber);
    if (!exists && assignedRoom.roomNumber) {
      rooms.unshift({
        room_id: assignedRoom.roomId || assignedRoom.room_id,
        room_number: assignedRoom.roomNumber,
        room_type: assignedRoom.roomType,
        is_ac: assignedRoom.isAcRoom,
        occupancy: assignedRoom.occupancy,
        room_price: 0,
        extra_bed_price: 0,
      });
    }
  });
}

            setAvailableRooms(rooms);
          } catch (error) {
            console.error("Error loading available rooms:", error);
          }
        };

       loadAvailableRooms();
    }, [formData.stay_info.checkInDateTime,formData.stay_info.durationOfStay]);

    useEffect(() => {
      if (!isEditable) return; // Run the effect only when `isEditable` is true

      const updatedFilteredRooms = formData.rooms.map((currentRoom) => {
        // Filter available rooms based on the current room's configuration
        if (!currentRoom.roomType || !currentRoom.occupancy) return []; // Skip if type or occupancy is not selected

        return availableRooms.filter(
          (availableRoom) =>
            availableRoom.room_type === currentRoom.roomType &&
            availableRoom.occupancy === currentRoom.occupancy &&
            availableRoom.is_ac === currentRoom.isAcRoom
        );
      });

      setFilteredRooms(updatedFilteredRooms);
    }, [formData.rooms, availableRooms]);

    const handleRoomChange = (e, index) => {
      const { name, value, type, checked } = e.target;

      const updatedRooms = [...formData.rooms];

      if (name === "roomNumber") {
        const selectedRoom = filteredRooms[index]?.find(
          (room) => room.room_number === value
        );

        if (selectedRoom) {
          updatedRooms[index] = {
            ...updatedRooms[index],
            roomNumber: value,
            roomId: selectedRoom.room_id,
          };
        }
      } else {
        // For other fields like roomType, occupancy, or isAcRoom
        updatedRooms[index] = {
          ...updatedRooms[index],
          [name]: type === 'checkbox' ? checked : value, // Handle checkbox for AC toggle
          roomNumber: "", // Reset roomNumber and roomId if type/occupancy changes
          roomId: "",
        };
      }

      setFormData((prevData) => ({
        ...prevData,
        rooms: updatedRooms,
      }));
    };

    const handleAddRoom = () => {
        setFormData((prev) => ({
            ...prev,
            rooms: [
                ...prev.rooms,
                {
                    roomType: '',
                    roomNumber: "",
                    isAcRoom: false,
                    occupancy: '',
                    extraPersons: 0,
                    roomId: ''
                },
            ],
        }));
    };

    const handleRemoveRoom = (index) => {
        setFormData((prev) => ({
            ...prev,
            rooms: prev.rooms.filter((_, i) => i !== index),
        }));
    };
    useEffect(() => {

      if (!isEditable) return; // Run the effect only when `isEditable` is true

      if (!availableRooms || formData.rooms.length === 0) return;

      let totalPrice = 0;
      let breakdowns = [];

      formData.rooms.forEach((room, index) => {
        const selectedRoom = availableRooms.find(
          (availableRoom) => availableRoom.room_id === room.roomId
        );

        const basePrice = selectedRoom ? selectedRoom.room_price : 0;
        const stayCharge = basePrice * formData.stay_info.durationOfStay;

        // Calculate 12% GST on the base price
        const gstAmount = stayCharge * 0.12;

        const extraPersonRate = selectedRoom ? selectedRoom.extra_bed_price : 0;
        const extraPersonCharges =
          room.extraPersons >= 1
            ? formData.stay_info.durationOfStay * room.extraPersons * extraPersonRate
            : 0;

        // Calculate the total for the room (base + GST + extra persons)
        const roomTotal = stayCharge + gstAmount + extraPersonCharges;
        totalPrice += roomTotal;

        const extraPersonText =
          room.extraPersons >= 1
            ? `  - Extra Persons (${room.extraPersons}): ₹${extraPersonRate.toFixed(2)} x ${room.extraPersons} x ${formData.stay_info.durationOfStay} Nights = ₹${extraPersonCharges.toFixed(2)}`
            : "";

        // Construct the breakdown string
        breakdowns.push(
          `Room ${index + 1} - ${room.occupancy} ${room.roomType} Room #${room.roomNumber} (${room.isAcRoom ? "AC" : "Non-AC"}):
      - Base Price: ₹${basePrice.toFixed(2)} x ${formData.stay_info.durationOfStay} Nights = ₹${stayCharge.toFixed(2)}
      - GST (12% on Base Price): ₹${gstAmount.toFixed(2)}
    ${extraPersonText ? extraPersonText + '\n' : ""}  **Total for this room: ₹${roomTotal.toFixed(2)}**`
        );
      });

      // Add grand total to breakdowns
      breakdowns.push(`--------------------------------------------------
    **Grand Total (including GST): ₹${totalPrice.toFixed(2)}**`);

      // Update state once
      setTotalPrice(totalPrice);
      setPriceBreakup(breakdowns.join("\n\n"));
    }, [formData.rooms, formData.stay_info.durationOfStay, availableRooms]);

    useEffect(() => {
        if (!isEditable) return; // Run the effect only when `isEditable` is true
        console.log("=====================")
        const calculateDurationOfStay = () => {
            const { checkInDateTime, probableCheckOutDateTime } = formData.stay_info;
            console.log("-------------------")
                // Define your date format
                const checkIn = new Date(checkInDateTime)
                const checkOut = new Date(probableCheckOutDateTime)
                 // Validate the parsed dates
                    if (!isValid(checkIn)) {
                        console.error("Invalid CheckIn date:", { checkIn });
                        return;
                    }
                    if (!isValid(checkOut)) {
                        console.error("Invalid CheckOut date:", { checkOut });
                        return;
                    }

            if (checkOut > checkIn) {
                const timeDifference = checkOut - checkIn; // Difference in milliseconds
                const duration = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // Convert to days and round up
                console.log(duration)
                // Ensure duration is within valid bounds
                const validDuration = Math.min(Math.max(duration, 1), 6);
                setFormData((prevData) => ({
                    ...prevData,
                    stay_info: {
                        ...prevData.stay_info,
                        durationOfStay: validDuration,
                    },
                }));
            }
        };

        calculateDurationOfStay();
    }, [formData.stay_info.checkInDateTime, formData.stay_info.probableCheckOutDateTime]);

    const calculateCheckOutPrice = () => {
        let checkOutDate = null
        if (isAdmin){
         checkOutDate = new Date(checkOutDateTime)
        }
        else{
         checkOutDate = new Date()
        }

        if (isNaN(checkOutDate)) {
            throw new Error("Invalid Checkout Date");
        }

        const checkInDate = new Date(formData.stay_info.checkInDateTime);
        console.log(checkInDate)
        if (isNaN(checkInDate)) {
            throw new Error("Invalid Check-in Date");
        }

        const diffInMillis = checkOutDate - checkInDate;
        if (isNaN(diffInMillis)) {
            throw new Error("Invalid date difference calculation");
        }

        const currentStayDurationInDays = calculateStayDuration(diffInMillis);
        console.log(currentStayDurationInDays)
        setStayDuration(currentStayDurationInDays)

        const finalPrice = formData.finalPricePerNight * currentStayDurationInDays
        setTotalPrice(finalPrice);

        const balanceAmount = finalPrice - paidAmount;
        setBalance(balanceAmount);
    };

    const calculateStayDuration = (diffInMillis) => {
            const fullDays = Math.floor(diffInMillis / (1000 * 60 * 60 * 24));
            const fullNights = fullDays;
            const remainingHours = Math.floor((diffInMillis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const remainingMinutes = Math.floor((diffInMillis % (1000 * 60 * 60)) / (1000 * 60));

            if (remainingHours * 60 + remainingMinutes >= 75) {
                setStayDurationText(`${fullNights } Nights ${remainingHours} Hours ${remainingMinutes} Minutes = ${
                    fullDays + 1
                } Nights`);
                return fullDays + 1;
            }
            if(fullNights === 0 && remainingHours * 60 + remainingMinutes >= 30) {
                setStayDurationText(`${fullNights } Nights ${remainingHours} Hours ${remainingMinutes} Minutes = ${
                     fullDays + 1} Nights`);
                return fullDays + 1;
            }
            setStayDurationText(`${fullNights} Nights ${remainingHours} Hours ${remainingMinutes} Minutes ~= ${fullDays} Nights`);
            return fullDays;
        };

    const calculateCancelPrice = () => {
        setBalance(-Math.abs(paidAmount));
    };

    const resetToDefaultPrice = () => {
        const finalPrice = formData.finalPricePerNight * formData.stay_info.durationOfStay; // Assuming default price is stored in formData
        setTotalPrice(finalPrice);

        const actualBalance = finalPrice - paidAmount;
        setBalance(actualBalance);

        setStayDuration(formData.stay_info.durationOfStay); // Reset stay duration to a default value (e.g., 1 day)
    };

    useEffect(() => {
        if (isCheckout) {
            calculateCheckOutPrice(); // Calculate the default price on load
        }
        else {
            resetToDefaultPrice(); // Reset to the default price when checkout is toggled off
        }
    }, [isCheckout]); // Recalculate when stayDuration or checkout status changes

    useEffect(() => {
        if (isCancel) {
            calculateCancelPrice(); // Calculate the default price on load
        }
        else {
            resetToDefaultPrice(); // Reset to the default price when checkout is toggled off
        }
    }, [isCancel]);

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchInput({ ...searchInput, [name]: value });
    };

    const handleUpdateChange = (e) => {
            const { name, value } = e.target;
            setUpdateInput({ ...updateInput, [name]: value });
        };

    const handlePaymentDateChange = (date, field) => {
        setUpdateInput({ ...updateInput, [field]: date });

        };

    const handleDateChange = (date) => {
        setSearchInput({ ...searchInput, selectDate: date });
    };

    const handleSubmit = async () => {
        try {
            console.log("Data submitted:", formData);

        const normalizedFormData = {
                ...formData,
                stay_info: {
                    ...formData.stay_info,
                    checkInDateTime: typeof formData.stay_info.checkInDateTime === "string"
                        ? new Date(formData.stay_info.checkInDateTime)
                        : formData.stay_info.checkInDateTime,
                    probableCheckOutDateTime: typeof formData.stay_info.probableCheckOutDateTime === "string"
                        ? new Date(formData.stay_info.probableCheckOutDateTime)
                        : formData.stay_info.probableCheckOutDateTime,
                },
            };

            // API Call: Update Booking
            const bookingResponse = await updateBooking(normalizedFormData);

            if (bookingResponse.success) {
                // Success: Update booking
                setIsEditable(false); // Exit edit mode

    //            // Optional: Send confirmation message
    //            const messageData = {
    //                phoneNumber: formData.personal_info.phoneNumber,
    //                message: `Dear ${formData.personal_info.name}, your booking at Hotel Sri Krishna has been confirmed! Booking ID: ${bookingResponse.bookingId}. Thank you!`,
    //            };
    //
    //            try {
    //                const messageResponse = await sendMessage(messageData);
    //                if (messageResponse.success) {
    //                    console.log("Message sent successfully.");
    //                } else {
    //                    console.warn("Failed to send confirmation message.");
    //                }
    //            } catch (msgError) {
    //                console.error("Error sending message:", msgError);
    //            }

                // Reset form data
                setFormData(defaultFormData);
                alert("Booking updated successfully.");
            } else {
                // Handle booking failure
                alert("Failed to update booking. Please try again.");
            }
        } catch (error) {
            console.error("Error updating data:", error);
            alert("An error occurred while updating data.");
        }
    };

    const handleCheckoutOrCancelSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await checkoutOrCancelBooking(
                        formData.stay_info.bookingId,
                        checkOutDateTime,
                        stayDuration,
                        formData.stay_info.bookingStatus,
                    );
            alert("Checkout confirmed successfully!");
            setFormData(defaultFormData);
            setPaidAmount(0)
            setTotalPrice(0)
            setBalance(0)
            setStayDuration(0)
            setPaymentInstructions("")
            setStayDurationText("")
            setIsCheckout(false)
            setIsCancel(false)
        } catch (err) {
            setError("Error during checkout. Please try again.");
        }
    };

    const handlePaymentOrRefundSubmit = async (type, event) => {
        // Check if it's triggered by an event (like a form submit)
        if (event && typeof event.preventDefault === "function") {
            event.preventDefault();
        }
        const transactionType = balance > 0 ? "CREDIT" : "DEBIT"
        try {
            const response = await addOrRefundPayment(
                        formData.stay_info.bookingId,
                        transactionType,
                        updateInput
                    );
            alert("Payment successfully!");
            setFormData(defaultFormData);
            setPaidAmount(0)
            setTotalPrice(0)
            setBalance(0)
            setStayDuration(0)
            setPaymentInstructions("")
            setStayDurationText("")
            setIsCheckout(false)
            setIsCancel(false)
        } catch (err) {
            setError("Error during payment. Please try again.");
        }
    };

    const handleSettleSubmit = async (type, event) => {
        // Check if it's triggered by an event (like a form submit)
        if (event && typeof event.preventDefault === "function") {
            event.preventDefault();
        }
        const transactionType = "CREDIT"
        try {
            const response = await addOrRefundPayment(
                        formData.stay_info.bookingId,
                        transactionType,
                        updateInput
                    );
            alert("Payment successfully!");
            setFormData(defaultFormData);
            setPaidAmount(0)
            setTotalPrice(0)
            setBalance(0)
            setStayDuration(0)
            setPaymentInstructions("")
            setStayDurationText("")
            setIsCheckout(false)
            setIsCancel(false)
        } catch (err) {
            setError("Error during payment. Please try again.");
        }
    };

    const handleChange = (e, section) => {
        const { name, value } = e.target;

        setFormData((prevState) => ({
            ...prevState,
            [section]: {
                ...prevState[section],
                [name]: value,
            },
        }));
    };

    return (
        <div>
            {!bookingDetails ? (
                <Form onSubmit={handleSearchSubmit}>
                    <Card className="mb-3">
                        <Card.Header>Search Booking</Card.Header>
                        <Card.Body>
                            {error && <p className="text-danger">{error}</p>}
                            <Form.Group as={Row} controlId="formBookingId">
                                <Form.Label column sm="4">Booking ID</Form.Label>
                                <Col sm="8">
                                    <Form.Control
                                        type="text"
                                        name="bookingId"
                                        value={searchInput.bookingId}
                                        onChange={handleSearchChange}
                                        placeholder="Enter Booking ID"
                                    />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} controlId="formPhoneNumber">
                                <Form.Label column sm="4">Phone Number</Form.Label>
                                <Col sm="8">
                                    <Form.Control
                                        type="text"
                                        name="phoneNumber"
                                        value={searchInput.phoneNumber}
                                        onChange={handleSearchChange}
                                        placeholder="Enter Phone Number"
                                    />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} controlId="formRoomNumber">
                                <Form.Label column sm="4">Room Number</Form.Label>
                                <Col sm="8">
                                    <Form.Control
                                        type="text"
                                        name="roomNumber"
                                        value={searchInput.roomNumber}
                                        onChange={handleSearchChange}
                                        placeholder="Enter Room Number"
                                    />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} controlId="formSelectDate">
                                <Form.Label column sm="4">Select Date</Form.Label>
                                <Col sm="8">
                                    <DatePicker
                                        selected={searchInput.selectDate}
                                        onChange={handleDateChange}
                                        dateFormat="dd/MM/yyyy"
                                        className="form-control"
                                        placeholderText="Select date"
                                    />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} controlId="formBookingStatus">
                                <Form.Label column sm="4">Booking Status</Form.Label>
                                <Col sm="8">
                                    <Form.Control
                                        as="select"
                                        name="bookingStatus"
                                        value={searchInput.bookingStatus} // Accessing nested field
                                        onChange={handleSearchChange}
                                    >
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="PAST">PAST</option>
                                        <option value="FUTURE">FUTURE</option>
                                    </Form.Control>
                                </Col>
                            </Form.Group>
                            <Button type="submit" className="mx-auto d-block mt-3">Search Booking</Button>
                        </Card.Body>
                    </Card>
                </Form>
                ) : (
                 <Form>
                    <Card>
                        <Card.Header>Personal Info</Card.Header>
                        <Card.Body>
                            <Form.Group as={Row} controlId="formName">
                            <Form.Label column sm="3">Guest Name</Form.Label>
                                <Col sm="9">
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.personal_info.name} // Prefilled value
                                        onChange={(e) => handleChange(e, 'personal_info')} // Updates state
                                        required
                                        readOnly={!isEditable}
                                        style={isEditable ? editFieldStyle : readOnlyFieldStyle}
                                    />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} controlId="formPhoneNumber">
                            <Form.Label column sm="3">Phone Number</Form.Label>
                                <Col sm="9">
                                    <Form.Control
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.personal_info.phoneNumber} // Accessing nested phoneNumber
                                        onChange={(e) => handleChange(e, 'personal_info')} // Handling changes for personal_info
                                        required
                                        readOnly={!isEditable}
                                        style={isEditable ? editFieldStyle : readOnlyFieldStyle}
                                    />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} controlId="formIdentity">
                                <Form.Label column sm="3">Identity (ADHAR/PAN)</Form.Label>
                                <Col sm="9">
                                    <Form.Control
                                        type="text"
                                        name="identity"
                                        value={formData.personal_info.identity} // Accessing nested identity
                                        onChange={(e) => handleChange(e, 'personal_info')} // Handling changes for personal_info
                                        readOnly={!isEditable}
                                        style={isEditable ? editFieldStyle : readOnlyFieldStyle}
                                    />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} controlId="formEmail">
                                <Form.Label column sm="3">Email</Form.Label>
                                <Col sm="9">
                                    <Form.Control
                                        type="text"
                                        name="email"
                                        value={formData.personal_info.email} // Accessing nested email
                                        onChange={(e) => handleChange(e, 'personal_info')} // Handling changes for personal_info
                                        readOnly={!isEditable}
                                        style={isEditable ? editFieldStyle : readOnlyFieldStyle}
                                    />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} controlId="formAddress">
                                <Form.Label column sm="3">Address</Form.Label>
                                <Col sm="9">
                                    <Form.Control
                                        as="textarea"
                                        name="address"
                                        value={formData.personal_info.address} // Accessing nested address
                                        onChange={(e) => handleChange(e, 'personal_info')} // Handling changes for personal_info
                                        readOnly={!isEditable}
                                        style={isEditable ? editFieldStyle : readOnlyFieldStyle}
                                    />
                                </Col>
                            </Form.Group>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header>Stay Info</Card.Header>
                        <Card.Body >
                            <Form.Group as={Row} controlId="formCheckInDateTime">
                            <Form.Label column sm="3">Check-In Date & Time</Form.Label>
                            <Col sm="9">
                                {isEditable && lastBookingStatus === "Confirmed" ? (
                                // DatePicker for editing mode
                                <DatePicker
                                  selected={
                                    formData.stay_info.checkInDateTime
                                      ? new Date(formData.stay_info.checkInDateTime)
                                      : null
                                  }
                                  onChange={(date) => handleEditDateChange(date, 'checkInDateTime')}
                                  showTimeSelect
                                  timeFormat="HH:mm"
                                  timeIntervals={15}
                                  dateFormat="dd/MM/yyyy hh:mm a"
                                  className="form-control"
                                  placeholderText="Select date & time"

                                  // Min Check-in Date
                                  minDate={isAdmin
                                    ? new Date(new Date().setDate(new Date().getDate() - 30)) // 30 days prior for admin
                                    : new Date(new Date().getTime() + 6 * 60 * 60 * 1000) // 6 hours from now for non-admin
                                  }

                                  // Max Check-in Date (6 months from today)
                                  maxDate={new Date(new Date().setMonth(new Date().getMonth() + 6))}

                                />

                            ) : (
                        // Text field for display mode
                                <Form.Control
                                  type="text"
                                  name="checkInDateTime"
                                  value={formData.stay_info.checkInDateTime ? formatDate(new Date(formData.stay_info.checkInDateTime)) : ""}
                                  readOnly
                                  style={readOnlyFieldStyle}
                                />
                                )}
                             </Col>
                        </Form.Group>

                        <Form.Group as={Row} controlId="formProbableCheckOutDateTime">
                            <Form.Label column sm="3">Probable Check-Out Date & Time</Form.Label>
                            <Col sm="9">
                                {isEditable ? (
                                    // DatePicker for editing mode
                                    <DatePicker
                                      selected={
                                        formData.stay_info.probableCheckOutDateTime
                                          ? new Date(formData.stay_info.probableCheckOutDateTime)
                                          : null
                                      }
                                      onChange={(date) => handleEditDateChange(date, 'probableCheckOutDateTime')}
                                      showTimeSelect
                                      timeFormat="HH:mm"
                                      timeIntervals={15}
                                      dateFormat="dd/MM/yyyy hh:mm a"
                                      className="form-control"
                                      placeholderText="Select date & time"

                                      // 🟢 Earliest checkout date must be at least 2 hours after check-in
                                      minDate={(() => {
                                        const checkInDateTime = new Date(formData.stay_info.checkInDateTime || new Date());
                                        const minCheckoutDate = new Date(checkInDateTime.getTime() + 2 * 60 * 60 * 1000);

                                        return minCheckoutDate;
                                      })()}

                                      // 🔴 Latest checkout date cannot be more than 10 days from check-in
                                      maxDate={(() => {
                                        const checkInDateTime = new Date(formData.stay_info.checkInDateTime || new Date());
                                        return new Date(checkInDateTime.setDate(checkInDateTime.getDate() + 10));
                                      })()}

                                      minTime={(() => {
                                        const checkInDateTime = new Date(formData.stay_info.checkInDateTime || new Date());
                                        const probableCheckOutDate = new Date(formData.stay_info.probableCheckOutDateTime || new Date());

                                        // 🟢 If the checkout date is the same as check-in, enforce 2-hour rule
                                        if (probableCheckOutDate.toDateString() === checkInDateTime.toDateString()) {
                                          return new Date(checkInDateTime.getTime() + 2 * 60 * 60 * 1000);
                                        }

                                        // 🔴 If checkout is a future date, allow from midnight (00:00)
                                        return new Date(probableCheckOutDate.setHours(0, 0, 0, 0));
                                      })()}

                                      maxTime={(() => {
                                        const probableCheckOutDate = new Date(formData.stay_info.probableCheckOutDateTime || new Date());

                                        // 🔴 Checkout time should be up to 11:59 PM on the selected checkout date
                                        return new Date(probableCheckOutDate.setHours(23, 59, 59));
                                      })()}
                                    />

                                ) : (
                                    // Text field for display mode
                                    <Form.Control
                                        type="text"
                                        name="probableCheckOutDateTime"
                                        value={formData.stay_info.probableCheckOutDateTime ? formatDate(new Date(formData.stay_info.probableCheckOutDateTime)) : ""}
                                        readOnly
                                        style={readOnlyFieldStyle}
                                    />
                                )}
                            </Col>
                        </Form.Group>

                   {!isCheckout && (
                            <Form.Group as={Row} controlId="formDurationOfStay">
                                <Form.Label column sm="3">Duration of Stay</Form.Label>
                                <Col sm="9">
                                    <Form.Control
                                        type="number"
                                        name="durationOfStay"
                                        value={formData.stay_info.durationOfStay} // Accessing nested checkInDateTime
                                        onChange={(e) => handleChange(e, 'stay_info')}
                                        readOnly
                                        style={readOnlyFieldStyle}
                                    />
                                </Col>
                            </Form.Group>
                          )}
                   {isCheckout && (
                            <Form.Group as={Row} controlId="formStayDurationText">
                                <Form.Label column sm="3">Duration of Stay</Form.Label>
                                <Col sm="9">
                                    <Form.Control
                                        type="text"
                                        value={stayDurationText}
                                        readOnly
                                        style={readOnlyFieldStyle}
                                     />
                                </Col>
                            </Form.Group>
                             )}
                   <Form.Group as={Row} controlId="formBookingMode">
                                <Form.Label column sm="3">Booking Mode</Form.Label>
                                <Col sm="9">
                                    {isEditable ? (
                                        // Dropdown for editing
                                        <Form.Control
                                            as="select"
                                            name="bookingMode"
                                            value={formData.stay_info.bookingMode}
                                            onChange={(e) => handleChange(e, 'stay_info')}
                                            style={editFieldStyle}
                                        >
                                            <option value="">Select Booking Mode</option>
                                            <option value="ONLINE">ONLINE</option>
                                            <option value="WALKIN">WALK-IN</option>
                                            <option value="OVERPHONE">OVER-PHONE</option>
                                        </Form.Control>
                                    ) : (
                                        // Text field for read-only mode
                                        <Form.Control
                                            type="text"
                                            name="bookingMode"
                                            value={formData.stay_info.bookingMode}
                                            readOnly
                                            style={readOnlyFieldStyle}
                                        />
                                    )}
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} controlId="formBookingStatus">
                              <Form.Label column sm="3">Booking Status</Form.Label>
                              <Col sm="9">
                                <Form.Control
                                  as="select"
                                  name="bookingStatus"
                                  value={formData.stay_info.bookingStatus} // Accessing nested bookingStatus field
                                  onChange={(e) => {
                                    // Allow change only if the status is "Confirmed"
                                    if (isEditable && e.target.value === "Checked-In" && formData.stay_info.bookingStatus === "Confirmed") {
                                      // Update booking status to Checked-In
                                      handleChange(e, 'stay_info');

                                      // Also update the check-in date and time to the current time
                                      if (!isAdmin) {
                                     const updatedCheckInDateTime = new Date();
                                      setFormData(prevData => ({
                                        ...prevData,
                                        stay_info: {
                                          ...prevData.stay_info,
                                          checkInDateTime: updatedCheckInDateTime, // Set current time as check-in time
                                        },
                                      }));
                                      }

                                    } else if (formData.stay_info.bookingStatus !== "Confirmed") {
                                      // Prevent change if status is anything other than "Confirmed"
                                      e.preventDefault();
                                    }
                                  }}
                                  readOnly={!isEditable} // Read-only unless in edit mode
                                  style={isEditable ? editFieldStyle : readOnlyFieldStyle}
                                >
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Checked-In">Checked-In</option>
                                </Form.Control>
                              </Col>
                            </Form.Group>

                    {formData.stay_info.bookingStatus === "Confirmed" && (
                              <Form.Group as={Row} controlId={"formIsChangeRoom"}>
                                <Form.Label column sm="3">Do You Want to Change Room</Form.Label>
                                <Col sm="9">
                                  <Form.Check
                                    type="checkbox"
                                    name="isChangeRoom"
                                    checked={isChangeRoom}
                                    onChange={(e) => handleChangeRoom(e)}
                                  />
                                </Col>
                              </Form.Group>
                        )}
                        </Card.Body>
                    </Card>

{formData.rooms.map((room, index) => (
  <Card className="mb-3" key={index}>
    <Card.Header>
      Room-{index + 1}: {room.roomNumber ? `${room.occupancy} occupancy ${room.roomType} room #${room.roomNumber} (${room.isAcRoom ? "AC" : "Non-AC"}) ${room.extraPersons === 0 ? "" : `(${room.extraPersons} persons)`}` : "(No Room Selected)"}
    </Card.Header>
    <Card.Body>
      {isEditable && isChangeRoom && lastBookingStatus === "Confirmed" ? (
        <>
          <Form.Group as={Row} controlId={`formRoomType${index}`}>
            <Form.Label column sm="3">Room Type</Form.Label>
            <Col sm="9">
              <Form.Control
                as="select"
                name="roomType"
                value={room.roomType}
                onChange={(e) => handleRoomChange(e, index)}
              >
                <option value="">Select Room Type</option>
                <option>Studio</option>
                <option>Luxury</option>
                <option>Triple</option>
              </Form.Control>
            </Col>
          </Form.Group>

          <Form.Group as={Row} controlId={`formOccupancy${index}`}>
            <Form.Label column sm="3">Occupancy</Form.Label>
            <Col sm="9">
              <Form.Control
                as="select"
                name="occupancy"
                value={room.occupancy}
                onChange={(e) => handleRoomChange(e, index)}
                disabled={!room.roomType}
              >
                <option value="">Select Occupancy</option>
                {room.roomType &&
                  roomTypeOccupancyMap[room.roomType]?.map((occupancy, idx) => (
                    <option key={idx} value={occupancy}>
                      {occupancy}
                    </option>
                  ))}
              </Form.Control>
            </Col>
          </Form.Group>

          <Form.Group as={Row} controlId={`formIsAcRoom${index}`}>
            <Form.Label column sm="3">AC Room</Form.Label>
            <Col sm="9">
              <Form.Check
                type="checkbox"
                name="isAcRoom"
                checked={room.isAcRoom}
                onChange={(e) => handleRoomChange(e, index)}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} controlId={`formRoomNumber${index}`}>
            <Form.Label column sm="3">Room Number</Form.Label>
            <Col sm="9">
              <Form.Control
                as="select"
                name="roomNumber"
                value={room.roomNumber || ""}
                onChange={(e) => handleRoomChange(e, index)}
                disabled={!filteredRooms[index]?.length} // Disable if no options available
              >
                <option value="">Select Room Number</option>
                {filteredRooms[index]?.map((filteredRoom) => (
                  <option key={filteredRoom.room_id} value={filteredRoom.room_number}>
                    {filteredRoom.room_number} ({filteredRoom.occupancy})
                  </option>
                ))}
              </Form.Control>
            </Col>
          </Form.Group>

          {room.occupancy !== 'Single' && (
            <Form.Group as={Row} controlId={`formExtraPersons${index}`}>
                <Form.Label column sm="3">Extra Persons</Form.Label>
                <Col sm="9">
                    <Form.Control
                        as="select"
                        name="extraPersons"
                        value={room.extraPersons}
                        onChange={(e) => handleRoomChange(e, index)}
                    >
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </Form.Control>
                </Col>
            </Form.Group>

          )}

          <Button
            variant="danger"
            onClick={() => handleRemoveRoom(index)}
            className="mt-2"
          >
            Remove Room
          </Button>
        </>
      ) : (
        null
      )}
    </Card.Body>
  </Card>
))}
{isEditable && isChangeRoom && lastBookingStatus === "Confirmed" ? (
    <Button variant="secondary" onClick={handleAddRoom} className="mb-3">
        Add Room
    </Button>
) : null} {/* Render nothing when conditions are false */}

{isEditable && isChangeRoom && lastBookingStatus === "Confirmed" &&
(
    <Card className="mb-3">
        <Card.Header>Payment Information</Card.Header>
        <Card.Body>
                    <Form.Group as={Row} controlId="formTotalPrice">
                        <Form.Label column sm="3">Total Price</Form.Label>
                        <Col sm="9">
                            <Form.Control type="text" value={`₹${totalPrice.toFixed(2)}`} readOnly
                                        style={{
                                            backgroundColor: "#d4edda", // Light green background
                                            color: "#155724", // Dark green text
                                            fontWeight: "bold",
                                        }}
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="formPriceBreakup">
                        <Form.Label column sm="3">Price Breakup</Form.Label>
                        <Col sm="9">
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={priceBreakup}
                                readOnly
                                style={{
                                                backgroundColor: "#e9ecef", // Light gray (disabled look)
                                                color: "#6c757d", // Gray text color
                                                border: "1px solid #ced4da", // Subtle border
                                                fontWeight: "normal",
                                            }}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} controlId="formPricePerNight">
                        <Form.Label column sm="3">Final Price Per Night</Form.Label>
                        <Col sm="9">
                            <Form.Control
                                type="number"
                                name="pricePerNight"
                                value={formData.payment_info.pricePerNight} // Accessing nested field
                                onChange={(e) => handleChange(e, 'payment_info')} // Handling changes for payment_info
                                min="0" // Restrict negative input
                                required
                            />
                        </Col>
                    </Form.Group>

        </Card.Body>
    </Card>
)}


                 {(searchInput.bookingStatus === "ACTIVE") && !isEditable && (
                    <Card className="bg-body text-danger">
                        <Card.Header>CheckOut Info</Card.Header>
                        <Card.Body>
                        {isAdmin && (
                          <Form.Group as={Row} controlId="formCheckOutDateTime">
                            <Form.Label column sm="3">
                              Check-Out Date & Time
                            </Form.Label>
                            <Col sm="9">
                              <DatePicker
                                selected={checkOutDateTime ? new Date(checkOutDateTime) : null}
                                onChange={(date) => handleCheckoutDateChange(date, 'checkOutDateTime')}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy hh:mm a"
                                className="form-control"
                                placeholderText="Select date & time"
                                minDate={
                                        formData.stay_info.checkInDateTime
                                          ? new Date(new Date(formData.stay_info.checkInDateTime).getTime() + 2 * 60 * 60 * 1000) // 2 hours after check-in
                                          : new Date() // Default if check-in not selected
                                      }
                                maxDate={
                                        formData.stay_info.checkInDateTime
                                          ? new Date(new Date(formData.stay_info.checkInDateTime).setDate(new Date(formData.stay_info.checkInDateTime).getDate() + 10))
                                          : new Date() // Default if check-in not selected
                                      } // Limit to 7 days in future
                              />
                            </Col>
                          </Form.Group>
                        )}

                            <Form.Group as={Row} controlId="formIsCheckout">
                                <Form.Label column sm="3">
                                    Proceed to Check Out
                                </Form.Label>
                                <Col sm="9">
                                    <Form.Check
                                        type="checkbox"
                                        name="isCheckout"
                                        checked={isCheckout}
                                        onChange={handleCheckoutChange}
										disabled={!checkOutDateTime} // ✅ disable if date not selected
                                        label={!checkOutDateTime ? "Select date & time first" : undefined} // Optional tooltip-like label
                                    />
                                </Col>
                            </Form.Group>

                        </Card.Body>
                    </Card>

                    )}
                 {(searchInput.bookingStatus === "FUTURE") && !isEditable && (
                    <Card className="bg-body text-danger">
                        <Card.Header>Cancellation Info</Card.Header>
                            <Card.Body>
{isAdmin && (
                          <Form.Group as={Row} controlId="formCheckOutDateTime">
                            <Form.Label column sm="3">
                              Cancel Date & Time
                            </Form.Label>
                            <Col sm="9">
                              <DatePicker
                                selected={checkOutDateTime ? new Date(checkOutDateTime) : null}
                                onChange={(date) => handleCheckoutDateChange(date, 'checkOutDateTime')}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy hh:mm a"
                                className="form-control"
                                placeholderText="Select date & time"
                                minDate={
                                        formData.stay_info.checkInDateTime
                                          ? new Date(new Date(formData.stay_info.checkInDateTime).getTime() + 2 * 60 * 60 * 1000) // 2 hours after check-in
                                          : new Date() // Default if check-in not selected
                                      }
                                maxDate={
                                        formData.stay_info.checkInDateTime
                                          ? new Date(new Date(formData.stay_info.checkInDateTime).setDate(new Date(formData.stay_info.checkInDateTime).getDate() + 10))
                                          : new Date() // Default if check-in not selected
                                      } // Limit to 7 days in future
                              />
                            </Col>
                          </Form.Group>
                        )}
                                <Form.Group as={Row} controlId="formIsCancel">
                                <Form.Label column sm="3">
                                Proceed to Cancel
                                </Form.Label>
                                    <Col sm="9">
                                        <Form.Check
                                            type="checkbox"
                                            name="isCancel"
                                            checked={isCancel}
                                            onChange={handleCancelChange}
											disabled={!checkOutDateTime} // ✅ disable if date not selected
                                            label={!checkOutDateTime ? "Select date & time first" : undefined} // Optional tooltip-like label
                                        />
                                    </Col>
                                </Form.Group>
                        </Card.Body>
                    </Card>
                    )}

                 {!isEditable && (
                    <Card>
                        <Card.Header>Payment Info</Card.Header>
                            <Card.Body>
                                <Form.Group as={Row} controlId="formPaidAmount">
                                    <Form.Label column sm="3">Amount Paid</Form.Label>
                                    <Col sm="9">
                                        <Form.Control
                                            as="textarea"
                                            value={paymentInstructions}
                                            rows={formData.payment_info.length + 2 || 3}
                                            readOnly
                                            style={readOnlyFieldStyle}
                                        />
                                    </Col>
                                </Form.Group>
                                                <Form.Group as={Row} controlId="formTotalPrice">
                                                <Form.Label column sm="3">Total Price</Form.Label>
                                                <Col sm="9">
                                                    <Form.Control
                                                        type="text"
                                                        name="totalPrice"
                                                        value={`₹${totalPrice.toFixed(2)}`}
                                                        readOnly
                                                        style={readOnlyFieldStyle}
                                                    />
                                                </Col>
                                            </Form.Group>

                                            <Form.Group as={Row} controlId="formFinalPricePerNight">
                                               <Form.Label column sm="3">Price Per Night</Form.Label>
                                                    <Col sm="9">
                                                         <Form.Control
                                                            type="text"
                                                            value={`₹${formData.finalPricePerNight.toFixed(2)}`}
                                                            readOnly
                                                            style={readOnlyFieldStyle}
                                                         />
                                                    </Col>
                                            </Form.Group>


                            <Form.Group as={Row} controlId="formBalance">
                                <Form.Label column sm="3">Balance</Form.Label>
                                <Col sm="9">
                                    <div
                                        className={`form-control ${
                                            balance === 0 ? 'bg-info text-white' : balance > 0 ? 'bg-danger text-white' : 'bg-warning text-dark'
                                        }`}
                                    >
                                        {`₹${balance.toFixed(2)}`}
                                    </div>
                                </Col>
                            </Form.Group>

                                        </Card.Body>

                    </Card>
                    )}

                 {/* Payment or Refund Card */}
                 {(balance !== 0) && !isEditable && (
                         <Card className="mb-3">
                           <Card.Header>{balance > 0 ? "New Payment Information" : "New Refund Information"}</Card.Header>
                           <Card.Body>
                             {/* Payment/Refund Amount */}
                             <Form.Group as={Row} controlId="formPaymentAmount">
                               <Form.Label column sm="3">
                                 {balance > 0 ? "Payment Amount" : "Refund Amount"}
                               </Form.Label>
                               <Col sm="9">
                                 <Form.Control
                                   type="number"
                                   name="paymentAmount"
                                   value={updateInput.paymentAmount}
                                   onChange={handleUpdateChange}
                                   min="0" // Restrict negative input
                                   required
                                 />
                               </Col>
                             </Form.Group>

                             {/* Payment/Refund Mode */}
                             <Form.Group as={Row} controlId="formPaymentMode">
                               <Form.Label column sm="3">Payment Mode</Form.Label>
                               <Col sm="9">
                                 <Form.Control
                                   as="select"
                                   name="paymentMode"
                                   value={updateInput.paymentMode}
                                   onChange={handleUpdateChange}
                                 >
                                   <option value="">Select Payment Mode</option>
                                   <option value="CASH">CASH</option>
                                   <option value="UPI">UPI</option>
                                 </Form.Control>
                               </Col>
                             </Form.Group>
<Form.Group as={Row} controlId="formPaymentDate">
                        <Form.Label column sm="3">Payment Date</Form.Label>
                        <Col sm="9">
                            <DatePicker
                               selected={
                                   isAdmin
                                     ? updateInput.paymentDate
                                       ? new Date(updateInput.paymentDate)
                                       : null
                                     : new Date() // Non-admin gets current date/time
                                 }

                                onChange={(date) => isAdmin && handlePaymentDateChange(date, 'paymentDate')} // Only admin can change
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy hh:mm a"
                                className="form-control"
                                placeholderText="Select date & time"
                                minDate={new Date(new Date().setDate(new Date().getDate() - 30))} // 30 days prior
                                maxDate={new Date()} // No future date allowed
                                disabled={!isAdmin} // Non-admin cannot change
                            />
                        </Col>
                    </Form.Group>
                <Form.Group as={Row} controlId="formPaymentNote">
                    <Form.Label column sm="3">Payment Notes</Form.Label>
                    <Col sm="9">
                        <Form.Control
                            as="select"
                            name="paymentNote"
                            value={updateInput.paymentNote} // Correct field name
                            onChange={handleUpdateChange} // Handles changes for the input field
                        >
                            <option value="">Select Payment Notes</option>
                            <option value="DISCOUNT">Discount</option>
                            <option value="PAY LATER">Pay Later</option>
                        </Form.Control>
                    </Col>
                </Form.Group>

                             {/* Submit Payment/Refund Button */}
                             <Button
                               className="mt-3"
                               variant={balance > 0 ? "primary" : "warning"}
                               onClick={() => handlePaymentOrRefundSubmit(balance > 0 ? "payment" : "refund")}
                             >
                               {balance > 0 ? "Submit Payment" : "Submit Refund"}
                             </Button>

                           </Card.Body>
                         </Card>
                    )}


                 {formData.stay_info.bookingStatus === "Checked-Out"  &&
                       formData.payment_info.some(payment => payment.paymentStatus === "DUE")  && (
                                             <Card className="mb-3">
                                               <Card.Header>New Payment Information</Card.Header>
                                               <Card.Body>
                                                 {/* Payment/Refund Amount */}
                                                 <Form.Group as={Row} controlId="formPaymentAmount">
                                                   <Form.Label column sm="3">
                                                     {"Payment Amount"}
                                                   </Form.Label>
                                                   <Col sm="9">
                                                     <Form.Control
                                                       type="number"
                                                       name="paymentAmount"
                                                       value={updateInput.paymentAmount}
                                                       onChange={handleUpdateChange}
                                                       min="0" // Restrict negative input
                                                       required
                                                     />
                                                   </Col>
                                                 </Form.Group>

                                                 {/* Payment/Refund Mode */}
                                                 <Form.Group as={Row} controlId="formPaymentMode">
                                                   <Form.Label column sm="3">Payment Mode</Form.Label>
                                                   <Col sm="9">
                                                     <Form.Control
                                                       as="select"
                                                       name="paymentMode"
                                                       value={updateInput.paymentMode}
                                                       onChange={handleUpdateChange}
                                                     >
                                                       <option value="">Select Payment Mode</option>
                                                       <option value="CASH">CASH</option>
                                                       <option value="UPI">UPI</option>
                                                     </Form.Control>
                                                   </Col>
                                                 </Form.Group>

<Form.Group as={Row} controlId="formPaymentDate">
                        <Form.Label column sm="3">Payment Date</Form.Label>
                        <Col sm="9">
                            <DatePicker
                                selected={
                                    isAdmin
                                        ? new Date()
                                        : new Date() // Non-admin gets auto-populated value
                                }

                                onChange={(date) => isAdmin && handlePaymentDateChange(date, 'paymentDate')} // Only admin can change
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy hh:mm a"
                                className="form-control"
                                placeholderText="Select date & time"
                                minDate={new Date(new Date().setDate(new Date().getDate() - 30))} // 30 days prior
                                maxDate={new Date()} // No future date allowed
                                disabled={!isAdmin} // Non-admin cannot change
                            />
                        </Col>
                    </Form.Group>
                                    <Form.Group as={Row} controlId="formPaymentNote">
                                        <Form.Label column sm="3">Payment Notes</Form.Label>
                                        <Col sm="9">
                                            <Form.Control
                                                as="select"
                                                name="paymentNote"
                                                value={updateInput.paymentNote} // Correct field name
                                                onChange={handleUpdateChange} // Handles changes for the input field
                                            >
                                                <option value="">Select Payment Notes</option>
                                                <option value="SETTLEMENT">Settlement</option>
                                            </Form.Control>
                                        </Col>
                                    </Form.Group>

                                                 {/* Submit Payment/Refund Button */}
                                                 <Button
                                                   className="mt-3"
                                                   variant="primary"
                                                   onClick={() => handleSettleSubmit("payment")}
                                                 >
                                                   Submit Due Payment
                                                 </Button>

                                               </Card.Body>
                                             </Card>
                                        )}

      {/* Checkout Button */}

      {(formData.stay_info.bookingStatus === "Checked-In" || formData.stay_info.bookingStatus === "Confirmed") &&
        !isCheckout && !isCancel && !isEditable &&  (
             <Button className="mt-3" variant="success" onClick={handleEdit}>
               EDIT
             </Button>
      )}

      {isEditable && (
           <Button className="mt-3" variant="primary" onClick={handleSubmit}>
             SUBMIT
           </Button>
         )}

      {balance === 0 && formData.stay_info.bookingStatus === "Checked-In" && isCheckout && (
        <Button className="mt-3" variant="success" onClick={handleCheckoutOrCancelSubmit}>
          Checkout
        </Button>
      )}

      {/* Cancel Button */}
      {balance === 0 && formData.stay_info.bookingStatus === "Confirmed" && isCancel && (
        <Button className="mt-3" variant="danger" onClick={handleCheckoutOrCancelSubmit}>
          Cancel Booking
        </Button>
      )}
                 </Form>
                )}
            </div>
        );
}
export default CheckoutForm;

