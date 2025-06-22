import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import healthRecordModel from "../models/healthRecordsModel.js";
// import HealthRecord from '../models/healthRecordModel.js';
import departmentModel from "../models/DepartmentModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import razorpay from 'razorpay';

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        // checking for all data to register user
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
// POST /api/user/mark-as-read
const markAsRead = async (req, res) => {
  try {
    const { items } = req.body;
    for (const item of items) {
      if (item.type === 'appointment') {
        await appointmentModel.findByIdAndUpdate(item._id, { read: true });
      } else if (item.type === 'health-record') {
        await healthRecordModel.findByIdAndUpdate(item._id, { read: true });
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// API to update user profile
const updateProfile = async (req, res) => {

    try {

        const { userId, name, phone, address, dob, gender, nric,nationality} = req.body;
        const imageFile = req.file

        if (!name || !phone || !dob || !gender || !nric|| !nationality) {
            return res.json({ success: false, message: "Data Missing" })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender,nric,nationality })

        if (imageFile) {

            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const bookAppointment = async (req, res) => {
  try {
    const {
      userId,
      departmentname,
      slotDate,
      slotTime,
      otherSymptom = '',
    } = req.body;

    // ✅ Fix: Parse symptoms safely from FormData
    const symptomsRaw = req.body.symptoms || req.body['symptoms[]'];
    const symptoms = Array.isArray(symptomsRaw)
      ? symptomsRaw
      : symptomsRaw
      ? [symptomsRaw]
      : [];

    // Basic validation
    if (!userId || !departmentname || !slotDate || !slotTime) {
      return res.json({ success: false, message: 'Missing required fields' });
    }

    // Get user
    const userData = await userModel.findById(userId).select('-password');
    if (!userData) {
      return res.json({ success: false, message: 'User not found' });
    }

    // Get department
    const department = await departmentModel.findOne({ departmentname });
    if (!department) {
      return res.json({ success: false, message: 'Department not found' });
    }

    // Handle booked slots
    if (!department.slots_booked) department.slots_booked = {};
    const slots = department.slots_booked;

    if (slots[slotDate]?.includes(slotTime)) {
      return res.json({ success: false, message: 'Time slot not available' });
    }

    // Upload referral letter (optional)
    let referralLetterUrl = null;
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'auto',
        folder: 'referral_letters',
      });
      referralLetterUrl = uploadResult.secure_url;
    }

    // Update booked slots
    if (!slots[slotDate]) slots[slotDate] = [];
    slots[slotDate].push(slotTime);

    // Create and save appointment
    const appointmentData = {
      userId,
      userData,
      departmentname,
      slotDate,
      slotTime,
      referralLetter: referralLetterUrl,
      symptoms,
      otherSymptom: otherSymptom.trim() || null,
      docId: department.docId, // <-- this must exist
      date: Date.now(),
    };


    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // Update department slot data
    await departmentModel.findByIdAndUpdate(department._id, { slots_booked: slots });

    return res.json({ success: true, message: 'Appointment booked successfully' });

  } catch (error) {
    console.error('bookAppointment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



const checkSlotAvailability = async (req, res) => {
  try {
    const { department, date } = req.query;

    if (!department || !date) {
      return res.json({ success: false, message: 'Missing department or date' });
    }

    const departmentData = await departmentModel.findOne({ departmentname: department });

    if (!departmentData) {
      return res.json({ success: false, message: 'Department not found' });
    }

    const slotsBooked = departmentData.slots_booked || {};
    const unavailable = slotsBooked[date] || [];

    res.json({ success: true, unavailable });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


const getDepartments = async (req, res) => {
  try {
    const departments = await departmentModel.find({});
    res.json({ success: true, departments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// API to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;

    if (!userId || !appointmentId) {
      return res.status(400).json({ success: false, message: 'Missing userId or appointmentId' });
    }

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Ensure only the appointment owner can cancel
    if (appointmentData.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    if (appointmentData.cancelled) {
      return res.json({ success: false, message: 'Appointment already cancelled' });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    res.json({ success: true, message: 'Appointment cancelled successfully' });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};




// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
const getHealthRecords = async (req, res) => {
  try {
    const { userId } = req.body
    const records = await healthRecordModel.find({ userId }).sort({ date: -1 });
    res.json({ success: true, records });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};


// POST /api/user/add-health-record
const addHealthRecord = async (req, res) => {
  try {
    const record = await healthRecordModel.create(req.body);
    res.json({ success: true, record });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};


const deleteMyAppointment = async (req, res) => {
  try {
    const id = req.params.id;
    await appointmentModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// GET /api/user/health-records?userId=123

//healthRecordModel

const deleteHealthRecord = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await healthRecordModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Health record not found' });
    }

    res.json({ success: true, message: "Health record deleted successfully" });
  } catch (error) {
    console.error('Delete health record error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        // creating options for razorpay payment
        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY,
            receipt: appointmentId,
        }

        // creation of an order
        const order = await razorpayInstance.orders.create(options)

        res.json({ success: true, order })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if (orderInfo.status === 'paid') {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true })
            res.json({ success: true, message: "Payment Successful" })
        }
        else {
            res.json({ success: false, message: 'Payment Failed' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const { origin } = req.headers

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: appointmentData.amount * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items: line_items,
            mode: 'payment',
        })

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const verifyStripe = async (req, res) => {
    try {

        const { appointmentId, success } = req.body

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true })
            return res.json({ success: true, message: 'Payment Successful' })
        }

        res.json({ success: false, message: 'Payment Failed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}


export {
    loginUser,
    markAsRead,
    checkSlotAvailability,
    registerUser,
    getProfile,
    deleteMyAppointment,
    updateProfile,
    getDepartments,
    getHealthRecords,
    addHealthRecord,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    deleteHealthRecord,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe
}