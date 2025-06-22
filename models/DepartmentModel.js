import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
 departmentname: { type: String, required: true, unique: true },
  image: { type: String, required: true },
  slots_booked: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. { "16_6_2025": ["08:00 AM", "08:30 AM"] }
  createdAt: { type: Date, default: Date.now },
});


const departmentModel = mongoose.models.department || mongoose.model("department", departmentSchema);
export default departmentModel;


// models/Department.js
// import { DataTypes } from 'sequelize';
// import sequelize from '../config/db.js'; // Adjust the path to your sequelize instance

// const Department = sequelize.define('Department', {
//   departmentname: {
//     type: DataTypes.STRING,
//     allowNull: false,
//     unique: true,
//   },
//   image: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   slots_booked: {
//     type: DataTypes.JSON, // Stores objects like { "16_6_2025": ["08:00 AM", "08:30 AM"] }
//     defaultValue: {},
//   },
//   createdAt: {
//     type: DataTypes.DATE,
//     defaultValue: DataTypes.NOW,
//   },
// }, {
//   tableName: 'departments',
//   timestamps: false, // You can set this to true if you want Sequelize to auto-manage `createdAt` and `updatedAt`
// });

// export default departmentModel;
