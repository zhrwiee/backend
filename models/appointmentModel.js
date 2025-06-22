import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  departmentname: { type: String, required: true },
  // Add this field
  read: { type: Boolean, default: false },
  docId: { type: String, required: false },        // optional until assigned
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: { type: Object, required: true },
  docData: { type: Object, required: false },       // optional until assigned
  date: { type: Number, required: true },
  referralLetter: { type: String, default: null }, // optional
  symptoms: { type: [String], default: [] },
  otherSymptom: { type: String, default: null },
  cancelled: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false }
});

const appointmentModel =
  mongoose.models.appointment || mongoose.model("appointment", appointmentSchema);

export default appointmentModel;


// models/Appointment.js
// import { DataTypes } from 'sequelize';
// import sequelize from '../config/db.js'; // Adjust path to your Sequelize config

// const Appointment = sequelize.define('Appointment', {
//   userId: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   departmentname: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   read: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: false,
//   },
//   docId: {
//     type: DataTypes.STRING,
//     allowNull: true,
//   },
//   slotDate: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   slotTime: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   userData: {
//     type: DataTypes.JSON,
//     allowNull: false,
//   },
//   docData: {
//     type: DataTypes.JSON,
//     allowNull: true,
//   },
//   date: {
//     type: DataTypes.BIGINT,
//     allowNull: false,
//   },
//   referralLetter: {
//     type: DataTypes.STRING,
//     allowNull: true,
//   },
//   symptoms: {
//     type: DataTypes.JSON, // Store array of strings
//     defaultValue: [],
//   },
//   otherSymptom: {
//     type: DataTypes.STRING,
//     allowNull: true,
//   },
//   cancelled: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: false,
//   },
//   isCompleted: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: false,
//   },
// }, {
//   tableName: 'appointments',
//   timestamps: false,
// });

// export default appointmentModel;

