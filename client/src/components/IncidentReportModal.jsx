import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Send,
  X,
  AlertTriangle,
  CheckCircle2,
  Mic,
  Square,
  Play,
  Trash2,
  UploadCloud,
  FileAudio,
  WifiOff
} from 'lucide-react';
import { reverseGeocode } from '../utils/geocoding';
import {
  saveOfflineIncident,
  saveDraftReport,
  getDraftReport,
  clearDraftReport
} from '../utils/storage';

export default function IncidentReportModal({ isOpen, onClose, onReportSubmitted }) {
  const [type, setType] = useState('THEFT_ASSAULT');
  const [description, setDescription] = useState('');
  const [touristName, setTouristName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [offlineQueued, setOfflineQueued] = useState(false);

  // Audio Voice Recorder States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load any existing draft from localStorage
  useEffect(() => {
    if (isOpen) {
      const draft = getDraftReport();
      if (draft) {
        if (draft.type) setType(draft.type);
        if (draft.description) setDescription(draft.description);
        if (draft.touristName) setTouristName(draft.touristName);
        if (draft.contactNumber) setContactNumber(draft.contactNumber);
      }
    }
  }, [isOpen]);

  // Auto-save draft as user inputs text
  useEffect(() => {
    if (isOpen) {
      saveDraftReport({
        type,
        description,
        touristName,
        contactNumber,
      });
    }
  }, [type, description, touristName, contactNumber, isOpen]);

  // Handle Image File Selection & Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Start Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);

        // Convert to base64 for payload transport
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied or not available in this browser.');
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleRemoveAudio = () => {
    setAudioBlobUrl(null);
    setAudioBase64(null);
    setRecordingDuration(0);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let lat = 28.6139;
    let lng = 77.209;

    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch (err) {
      console.warn('Geolocation fallback used');
    }

    const address = await reverseGeocode(lat, lng);

    const payload = {
      type,
      urgency: type === 'THEFT_ASSAULT' || type === 'MEDICAL' ? 'HIGH' : 'MEDIUM',
      touristName: touristName.trim() || 'Anonymous Tourist',
      contactNumber: contactNumber.trim() || 'Not Provided',
      latitude: lat,
      longitude: lng,
      address,
      description: description.trim() || 'Detailed incident report submitted.',
      mediaUrls: imagePreview ? [imagePreview] : [],
      voiceNoteUrl: audioBase64 || null,
    };

    // Check if offline
    if (!navigator.onLine) {
      saveOfflineIncident(payload);
      clearDraftReport();
      setIsSubmitting(false);
      setOfflineQueued(true);
      if (onReportSubmitted) onReportSubmitted(payload);
      setTimeout(() => {
        setOfflineQueued(false);
        onClose();
      }, 2500);
      return;
    }

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        clearDraftReport();
        setIsSuccess(true);
        if (onReportSubmitted) onReportSubmitted(data.data);
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 1800);
      }
    } catch (err) {
      saveOfflineIncident(payload);
      clearDraftReport();
      setIsSubmitting(false);
      setOfflineQueued(true);
      if (onReportSubmitted) onReportSubmitted(payload);
      setTimeout(() => {
        setOfflineQueued(false);
        onClose();
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">File Incident Report</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center text-center space-y-2">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 animate-bounce" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Report Successfully Submitted!</h4>
            <p className="text-xs text-slate-500">Incident dispatched to active responders in your sector.</p>
          </div>
        ) : offlineQueued ? (
          <div className="py-8 flex flex-col items-center text-center space-y-2">
            <WifiOff className="w-14 h-14 text-amber-500 animate-pulse" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Saved to Offline Draft Queue</h4>
            <p className="text-xs text-slate-500">
              Network currently unavailable. Your report is saved locally and will automatically send as soon as your connection is restored.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Incident Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-medium"
              >
                <option value="THEFT_ASSAULT">Crime / Theft / Harassment</option>
                <option value="MEDICAL">Medical Emergency</option>
                <option value="LOST_PATH">Lost Path / Stranded Tourist</option>
                <option value="NATURAL_HAZARD">Natural Hazard / Weather Warning</option>
                <option value="GENERAL">General Safety Concern</option>
              </select>
            </div>

            {/* Tourist Name & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="Tourist Name"
                  value={touristName}
                  onChange={(e) => setTouristName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Message Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Description / Message</label>
                <span className="text-[9px] text-slate-400">Auto-drafted locally</span>
              </div>
              <textarea
                rows="3"
                placeholder="Describe your situation, suspect details, landmarks, or urgent needs..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 leading-relaxed"
                required
              />
            </div>

            {/* Media Upload: Photo Picker & Preview */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Attach Incident Photo</label>
              
              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-amber-500 rounded-lg p-4 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-950/50 transition-colors"
                >
                  <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Click to upload photo evidence</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, WebP supported</span>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 max-h-40 w-full bg-slate-950 flex items-center justify-center">
                  <img src={imagePreview} alt="Preview" className="object-contain h-40 w-full" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 shadow"
                    title="Remove Photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Voice Audio Note Recorder */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Voice Audio Note</label>
              
              {!audioBlobUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {isRecording ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                        <span className="font-mono font-bold text-red-600 text-xs">
                          Recording: {Math.floor(recordingDuration / 60)}:
                          {(recordingDuration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-[11px]"
                      >
                        <Square className="w-3 h-3" /> Stop & Save
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all w-full justify-center"
                    >
                      <Mic className="w-4 h-4 text-red-500" />
                      Record Voice Audio Note
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <FileAudio className="w-4 h-4 text-amber-500 shrink-0" />
                    <audio src={audioBlobUrl} controls className="h-7 w-full max-w-xs" />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveAudio}
                    className="p-1.5 rounded-md bg-slate-200 dark:bg-slate-800 hover:text-red-500 text-slate-500"
                    title="Delete Recording"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Transmitting...' : 'Submit Incident Report'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
