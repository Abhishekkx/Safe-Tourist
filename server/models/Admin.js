const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'DISPATCHER', 'FIELD_RESPONDER'],
      default: 'DISPATCHER',
    },
    department: {
      type: String,
      default: 'Tourist Safety Command Center',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
