import React, { useState, useEffect} from 'react';
import { Card, Form, Button, Col, Row, Modal } from 'react-bootstrap';
import axios from "axios";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parse } from "date-fns";
import { createBooking, sendMessage, fetchAvailableRooms, fetchUserDetails} from '../api';


function CheckInForm({isAdmin}) {


    const defaultFormData = {
        personal_info: {
            name: '',
            phoneNumber: '',
            identity: '',
            address: '',
            email: '',
        },
        stay_info: {
            checkInDateTime: '',
            probableCheckOutDateTime: '',
            durationOfStay: 1,
            bookingMode: '',
        },
        rooms: [
            {
                roomType: '',
                roomNumber: "",
                isAcRoom: false,
                occupancy: '',
                extraPersons: 0,
                roomId: ""
            },
        ],
        payment_info: {
            paymentAmount: '',
            paymentMode: '',
            finalPricePerNight: ''
        },
    };
    const [formData, setFormData] = useState(defaultFormData);
    const [bookingStatus, setBookingStatus] = useState(0);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [priceBreakup, setPriceBreakup] = useState('');

    const roomTypeOccupancyMap = {
        Studio: ['Single', 'Double'],
        Luxury: ['Single', 'Double'],
        Triple: ['Triple']
    };

    // Formatting the date in dd/mm/yyyy hh:mm AM/PM format
    const formatDate = (date) => {
        return format(date, "dd/MM/yyyy hh:mm a");
    };

    const calculateMinDate = () => {
            const now = new Date();
            now.setDate(now.getDate() - 3); // Subtract 2 days from today
            return now; // Format: YYYY-MM-DDTHH:mm
        };

    useEffect(() => {
    if (!isAdmin) {
        const currentDateTime = new Date();
        setFormData(prevData => ({
            ...prevData,
            stay_info: {
                ...prevData.stay_info,
                checkInDateTime: currentDateTime,
                probableCheckOutDateTime: null,
                durationOfStay: 1
            },
            rooms: prevData.rooms.map((room, index) =>
                index === 0
                    ? { ...room }
                    : room
            )
        }));
    }

    }, [isAdmin]);

    const handleDateChange = (date, field) => {
        setFormData((prevData) => ({
            ...prevData,
            stay_info: {
                ...prevData.stay_info,
                [field]: date,
            },
        }));
    };

    useEffect(() => {
    if (!formData.stay_info.checkInDateTime || !formData.stay_info.probableCheckOutDateTime) {
                console.log( "$$$$$$$$$$$$$$$$$$$$$$")
                    return;
                }
    console.log( "^^^^^^^^^^^^^^^^^^^^^")
        const calculateDurationOfStay = () => {
            const { checkInDateTime, probableCheckOutDateTime } = formData.stay_info;
            console.log(checkInDateTime)
            if (!checkInDateTime || !probableCheckOutDateTime) {
            console.log( "^^^^^^^^-------^^^^^^^^^^^^^")
                console.warn('Invalid date values:', { checkInDateTime, probableCheckOutDateTime });
                return;
            }
            // Parse dates
            const checkIn = new Date(checkInDateTime);
            console.log(checkIn)
            const checkOut = new Date(probableCheckOutDateTime);
            // Ensure valid Date objects
            if ( isNaN(checkIn.getTime())) {
                console.error('Invalid Date object:', { checkIn });
                return;
            }
            if ( isNaN(checkOut.getTime())) {
                        console.error('Invalid Date object:', { checkOut });
                        return;
                    }
            if (checkOut > checkIn) {
                const timeDifference = checkOut - checkIn; // Difference in milliseconds
                const duration = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // Convert to days and round up

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

    // Fetch available rooms
    useEffect(() => {
   if (!formData.stay_info.checkInDateTime || !formData.stay_info.probableCheckOutDateTime) {
                console.log( "$$$$$$$$$$$$$$$$$$$$$$")
                    return;
                }
    const loadAvailableRooms = async () => {
      if (!formData.stay_info.durationOfStay) return;
      try {
        const rooms = await fetchAvailableRooms(
          formData.stay_info.durationOfStay,
          formData.stay_info.checkInDateTime,
          formData.stay_info.probableCheckOutDateTime
        );
        setAvailableRooms(rooms);
      } catch (error) {
        console.error("Error loading available rooms:", error);
      }
    };

    loadAvailableRooms();
  }, [formData.stay_info.checkInDateTime, formData.stay_info.probableCheckOutDateTime, formData.stay_info.durationOfStay]);

    useEffect(() => {
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
  } else if (name === "extraPersons" ) {
        // For other fields like roomType, occupancy, or isAcRoom
        updatedRooms[index] = {
          ...updatedRooms[index],
          [name]: type === 'checkbox' ? checked : value, // Handle checkbox for AC toggle
        };
      }

  else {
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

    const handleChange = (event, section) => {
        const { name, value } = event.target;
        setFormData(prevData => ({
            ...prevData,
            [section]: {
                ...prevData[section],
                [name]: value,
            }
        }));
    };

//    useEffect(() => {
//        const loadAvailableRooms = async () => {
//          if (!formData.stay_info.durationOfStay) return;  // Check if durationOfStay is set
//          try {
//            const rooms = await fetchAvailableRooms(formData.stay_info.durationOfStay, formData.stay_info.checkInDateTime);
//            setAvailableRooms(rooms);  // Update state with the available rooms
//          } catch (error) {
//            console.error("Error loading available rooms:", error);
//          }
//        };
//
//        loadAvailableRooms();  // Call the function inside useEffect
//
//    }, [formData.stay_info.checkInDateTime, formData.stay_info.durationOfStay]);  // Dependency array for re-running the effect

    const handlePhoneBlur = async () => {
        if (!formData.personal_info.phoneNumber.trim()) {
          return; // Do nothing if phone number is empty
        }

        try {
          const data = await fetchUserDetails(formData.personal_info.phoneNumber.trim());
          if (data.error) {
                console.error("Error:", data.error);
                // Optionally, display an error message to the user
                return; // Stop further execution
              }
          // Populate the form fields if user data is found
          setFormData(prevData => ({
                        ...prevData,
                        personal_info: {
                            ...prevData.personal_info,
                            name: data.name || '',
                            identity: data.identity || '',
                            address: data.address || '',
                            email: data.email || '',
                        },
          }));
        } catch (error) {
          console.error('Error fetching user details:', error);

          // Reset the form fields in case of an error
          setFormData((prevData) => ({
            ...prevData,
                        personal_info: {
                            ...prevData.personal_info,
                            name: '',
                            identity: '',
                            address: '',
                            email: '',
                        },
                   }));
          }
        };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Add bookingStatus and finalPricePerNight to formData
        const updatedFormData = {
            ...formData, // Spread the existing form data
            bookingStatus: "Checked-In", // Add bookingStatus
        };


        try {
            // Call Create Booking API
            const bookingResponse = await createBooking(updatedFormData);

            // If booking is successful, call Send Message API
            if (bookingResponse.success) {
                alert('Booking successful, and confirmation message sent to the guest.');
                const messageData = {
                    phoneNumber: formData.personal_info.phoneNumber,
                    message: `Dear ${formData.personal_info.name}, your booking at Hotel Sri Krishna has been confirmed! Booking ID: ${bookingResponse.bookingId}. Thank you!`,
                };
//                const messageResponse = await sendMessage(messageData);
//                console.log('Message Response:', messageResponse);
//
//                if (messageResponse.success) {
//                    alert('Booking successful, and confirmation message sent to the guest.');
//                } else {
//                    alert('Booking successful, but failed to send confirmation message.');
//                }
                // Reset form data to default values
                setFormData(defaultFormData);
                setBookingStatus(0);
                setAvailableRooms([]);
                setFilteredRooms([]);
                setTotalPrice(0);
                setPriceBreakup('');
            } else {
                alert('Failed to create booking. Please try again.');
            }
        } catch (error) {
            console.error('Error during booking submission:', error);
            alert('An error occurred while processing the booking. Please try again.');
        }
    };

    return (
    <>
        <Form onSubmit={handleSubmit} autoComplete="off" >
            {/* Personal Information Card */}
            <Card className="mb-3">
                <Card.Header>Personal Information</Card.Header>
                <Card.Body>
                    <Form.Group as={Row} controlId="formName" autoComplete="off">
                        <Form.Label column sm="3">Guest Name</Form.Label>
                        <Col sm="9">
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.personal_info.name} // Accessing the nested "name"
                                onChange={(e) => handleChange(e, 'personal_info')} // Custom handler for nested data
                                required
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
                                onBlur={handlePhoneBlur}
                                required
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
                            />
                        </Col>
                    </Form.Group>
                </Card.Body>
            </Card>

            {/* Stay Information Card */}
            <Card className="mb-3" >
                <Card.Header>Stay Information</Card.Header>
                <Card.Body >
<Form.Group as={Row} controlId="formCheckInDateTime">
    <Form.Label column sm="3">Check-In Date & Time</Form.Label>
    <Col sm="9">
        <DatePicker
            selected={
                isAdmin
                    ? formData.stay_info.checkInDateTime
                        ? new Date(formData.stay_info.checkInDateTime)
                        : new Date()
                    : new Date() // Non-admin gets auto-populated value
            }
            onChange={(date) => isAdmin && handleDateChange(date, 'checkInDateTime')} // Only admin can change
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

<Form.Group as={Row} controlId="formProbableCheckOutDateTime">
    <Form.Label column sm="3">Probable Check-Out Date & Time</Form.Label>
    <Col sm="9">
        <DatePicker
            selected={formData.stay_info.probableCheckOutDateTime ? new Date(formData.stay_info.probableCheckOutDateTime) : null}
            onChange={(date) => handleDateChange(date, 'probableCheckOutDateTime')}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="dd/MM/yyyy hh:mm a"
            className="form-control"
            placeholderText="Select date & time"

            // Checkout date cannot be the same as check-in if 2-hour gap crosses midnight
            minDate={
                formData.stay_info.checkInDateTime
                    ? (() => {
                        const checkInDate = new Date(formData.stay_info.checkInDateTime);
                        const minCheckoutTime = new Date(checkInDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

                        // If 2-hour gap crosses midnight, force checkout to start from the next day
                        return minCheckoutTime.getDate() !== checkInDate.getDate()
                            ? new Date(checkInDate.setDate(checkInDate.getDate() + 1)) // Move to next day
                            : checkInDate; // Otherwise, keep same date
                    })()
                    : new Date()
            }

            // Checkout cannot be more than 10 days after check-in
            maxDate={
                formData.stay_info.checkInDateTime
                    ? new Date(new Date(formData.stay_info.checkInDateTime).setDate(new Date(formData.stay_info.checkInDateTime).getDate() + 10))
                    : new Date(new Date().setDate(new Date().getDate() + 10))
            }

            // Min time logic: Only restrict time on check-in date
            minTime={
                formData.stay_info.checkInDateTime
                    ? (() => {
                        const checkInDate = new Date(formData.stay_info.checkInDateTime);
                        const minCheckoutTime = new Date(checkInDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
                        const selectedDate = new Date(formData.stay_info.probableCheckOutDateTime || checkInDate);

                        // If checkout date is the same as check-in, enforce 2-hour rule
                        if (checkInDate.toDateString() === selectedDate.toDateString()) {
                            return minCheckoutTime;
                        }
                        // For next day and beyond, allow all times (start from 12:00 AM)
                        return new Date(selectedDate.setHours(0, 0, 0, 0));
                    })()
                    : null
            }

            maxTime={new Date().setHours(23, 59, 59)} // End of the day
        />
    </Col>
</Form.Group>



                    <Form.Group as={Row} controlId="formDurationOfStay">
                        <Form.Label column sm="3">Duration of Stay</Form.Label>
                        <Col sm="9">
                            <Form.Control
                                type="number"
                                name="durationOfStay"
                                value={formData.stay_info.durationOfStay} // Accessing nested checkInDateTime
                                onChange={(e) => handleChange(e, 'stay_info')}
                                readOnly
                                min="1" // Restrict negative input
                                max="10"
                            />
                        </Col>
                    </Form.Group>



                    <Form.Group as={Row} controlId="formBookingMode">
                        <Form.Label column sm="3">Booking Mode</Form.Label>
                        <Col sm="9">
                            <Form.Control
                                as="select"
                                name="bookingMode"
                                value={formData.stay_info.bookingMode} // Accessing nested checkInDateTime
                                onChange={(e) => handleChange(e, 'stay_info')}
                                readOnly // Making the field read-only
                            >
                            <option value="">Select Booking Mode</option>
                            <option value="ONLINE">ONLINE</option>
                            <option value="WALKIN">WALK-IN</option>
                            <option value="OVERPHONE">OVER-PHONE</option>
                            </Form.Control>
                        </Col>
                    </Form.Group>
                </Card.Body>
            </Card>

            {formData.rooms.map((room, index) => (
                <Card className="mb-3" key={index}>
                        <Card.Header>
                              Room-{index + 1}: {room.roomNumber ? `${room.occupancy} occupancy ${room.roomType} room #${room.roomNumber} (${room.isAcRoom ? "AC" : "Non-AC"})` : "(No Room Selected)"}
                            </Card.Header>
                    <Card.Body>
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
                          {(room.occupancy !== 'Single') && (

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
                    </Card.Body>
                </Card>
            ))}

            <Button variant="secondary" onClick={handleAddRoom} className="mb-3">
                Add Room
            </Button>


            {/* Payment Information Card */}
            <Card className="mb-3">
                <Card.Header>Payment Information</Card.Header>
                <Card.Body>
                    {/* Total Price and Price Breakup */}
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
                    <Form.Group as={Row} controlId="formFinalPricePerNight">
                        <Form.Label column sm="3">Final Price Per Night</Form.Label>
                        <Col sm="9">
                            <Form.Control
                                type="number"
                                name="finalPricePerNight"
                                value={formData.payment_info.finalPricePerNight} // Accessing nested field
                                onChange={(e) => handleChange(e, 'payment_info')} // Handling changes for payment_info
                                min="0" // Restrict negative input
                                required
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="formPaymentAmount">
                        <Form.Label column sm="3">Payment Amount</Form.Label>
                        <Col sm="9">
                            <Form.Control
                                type="number"
                                name="paymentAmount"
                                value={formData.payment_info.paymentAmount} // Accessing nested field
                                onChange={(e) => handleChange(e, 'payment_info')} // Handling changes for payment_info
                                min="0" // Restrict negative input
                                required
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="formPaymentMode">
                        <Form.Label column sm="3">Payment Mode</Form.Label>
                        <Col sm="9">
                            <Form.Control
                                as="select"
                                name="paymentMode"
                                value={formData.payment_info.paymentMode} // Accessing nested field
                                onChange={(e) => handleChange(e, 'payment_info')} // Handling changes for payment_info
                            >
                                <option value="">Select Payment Mode</option>
                                <option value="CASH">CASH</option>
                                <option value="UPI">UPI</option>
                            </Form.Control>
                        </Col>
                    </Form.Group>

                </Card.Body>
            </Card>

            {/* Submit Button */}

            <Button variant="primary" type="submit" className="mx-auto d-block">Submit</Button>

        </Form>
                    </>
    );
}

export default CheckInForm;
