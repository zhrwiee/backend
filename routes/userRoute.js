import express from 'express';
import { loginUser, registerUser, getProfile,getDepartments ,deleteHealthRecord, getHealthRecords, addHealthRecord, deleteMyAppointment,markAsRead , checkSlotAvailability,updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay, paymentStripe, verifyStripe } from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
const userRouter = express.Router();

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)
userRouter.delete("/delete-appointment/:id", authUser, deleteMyAppointment);
userRouter.post("/mark-as-read", authUser, markAsRead)
userRouter.get("/departments", getDepartments)
userRouter.get('/check-slot', checkSlotAvailability)
userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)
userRouter.post("/book-appointment", upload.single("referralLetter"), authUser, bookAppointment)
userRouter.get("/appointments", authUser, listAppointment)
userRouter.post("/cancel-appointment", authUser, cancelAppointment)
userRouter.post("/payment-razorpay", authUser, paymentRazorpay)
userRouter.post("/verifyRazorpay", authUser, verifyRazorpay)
userRouter.post("/payment-stripe", authUser, paymentStripe)
userRouter.post("/verifyStripe", authUser, verifyStripe)
userRouter.post("/health-record", authUser, addHealthRecord);
userRouter.get("/health-records", authUser, getHealthRecords);
userRouter.delete("/health-record/:id", authUser, deleteHealthRecord);



export default userRouter;