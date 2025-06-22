import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import HealthRecordModel from "../models/healthRecordsModel.js";

// API for doctor Login 
const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
// const appointmentsDoctor = async (req, res) => {
//     try {

//         const { departmentname } = req.body
//         const appointments = await appointmentModel.find({ departmentname })

//         res.json({ success: true, appointments })

//     } catch (error) {
//         console.log(error)
//         res.json({ success: false, message: error.message })
//     }
// }

const appointmentsDoctor = async (req, res) => {
  try {
    const { docId } = req.body;

    // 1. Find doctor by ID
    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    const departmentname = doctor.departmentname; // assuming field is "department"

    // 2. Find appointments with the same department
    const appointments = await appointmentModel.find({ departmentname });

    res.json({ success: true, appointments });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: 'Appointment not found' });
    }

    appointment.isCompleted = true;
    await appointment.save();

    res.json({ success: true, message: 'Appointment marked as completed' });

  } catch (error) {
    console.error('appointmentComplete error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};


// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
  try {
    const { docId, address, about, available, name, password } = req.body;

    const updateFields = { address, about, available };

    if (name) {
      updateFields.name = name;
    }
//
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    await doctorModel.findByIdAndUpdate(docId, updateFields);

    res.json({ success: true, message: 'Profile Updated' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
//
const addHealthRecord = async (req, res) => {
  try {
    const {
      userId,
      date,
      weight,
      height,
      bloodPressure,
      heartRate,
      diagnosis,
      notes
    } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ success: false, message: 'userId and date are required' });
    }

    const newRecord = new HealthRecordModel({
      userId,
      date,
      weight,
      height,
      bloodPressure,
      heartRate,
      diagnosis,
      notes
    });

    await newRecord.save();

    return res.json({ success: true, message: 'Health record added successfully' });
  } catch (error) {
    console.error("Add Health Record Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.body;

    // 1. Find the doctor
    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    const departmentname = doctor.departmentname;

    // 2. Find all appointments under this department
    const appointments = await appointmentModel.find({ departmentname });

    // 3. Get unique patient IDs
    const patients = [...new Set(appointments.map(item => item.userId.toString()))];

    // 4. Construct dashboard data
    const dashData = {
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.slice().reverse() // clone and reverse
    };

    res.json({ success: true, dashData });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};



export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    addHealthRecord,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile
}