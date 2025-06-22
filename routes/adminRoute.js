import express from 'express';
import { loginAdmin, appointmentsAdmin, appointmentCancel,updateDepartment, deleteDepartment,addDoctor, allDoctors,allDepartments,addDepartment, adminDashboard } from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)
adminRouter.get("/update-department", upload.single('image'), authAdmin, updateDepartment)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.get("/all-departments", authAdmin, allDepartments)
adminRouter.post('/add-department', authAdmin, upload.single('image'), addDepartment)
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.delete("/delete-department/:id", authAdmin, deleteDepartment);
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.get("/dashboard", authAdmin, adminDashboard)

export default adminRouter;