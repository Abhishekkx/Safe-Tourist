const mongoose = require('mongoose');

const safeHavenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['POLICE', 'HOSPITAL', 'EMBASSY', 'SAFE_ZONE'],
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    open24Hours: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

safeHavenSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SafeHaven', safeHavenSchema);
