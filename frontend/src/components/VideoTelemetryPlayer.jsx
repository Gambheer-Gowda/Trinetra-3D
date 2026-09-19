import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Camera,
  Activity,
  Gauge,
  Video as VideoIcon
} from 'lucide-react';

export default function VideoTelemetryPlayer({
  mission,
  pointCloudData,
  droneProgress,
  setDroneProgress,
  selectedKeyframe,
  setSelectedKeyframe
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(24);

  const videoUrl = mission?.videoMeta?.videoUrl;

  // Sync HTML5 video play/pause with state
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.warn("Video playback autoplay prevented:", err);
          setIsPlaying(true);
        });
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // HTML5 Video onTimeUpdate handler
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(current);
    setDuration(dur);
    
    const progress = Math.min(1.0, current / dur);
    setDroneProgress(progress);

    const trajectory = pointCloudData?.cameraTrajectory || [];
    if (trajectory.length > 0 && setSelectedKeyframe) {
      const idx = Math.min(trajectory.length - 1, Math.floor(progress * (trajectory.length - 1)));
      setSelectedKeyframe(idx);
    }
  };

  // Video loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 24);
      videoRef.current.playbackRate = playbackSpeed;
    }
  };

  // Handle manual seek bar
  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    setDroneProgress(val);

    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = val * videoRef.current.duration;
      setCurrentTime(videoRef.current.currentTime);
    } else {
      setCurrentTime(val * duration);
    }

    const trajectory = pointCloudData?.cameraTrajectory || [];
    if (setSelectedKeyframe && trajectory.length > 0) {
      const idx = Math.min(trajectory.length - 1, Math.floor(val * (trajectory.length - 1)));
      setSelectedKeyframe(idx);
    }
  };

  // Handle speed changes
  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Fallback synthetic loop if no real video element
  useEffect(() => {
    let interval;
    if (isPlaying && !videoUrl) {
      interval = setInterval(() => {
        setDroneProgress(prev => {
          if (prev >= 1.0) {
            setIsPlaying(false);
            return 0;
          }
          const next = Math.min(1.0, prev + 0.015 * playbackSpeed);
          setCurrentTime(next * 24.0);
          return next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, setDroneProgress, videoUrl]);

  // Synchronize keyframe selection with telemetry values
  const trajectory = pointCloudData?.cameraTrajectory || [];
  const activeIndex = trajectory.length > 0 ? Math.min(trajectory.length - 1, Math.floor(droneProgress * (trajectory.length - 1))) : 0;
  const currentKeyframe = trajectory[activeIndex] || {
    timestamp: currentTime.toFixed(2),
    position: { x: 0, y: 0, z: mission?.flightProfile?.targetAltitudeAGL || 45 },
    rotation: { yaw: 0, pitch: mission?.flightProfile?.cameraPitchDeg || -42, roll: 0 },
    laplacianBlurScore: 1040,
    dynamicObjectsMasked: 2
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/70 border border-white/[0.08] rounded-2xl overflow-hidden select-none font-sans">
      {/* Video Screen & HUD */}
      <div className="relative flex-1 bg-black/90 flex items-center justify-center overflow-hidden">
        {/* Real Video Element if videoUrl exists */}
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            playsInline
            muted={isMuted}
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          /* Synthetic Canvas Fallback */
          <div className="w-full h-full relative bg-gradient-to-b from-zinc-900 via-zinc-950 to-black flex items-center justify-center">
            <div className="text-center text-zinc-500 text-xs">
              <VideoIcon className="w-8 h-8 mx-auto mb-2 text-cyan-400 opacity-60" />
              <span>Simulated Tactical UAV Pass</span>
            </div>
          </div>
        )}

        {/* Real-time Tactical HUD Overlay on top of video */}
        <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
          {/* Top Video Header HUD: 21st.dev Glass Pill */}
          <div className="flex justify-between items-center text-[11px] text-zinc-200 tracking-wide bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span className="text-rose-400 font-semibold tracking-tight">
                {videoUrl ? (mission?.videoMeta?.filename || 'CUSTOM FOOTAGE') : 'LIVE UAV STREAM'}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 font-mono">{mission?.videoMeta?.resolution || '4K UHD'}</span>
            </div>
            <div className="text-zinc-400 font-mono text-[11px]">
              <span className="text-white font-semibold">{currentTime.toFixed(1)}s</span> / {duration.toFixed(1)}s
            </div>
          </div>

          {/* Center Tactical Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 border border-cyan-400/20 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-0.5 bg-cyan-400/50" />
              <div className="w-0.5 h-2.5 bg-cyan-400/50 absolute" />
            </div>
            <div className="w-32 h-px bg-cyan-500/10 absolute" />
            <div className="h-32 w-px bg-cyan-500/10 absolute" />
          </div>

          {/* AI Dynamic Object Masking Bounding Box */}
          <div className="relative flex-1 flex items-center justify-center">
            <div className="absolute top-1/4 left-1/4 border border-emerald-500/80 bg-emerald-500/10 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-mono text-emerald-300 shadow-md">
              <div className="font-semibold flex items-center gap-1">
                <span>VEHICLE [AI MASKED]</span>
                <span className="text-[8px] bg-emerald-950/80 px-1 rounded text-emerald-400">0.96</span>
              </div>
            </div>
          </div>

          {/* Bottom Telemetry Strip: 21st.dev Glass Pill Dock */}
          <div className="flex justify-between items-center text-[10px] text-zinc-300 bg-zinc-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
            <div className="flex items-center gap-3 font-mono">
              <div>ALT: <strong className="text-cyan-300 font-semibold">{currentKeyframe.position?.z?.toFixed(1) || 45.0}m</strong></div>
              <div className="text-zinc-600">|</div>
              <div>GSD: <strong className="text-emerald-300 font-semibold">{mission?.flightProfile?.groundSampleDistanceCm || 2.0}cm</strong></div>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <div>SPEED: <strong className="text-white font-semibold">{mission?.flightProfile?.speedMps || 14.0}m/s</strong></div>
              <div className="text-zinc-600">|</div>
              <div>PITCH: <strong className="text-amber-300 font-semibold">{currentKeyframe.rotation?.pitch?.toFixed(1) || -45.0}&deg;</strong></div>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <div>SHARP: <strong className="text-emerald-400 font-semibold">{currentKeyframe.laplacianBlurScore || 980}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrub Bar & Player Controls: 21st.dev Glass Controls */}
      <div className="bg-zinc-950/90 p-3 border-t border-white/[0.08] flex flex-col gap-2">
        {/* Timeline Slider with Keyframe Marks */}
        <div className="relative flex items-center">
          <input 
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={droneProgress}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-white"
          />
        </div>

        {/* Playback Button Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={togglePlay}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-white hover:bg-zinc-200 active:scale-95 text-zinc-950 font-bold transition shadow-sm cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button 
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = 0;
                setDroneProgress(0);
                setCurrentTime(0);
                setIsPlaying(false);
              }}
              className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] cursor-pointer transition"
              title="Rewind to Start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {videoUrl && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] cursor-pointer transition"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            )}

            <span className="text-[11px] font-mono text-zinc-400 ml-2">
              FRAME <strong className="text-white font-semibold">{activeIndex + 1}</strong> / {trajectory.length || 16}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[0.5, 1, 2].map(speed => (
              <button 
                key={speed}
                onClick={() => changeSpeed(speed)}
                className={`px-2 py-0.5 text-[11px] rounded-full font-mono transition cursor-pointer ${
                  playbackSpeed === speed 
                    ? 'bg-white text-zinc-950 font-semibold' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
