import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import departmentModel from "../models/DepartmentModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";

// API for admin login
const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// POST /api/admin/update-department/:id
const updateDepartment = async (req, res) => {
  try {
    const { departmentname } = req.body;
    const { id } = req.params;
    const imageFile = req.file;

    if (!departmentname) {
      return res.json({ success: false, message: 'Department name is required' });
    }

    const updateData = { departmentname };

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: 'image'
      });
      updateData.image = imageUpload.secure_url;
    }

    await departmentModel.findByIdAndUpdate(id, updateData);

    res.json({ success: true, message: 'Department updated' });

  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// API to add  department 
const addDepartment = async (req, res) => {
  try {
    const { departmentname } = req.body;
    const imageFile = req.file;

    if (!departmentname) {
      return res.json({ success: false, message: 'Department name is required' });
    }

    if (!imageFile) {
      return res.json({ success: false, message: 'Image file is required' });
    }

    // Upload image to Cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image"
    });

    const departmentData = {
      departmentname,
      image: imageUpload.secure_url,
      createdAt: Date.now() // Align with schema field
    };

    const newDepartment = new departmentModel(departmentData);
    await newDepartment.save();

    res.json({
      success: true,
      message: 'Department added successfully',
      department: newDepartment
    });

  } catch (error) {
    console.error(error);

    res.json({
      success: false,
      message: 'Failed to add department'
    });
  }
};


// API for adding Doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, about, address, department } = req.body;
        const imageFile = req.file; // may be undefined if user doesn't upload

        if (!name || !email || !password || !about || !address || !department) {
            return res.json({ success: false, message: "Missing Details" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let imageUrl = null;

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            imageUrl = imageUpload.secure_url;
        }

        const doctorData = {
            name,
            email,
            password: hashedPassword,
            image: imageUrl, // may be null
            about,
            address: JSON.parse(address),
            departmentname: department,
            date: Date.now()
        };

        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();

        res.json({ success: true, message: 'Doctor Added' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};


// api to get all department list for admin panel
const allDepartments = async (req, res) => {
  try {
    const departments = await departmentModel.find({});
    res.json({ success: true, departments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    await departmentModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Department deleted" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});
    const departments = await departmentModel.find({});

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      departments: departments.length,
      latestAppointments: appointments.reverse().slice(0, 5), // limit 5 here for efficiency
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
    loginAdmin,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    updateDepartment,
    deleteDepartment,
    allDepartments,
    addDepartment,
    allDoctors,
    adminDashboard
}