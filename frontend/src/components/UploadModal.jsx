import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileVideo, 
  FileCode, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  Compass,
  ArrowRight
} from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [videoFile, setVideoFile] = useState(null);
  const [telemetryFile, setTelemetryFile] = useState(null);
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('Sector Flight Corridor Alpha');
  const [altitudeMeters, setAltitudeMeters] = useState(100);
  const [gimbalPitchDeg, setGimbalPitchDeg] = useState(-45);
  const [droneModel, setDroneModel] = useState('DJI Mavic 3 Enterprise (RTK)');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoInputRef = useRef(null);
  const telemetryInputRef = useRef(null);

  if (!isOpen) return null;

  const handleVideoSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
      }
    }
  };

  const handleTelemetrySelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setTelemetryFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    if (videoFile) formData.append('video', videoFile);
    if (telemetryFile) formData.append('telemetry', telemetryFile);
    formData.append('title', title || 'Tactical Recon Pass');
    formData.append('locationName', locationName);
    formData.append('altitudeMeters', altitudeMeters);
    formData.append('gimbalPitchDeg', gimbalPitchDeg);
    formData.append('droneModel', droneModel);

    try {
      setUploadProgress(60);
      const res = await fetch('https://trinetra-3d-7ai3.onrender.com/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setUploadProgress(100);

      if (data.success && data.mission) {
        setTimeout(() => {
          setIsUploading(false);
          onUploadSuccess(data.mission);
          onClose();
        }, 500);
      } else {
        alert("Upload completed with notes.");
        setIsUploading(false);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload footage. Check server connection.");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="bg-zinc-950/95 border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 p-1 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.25)]">
              <img src="/trinetra_emblem_dark.png" alt="Trinetra" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white tracking-tight">TRINETRA &middot; Upload UAV Footage</h3>
              <p className="text-[10px] text-zinc-400">Stream video & inertial metadata for 3D reconstruction</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.08] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* 1. Video Drop / Select Box */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5 flex items-center justify-between">
              <span>1. Drone Video File (MP4, MOV, MKV) *</span>
              {videoFile && <span className="text-emerald-400 font-mono text-[11px]">Selected: {videoFile.name}</span>}
            </label>
            <input 
              ref={videoInputRef}
              type="file" 
              accept="video/*,.mp4,.mov,.avi,.mkv" 
              onChange={handleVideoSelect}
              className="hidden"
            />
            <div 
              onClick={() => videoInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                videoFile 
                  ? 'border-cyan-500/50 bg-cyan-500/10' 
                  : 'border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <div className="p-2 rounded-full bg-white/[0.04] text-zinc-300">
                <FileVideo className={`w-6 h-6 ${videoFile ? 'text-cyan-400' : 'text-zinc-400'}`} />
              </div>
              <div className="text-xs text-zinc-200 font-medium">
                {videoFile ? videoFile.name : "Click to select or drop UAV video stream"}
              </div>
              <div className="text-[10px] text-zinc-500">
                Supports 4K / 1080p single-pass oblique flight videos
              </div>
            </div>
          </div>

          {/* 2. Telemetry File (SRT / CSV / KML) */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5 flex items-center justify-between">
              <span>2. Telemetry Subtitles / Log (.SRT, .CSV) [Optional]</span>
              {telemetryFile && <span className="text-emerald-400 font-mono text-[11px]">Selected: {telemetryFile.name}</span>}
            </label>
            <input 
              ref={telemetryInputRef}
              type="file" 
              accept=".srt,.csv,.kml,.txt" 
              onChange={handleTelemetrySelect}
              className="hidden"
            />
            <div 
              onClick={() => telemetryInputRef.current?.click()}
              className={`border border-white/10 rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-between px-4 ${
                telemetryFile 
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' 
                  : 'hover:border-white/20 bg-white/[0.02] text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <FileCode className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300">{telemetryFile ? telemetryFile.name : "Select subtitle (.SRT) or CSV telemetry log (or auto-synthesize)"}</span>
              </div>
              <span className="text-[10px] text-zinc-300 font-medium px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10">Browse</span>
            </div>
          </div>

          {/* 3. Metadata & Flight Parameters */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1 font-medium text-[11px]">Mission / Target Name</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Sector 9 Twin Towers Recon"
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-cyan-400/70 transition"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1 font-medium text-[11px]">Location Identifier</label>
              <input 
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-cyan-400/70 transition"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1 font-medium text-[11px]">UAV Camera Platform</label>
              <select 
                value={droneModel}
                onChange={(e) => setDroneModel(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-cyan-400/70 transition cursor-pointer"
              >
                <option value="DJI Mavic 3 Enterprise (RTK)">DJI Mavic 3 Enterprise (RTK)</option>
                <option value="Skydio X2 Color/Thermal Oblique">Skydio X2 Color/Thermal Oblique</option>
                <option value="Autel EVO II Pro 6K">Autel EVO II Pro 6K</option>
                <option value="NTRO Military Tactical UAV Gimbal">NTRO Tactical UAV Gimbal</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1 font-medium text-[11px]">Flight Altitude (AGL)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  value={altitudeMeters}
                  onChange={(e) => setAltitudeMeters(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-cyan-400/70 transition"
                />
                <span className="text-zinc-500 font-mono">m</span>
              </div>
            </div>
          </div>

          {/* Progress bar when uploading */}
          {isUploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Ingesting Video Stream & Running VIO Pipeline...</span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading || !videoFile}
              className={`px-5 py-2 text-xs font-semibold rounded-full flex items-center gap-1.5 transition cursor-pointer ${
                isUploading || !videoFile 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-white hover:bg-zinc-200 active:scale-95 text-zinc-950 shadow-md shadow-white/10'
              }`}
            >
              <span>{isUploading ? 'Processing...' : 'Upload & Reconstruct 3D'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
