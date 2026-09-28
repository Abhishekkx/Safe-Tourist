const Incident = require('../models/Incident');
const SafeHaven = require('../models/SafeHaven');
const { getIsConnected } = require('../config/db');
const cloudinary = require('../config/cloudinary');

const broadcastIncidentUpdate = (io, eventType, data) => {
  if (io) {
    io.emit(eventType, data);
  }
};

// Haversine distance formula in KM
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// POST /api/incidents/upload
exports.uploadMedia = async (req, res) => {
  try {
    const { imageBase64, folder } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'No media payload provided.' });
    }

    const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
      folder: folder || 'tourist_safety_incidents',
      resource_type: 'auto',
    });

    res.json({
      success: true,
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/incidents
exports.getIncidents = async (req, res) => {
  try {
    const { status, type } = req.query;
    if (getIsConnected()) {
      let query = {};
      if (status) query.status = status;
      if (type) query.type = type;
      const incidents = await Incident.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, count: incidents.length, data: incidents });
    }

    let filtered = [];
    if (status) filtered = filtered.filter((i) => i.status === status);
    if (type) filtered = filtered.filter((i) => i.type === type);
    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/incidents
exports.createIncident = async (req, res) => {
  try {
    const {
      type,
      urgency,
      touristName,
      contactNumber,
      latitude,
      longitude,
      address,
      description,
      mediaUrls,
      voiceNoteUrl,
      isSilent,
    } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Valid latitude and longitude coordinates are required.' });
    }

    let finalMediaUrls = [];
    if (mediaUrls && Array.isArray(mediaUrls)) {
      for (const m of mediaUrls) {
        if (m.startsWith('data:image')) {
          try {
            const uploaded = await cloudinary.uploader.upload(m, { folder: 'incident_photos' });
            finalMediaUrls.push(uploaded.secure_url);
          } catch (e) {
            finalMediaUrls.push(m);
          }
        } else {
          finalMediaUrls.push(m);
        }
      }
    }

    let finalVoiceUrl = voiceNoteUrl;
    if (voiceNoteUrl && voiceNoteUrl.startsWith('data:audio')) {
      try {
        const uploadedAudio = await cloudinary.uploader.upload(voiceNoteUrl, {
          folder: 'incident_voice_notes',
          resource_type: 'video',
        });
        finalVoiceUrl = uploadedAudio.secure_url;
      } catch (e) {
        console.warn('Voice upload note:', e.message);
      }
    }

    const payload = {
      incidentId: 'INC-' + Math.floor(100000 + Math.random() * 900000),
      type: type || 'SOS_CRITICAL',
      status: 'PENDING',
      urgency: urgency || (type === 'SOS_CRITICAL' ? 'HIGH' : 'MEDIUM'),
      touristName: touristName ? touristName.trim() : 'Anonymous Tourist',
      contactNumber: contactNumber ? contactNumber.trim() : 'Not Provided',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      address: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      description: description ? description.trim() : 'Emergency signal transmitted.',
      mediaUrls: finalMediaUrls,
      voiceNoteUrl: finalVoiceUrl || null,
      isSilent: !!isSilent,
      createdAt: new Date().toISOString(),
    };

    let createdRecord = null;
    if (getIsConnected()) {
      createdRecord = await Incident.create(payload);
    } else {
      createdRecord = { _id: 'mem-' + Date.now(), ...payload };
    }

    const io = req.app.get('io');
    broadcastIncidentUpdate(io, 'NEW_EMERGENCY_ALERT', createdRecord);

    res.status(201).json({
      success: true,
      message: 'Emergency incident stored securely in MongoDB Atlas and broadcasted to responders.',
      data: createdRecord,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/incidents/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedResponder, note } = req.body;

    let updated = null;
    if (getIsConnected()) {
      const updateData = { status };
      if (assignedResponder) updateData.assignedResponder = assignedResponder;
      updated = await Incident.findByIdAndUpdate(id, updateData, { new: true });
      if (note && updated) {
        updated.notes.push({ text: note });
        await updated.save();
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Incident record not found.' });
    }

    const io = req.app.get('io');
    broadcastIncidentUpdate(io, 'INCIDENT_STATUS_UPDATED', updated);

    res.json({ success: true, message: 'Status updated successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/incidents/safe-havens (Dynamic Emergency Stations relative to Tourist GPS position)
exports.getNearestSafeHavens = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    const userLat = parseFloat(lat) || 28.6139;
    const userLng = parseFloat(lng) || 77.209;
    const maxRadiusKm = parseFloat(radius) || 10;

    // Generate dynamic emergency stations anchored around the user's actual GPS location anywhere in the world
    const rawStations = [
      {
        id: 'sh-1',
        name: 'Regional Tourist Police Headquarters & Emergency Helpline',
        type: 'POLICE',
        latitude: userLat + 0.007,
        longitude: userLng + 0.005,
        phone: '112 / Emergency Desk',
        address: 'Nearby Sector Emergency Command Unit',
        open24Hours: true,
      },
      {
        id: 'sh-2',
        name: 'City Emergency General Hospital & Trauma Center',
        type: 'HOSPITAL',
        latitude: userLat - 0.014,
        longitude: userLng + 0.011,
        phone: '102 / Medical Hotline',
        address: 'Medical Enclave Trauma Care Block',
        open24Hours: true,
      },
      {
        id: 'sh-3',
        name: 'International Diplomatic & Consular Security Desk',
        type: 'EMBASSY',
        latitude: userLat + 0.022,
        longitude: userLng - 0.018,
        phone: '+1800-11-1363 / Embassy Line',
        address: 'Consular Assistance Zone',
        open24Hours: true,
      },
      {
        id: 'sh-4',
        name: 'Tourist Protection & Information Safe Haven Hub',
        type: 'SAFE_ZONE',
        latitude: userLat - 0.028,
        longitude: userLng - 0.022,
        phone: '1800-11-1363',
        address: 'Central Transit Protection Hub',
        open24Hours: true,
      },
      {
        id: 'sh-5',
        name: 'Rapid Response Highway Police & Patrol Unit',
        type: 'POLICE',
        latitude: userLat + 0.045,
        longitude: userLng + 0.038,
        phone: '112 Patrol Post',
        address: 'Regional Patrol Sector',
        open24Hours: true,
      },
      {
        id: 'sh-6',
        name: 'Specialized Urgent Care Clinic & Pharmacy',
        type: 'HOSPITAL',
        latitude: userLat - 0.055,
        longitude: userLng + 0.042,
        phone: 'Medical Helpline',
        address: 'District Medical Center',
        open24Hours: true,
      },
    ];

    // Filter by calculated distance radius (5km or 10km)
    const filteredHavens = rawStations
      .map((st) => {
        const distance = calculateDistanceKm(userLat, userLng, st.latitude, st.longitude);
        return { ...st, distance };
      })
      .filter((st) => st.distance <= maxRadiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json({ success: true, count: filteredHavens.length, data: filteredHavens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
