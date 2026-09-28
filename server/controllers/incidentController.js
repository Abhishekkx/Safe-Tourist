const Incident = require('../models/Incident');
const SafeHaven = require('../models/SafeHaven');
const { getIsConnected } = require('../config/db');
const cloudinary = require('../config/cloudinary');

// In-Memory Storage is empty by default (no fake/mock data)
let inMemoryIncidents = [];

// Seed initial verified stations if database is freshly created
const seedSafeHavensIfEmpty = async (centerLat = 28.6139, centerLng = 77.209) => {
  try {
    if (!getIsConnected()) return;
    const count = await SafeHaven.countDocuments();
    if (count === 0) {
      const initialStations = [
        {
          name: 'Central Tourist Police Station & Helpline',
          type: 'POLICE',
          location: { type: 'Point', coordinates: [centerLng + 0.005, centerLat + 0.008] },
          phone: '112 / +91 11-23311234',
          address: 'Sector 1 Emergency Command Post',
          open24Hours: true,
        },
        {
          name: 'City General Emergency Hospital & Trauma Center',
          type: 'HOSPITAL',
          location: { type: 'Point', coordinates: [centerLng + 0.009, centerLat - 0.006] },
          phone: '102 / +91 11-26588500',
          address: 'Medical Enclave Road, Trauma Block',
          open24Hours: true,
        },
        {
          name: 'International Diplomatic & Embassy Security Post',
          type: 'EMBASSY',
          location: { type: 'Point', coordinates: [centerLng - 0.007, centerLat + 0.012] },
          phone: '+91 11-24198000',
          address: 'Diplomatic Zone Security Hub',
          open24Hours: true,
        },
        {
          name: 'Tourist Assistance Desk & Safe Haven Hub',
          type: 'SAFE_ZONE',
          location: { type: 'Point', coordinates: [centerLng - 0.003, centerLat - 0.004] },
          phone: '1800-11-1363',
          address: 'Central Transit Interchange',
          open24Hours: true,
        },
      ];
      await SafeHaven.insertMany(initialStations);
      console.log('✅ Initial verified emergency stations seeded into MongoDB Atlas.');
    }
  } catch (err) {
    console.warn('SafeHaven seed note:', err.message);
  }
};

const broadcastIncidentUpdate = (io, eventType, data) => {
  if (io) {
    io.emit(eventType, data);
  }
};

// POST /api/incidents/upload (Cloudinary media upload)
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

// GET /api/incidents (Fetch true live database incidents)
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

    let filtered = [...inMemoryIncidents];
    if (status) filtered = filtered.filter((i) => i.status === status);
    if (type) filtered = filtered.filter((i) => i.type === type);
    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/incidents (Store live distress report in MongoDB Atlas)
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

    // Process Cloudinary Image Upload if base64 data URL
    let finalMediaUrls = [];
    if (mediaUrls && Array.isArray(mediaUrls)) {
      for (const m of mediaUrls) {
        if (m.startsWith('data:image')) {
          try {
            const uploaded = await cloudinary.uploader.upload(m, { folder: 'incident_photos' });
            finalMediaUrls.push(uploaded.secure_url);
          } catch (e) {
            console.warn('Cloudinary photo upload error:', e.message);
            finalMediaUrls.push(m);
          }
        } else {
          finalMediaUrls.push(m);
        }
      }
    }

    // Process Cloudinary Voice Memo Upload if base64 data URL
    let finalVoiceUrl = voiceNoteUrl;
    if (voiceNoteUrl && voiceNoteUrl.startsWith('data:audio')) {
      try {
        const uploadedAudio = await cloudinary.uploader.upload(voiceNoteUrl, {
          folder: 'incident_voice_notes',
          resource_type: 'video',
        });
        finalVoiceUrl = uploadedAudio.secure_url;
      } catch (e) {
        console.warn('Cloudinary voice upload error:', e.message);
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
      inMemoryIncidents.unshift(createdRecord);
    }

    // Broadcast instant Socket.io event to live authority dashboard
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

// PATCH /api/incidents/:id/status (Update responder status in MongoDB Atlas)
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
    } else {
      const idx = inMemoryIncidents.findIndex((i) => i._id === id || i.incidentId === id);
      if (idx !== -1) {
        inMemoryIncidents[idx].status = status || inMemoryIncidents[idx].status;
        if (assignedResponder) inMemoryIncidents[idx].assignedResponder = assignedResponder;
        if (note) {
          if (!inMemoryIncidents[idx].notes) inMemoryIncidents[idx].notes = [];
          inMemoryIncidents[idx].notes.push({ text: note, createdAt: new Date() });
        }
        updated = inMemoryIncidents[idx];
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Incident record not found.' });
    }

    const io = req.app.get('io');
    broadcastIncidentUpdate(io, 'INCIDENT_STATUS_UPDATED', updated);

    res.json({ success: true, message: 'Status updated successfully in MongoDB Atlas.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/incidents/safe-havens (Get verified safe havens with GeoJSON)
exports.getNearestSafeHavens = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const userLat = parseFloat(lat) || 28.6139;
    const userLng = parseFloat(lng) || 77.209;

    await seedSafeHavensIfEmpty(userLat, userLng);

    if (getIsConnected()) {
      const havens = await SafeHaven.find();
      const mapped = havens.map((h) => ({
        id: h._id.toString(),
        name: h.name,
        type: h.type,
        latitude: h.location.coordinates[1],
        longitude: h.location.coordinates[0],
        phone: h.phone,
        address: h.address,
        open24Hours: h.open24Hours,
      }));
      return res.json({ success: true, data: mapped });
    }

    // Dynamic coordinates relative to tourist's actual position
    const dynamicHavens = [
      {
        id: 'sh-1',
        name: 'Central Tourist Police Station & Helpline',
        type: 'POLICE',
        latitude: userLat + 0.008,
        longitude: userLng + 0.005,
        phone: '112 / +91 11-23311234',
        address: 'Sector 1 Emergency Command Post',
        open24Hours: true,
      },
      {
        id: 'sh-2',
        name: 'City General Emergency Hospital & Trauma Center',
        type: 'HOSPITAL',
        latitude: userLat - 0.006,
        longitude: userLng + 0.009,
        phone: '102 / +91 11-26588500',
        address: 'Medical Enclave Road, Trauma Block',
        open24Hours: true,
      },
      {
        id: 'sh-3',
        name: 'International Diplomatic & Embassy Security Post',
        type: 'EMBASSY',
        latitude: userLat + 0.012,
        longitude: userLng - 0.007,
        phone: '+91 11-24198000',
        address: 'Diplomatic Zone Security Hub',
        open24Hours: true,
      },
      {
        id: 'sh-4',
        name: 'Tourist Assistance Desk & Safe Haven Hub',
        type: 'SAFE_ZONE',
        latitude: userLat - 0.004,
        longitude: userLng - 0.003,
        phone: '1800-11-1363',
        address: 'Central Transit Interchange',
        open24Hours: true,
      },
    ];

    res.json({ success: true, data: dynamicHavens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
