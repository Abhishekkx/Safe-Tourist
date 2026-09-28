const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'INC-' + Math.floor(100000 + Math.random() * 900000),
    },
    type: {
      type: String,
      enum: ['SOS_CRITICAL', 'MEDICAL', 'THEFT_ASSAULT', 'LOST_PATH', 'NATURAL_HAZARD', 'GENERAL'],
      default: 'SOS_CRITICAL',
    },
    status: {
      type: String,
      enum: ['PENDING', 'DISPATCHED', 'ON_SCENE', 'RESOLVED', 'REJECTED'],
      default: 'PENDING',
    },
    urgency: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'HIGH',
    },
    touristName: {
      type: String,
      default: 'Anonymous Tourist',
    },
    contactNumber: {
      type: String,
      default: 'Not Provided',
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
    address: {
      type: String,
      default: 'Unknown Location',
    },
    description: {
      type: String,
      default: '',
    },
    mediaUrls: [
      {
        type: String,
      },
    ],
    voiceNoteUrl: {
      type: String,
      default: null,
    },
    isSilent: {
      type: Boolean,
      default: false,
    },
    assignedResponder: {
      type: String,
      default: null,
    },
    notes: [
      {
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

incidentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Incident', incidentSchema);
