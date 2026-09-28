# SafeTourist - Smart Emergency Response Platform 🛡️

**SafeTourist** is a full-stack, real-time emergency response platform designed to protect tourists in distress and empower local emergency authorities with a live operational command dashboard.

Built for hackathons and production deployments, the system features **one-tap SOS panic triggers**, **live continuous GPS tracking**, **browser voice note recording**, **photo evidence reporting**, **network resilience with offline auto-sync**, and **geofenced emergency warning broadcasts**.

---

## 🚀 Key Features & Architectural Highlights

### 📱 Tourist Emergency Portal (Client Side)
* **One-Tap SOS Trigger**: 3-second hold or quick tap panic button with a 5-second countdown to prevent accidental false triggers.
* **Automatic GPS Attachment**: Automatically captures browser GPS coordinates (`latitude`, `longitude`) and reverse-geocodes verified street addresses for every distress signal.
* **Instant Voice SOS Recording**: Integrated browser `MediaRecorder` API allowing tourists to record up to 15-second voice notes that compress and upload directly to Cloudinary.
* **Quick Distress Messaging**: 1-click text input bar for sending immediate status updates with auto-attached location data.
* **Detailed Incident Filing**: Category selection (Crime/Theft, Medical Emergency, Lost Path, Natural Hazard) with file upload for photo evidence.
* **Resilient Offline Mode & Auto-Sync**: Automatically drafts typed reports, messages, and voice memos to `LocalStorage` when internet connection drops. Once the connection is restored, queued reports automatically synchronize to MongoDB Atlas.
* **Silent SOS Mode**: Stealth mode for hostage, harassment, or high-risk situations with dark UI feedback.
* **Vertical Emergency Contacts Strip**: 1-click hotline dialer for national emergency numbers (112, 1363 Tourist Helpline, 102 Medical, 1091 Women Safety, 1070 Disaster Response).
* **Safe Haven Finder**: Interactive Leaflet map displaying nearest police stations, hospitals, and embassies with live Haversine distance calculations.

### 🛡️ Authority Responder Command Dashboard (Admin Side)
* **Secure Authentication**: Role-Based Access Control (RBAC) with responder login (`admin` / `admin123`).
* **Live Command Map**: Interactive dark/light Leaflet map featuring color-coded pulsing pins (Red = SOS Critical, Yellow = Dispatched, Green = Resolved) and dynamic map bounds auto-fitting.
* **Continuous GPS Path Tracking**: Listens for live moving GPS streams from active distress signals via WebSockets (`TOURIST_LOCATION_STREAM`).
* **Incoming Emergency Stream Panel**: Dedicated high-visibility alert feed for unhandled pending distress calls.
* **Incident Inspector Panel**: Detailed sidebar displaying tourist contact info, verified street address, attached photo evidence, and an embedded audio player for listening to recorded voice memos.
* **Geofenced Warning Broadcast**: Enables authorities to broadcast emergency warning popups with audio sirens directly to all connected tourist devices (`BROADCAST_SAFETY_ALERT`).
* **Web Audio Siren**: Synthesizes a two-tone emergency alarm using Web Audio API whenever an SOS arrives.

---

## 🛠️ Technology Stack (100% Free Tier Supported)

| Layer | Technology | Function |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Fast component rendering & mobile-responsive UI |
| **Styling** | Tailwind CSS + Lucide Icons | Modern layout, light/dark mode & SVG icon system |
| **Mapping** | Leaflet.js + React-Leaflet | Open-source interactive map without paid Google API fees |
| **Backend API** | Node.js + Express.js | Asynchronous API engine with 50MB payload limits |
| **Real-time WebSockets** | Socket.io | Bidirectional stream for live alerts and location tracking |
| **Database** | MongoDB Atlas | Cloud database with GeoJSON `2dsphere` spatial indexing |
| **Media CDN** | Cloudinary | CDN media pipeline for photo evidence & voice audio notes |

---

## 📋 System Prerequisites

Before running the application, ensure you have the following installed on your machine:

* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher
* **Web Browser**: Chrome, Edge, Firefox, or Safari (with Geolocation & Microphone permissions enabled)

---

## 🔑 Environment Variables Setup

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://arshiyasharma8658_db_user:7kLxXfnER2fNUrxF@cluster0.gh3pzft.mongodb.net/tourist_safety?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=super_secret_tourist_safety_jwt_key_2026
CLOUDINARY_CLOUD_NAME=krfpshl3
CLOUDINARY_API_KEY=373574267283178
CLOUDINARY_API_SECRET=AwbSe5GtzNKARq2Dvtsmj7iM5E4
```

---

## 💻 Quick Start & Running Guide

### 1. Install Dependencies

Open a terminal in the project root directory (`Safe-Tourist`) and run:

```bash
# Install root, server, and client dependencies
npm run install:all
```

### 2. Start Development Mode

Run the unified concurrent development command from the root directory:

```bash
npm run dev
```

* **Node Backend API**: `http://localhost:5000`
* **Vite React Frontend**: `http://localhost:5173`

---

## 🔐 Default Responder Credentials

To access the Responder Command Dashboard:

* **Username**: `admin`
* **Password**: `admin123`

---

## 🌐 Free Tier Deployment Guide

* **Frontend (Vercel)**: Deploy `client/` directory as a Vite project on [Vercel](https://vercel.com).
* **Backend (Render)**: Deploy `server/` directory as a Web Service on [Render](https://render.com).

---

## 📄 License

This project is open-source and available under the **MIT License**.
