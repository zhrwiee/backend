import mongoose from "mongoose";

const healthRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  date: { type: Date, required: true },
  weight: { type: Number },          // in kg
  height: { type: Number },          // in cm
  bloodPressure: { type: String },   // e.g. "120/80"
  heartRate: { type: Number },       // in bpm
  diagnosis: { type: String },
  notes: { type: String },
}, { timestamps: true });

const HealthRecord = mongoose.models.HealthRecord || mongoose.model("HealthRecord", healthRecordSchema);
export default HealthRecord;

// models/HealthRecord.js
// import { DataTypes } from 'sequelize';
// import sequelize from '../config/db.js'; // Adjust path to your Sequelize DB config

// const HealthRecord = sequelize.define('HealthRecord', {
//   userId: {
//     type: DataTypes.STRING, // Use UUID or foreign key as needed
//     allowNull: false,
//   },
//   date: {
//     type: DataTypes.DATE,
//     allowNull: false,
//   },
//   weight: {
//     type: DataTypes.FLOAT, // Accepts decimal or integer
//     allowNull: true,
//   },
//   height: {
//     type: DataTypes.FLOAT,
//     allowNull: true,
//   },
//   bloodPressure: {
//     type: DataTypes.STRING,
//     allowNull: true,
//   },
//   heartRate: {
//     type: DataTypes.INTEGER,
//     allowNull: true,
//   },
//   diagnosis: {
//     type: DataTypes.TEXT,
//     allowNull: true,
//   },
//   notes: {
//     type: DataTypes.TEXT,
//     allowNull: true,
//   },
// }, {
//   tableName: 'health_records',
//   timestamps: true, // adds createdAt and updatedAt
// });

// export default HealthRecord;

