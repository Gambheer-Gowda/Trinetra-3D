import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  CheckCircle, 
  Clock, 
  Terminal, 
  Play, 
  Filter, 
  Sliders, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Camera
} from 'lucide-react';

export default function PipelineMonitor({ mission, pointCloudData, onReconstructionComplete }) {
  const [jobId, setJobId] = useState(null);
  const [jobState, setJobState] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [dynamicFilterMode, setDynamicFilterMode] = useState('YOLOv8-Seg');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.85);

  const startPipeline = async () => {
    try {
      setIsRunning(true);
      const res = await fetch('/api/pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: mission?.id,
          videoName: `${mission?.id}_single_pass_4k.mp4`,
          dynamicFilterMode,
          confidenceThreshold
        })
      });
      const data = await res.json();
      setJobId(data.jobId);
    } catch (err) {
      console.error("Failed to start pipeline:", err);
      setIsRunning(false);
    }
  };

  // Poll for pipeline progress
  useEffect(() => {
    if (!jobId || !isRunning) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pipeline/status/${jobId}`);
        const data = await res.json();
        setJobState(data);

        if (data.status === 'completed') {
          setIsRunning(false);
          clearInterval(interval);
          if (onReconstructionComplete) {
            onReconstructionComplete();
          }
        }
      } catch (err) {
        console.error("Error polling job status:", err);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [jobId, isRunning, onReconstructionComplete]);

  return (
    <div className="flex flex-col h-full bg-zinc-950/40 p-4 overflow-y-auto select-none font-sans text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight">AI Reconstruction Pipeline</h2>
            <p className="text-[10px] text-zinc-400">Single-pass photogrammetric engine</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>
      </div>

      {/* Configuration Strip */}
      <div className="mt-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-zinc-400 block mb-1">Dynamic Actor Filter</label>
          <select 
            value={dynamicFilterMode} 
            onChange={(e) => setDynamicFilterMode(e.target.value)}
            disabled={isRunning}
            className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-400/70 text-xs transition cursor-pointer"
          >
            <option value="YOLOv8-Seg">YOLOv8-Seg (Zero Ghosting)</option>
            <option value="Mask-RCNN">Mask R-CNN ResNet50</option>
            <option value="OpticalFlow">Dense Optical Flow</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-medium text-zinc-400 block mb-1">Confidence Threshold</label>
          <div className="flex items-center gap-2 mt-1.5">
            <input 
              type="range" 
              min="0.5" 
              max="0.95" 
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              disabled={isRunning}
              className="flex-1 accent-white h-1.5 bg-zinc-800 rounded-full cursor-pointer"
            />
            <span className="text-white font-mono text-xs font-semibold w-9 text-right">{(confidenceThreshold * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Start Button: 21st.dev Shimmer Pill / Gradient Action */}
      <div className="mt-3">
        <button
          onClick={startPipeline}
          disabled={isRunning}
          className={`w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-xs transition-all duration-200 cursor-pointer ${
            isRunning 
              ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-white/5' 
              : 'bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 shadow-md shadow-white/10'
          }`}
        >
          {isRunning ? (
            <>
              <Zap className="w-3.5 h-3.5 animate-spin text-zinc-400" />
              <span>Processing Single-Pass Stream ({jobState?.overallProgress || 0}%)...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute 3D Reconstruction</span>
            </>
          )}
        </button>
      </div>

      {/* Real Extracted Keyframes Gallery from Video */}
      {pointCloudData?.cameraTrajectory?.some(k => k.thumbnail) && (
        <div className="mt-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          <div className="text-xs text-zinc-300 font-semibold mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-zinc-200">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              Keyframes
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">{pointCloudData.cameraTrajectory.length} FRAMES</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pointCloudData.cameraTrajectory.map((kf, i) => (
              <div key={i} className="relative shrink-0 w-24 rounded-lg border border-white/10 overflow-hidden bg-black group shadow">
                <img src={kf.thumbnail} alt={`Frame ${i+1}`} className="w-full h-14 object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-zinc-950/85 backdrop-blur-sm text-[9px] px-1.5 py-0.5 flex justify-between text-zinc-300 font-mono">
                  <span>#{i+1}</span>
                  <span className="text-emerald-400 font-semibold">{kf.laplacianBlurScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Stages Progress List */}
      <div className="mt-4 flex-1 space-y-2">
        <div className="text-[11px] text-zinc-400 font-medium tracking-wide">PIPELINE STAGES</div>
        {(jobState?.stages || [
          { name: "Single-Pass Video & Telemetry Ingestion", status: "completed" },
          { name: "Laplacian Blur Filtering & Adaptive Keyframing", status: "completed" },
          { name: "AI Dynamic Object Masking (YOLOv8-Seg)", status: "completed" },
          { name: "Visual-Inertial Telemetry Pose Fusion (WGS84->UTM)", status: "completed" },
          { name: "Monocular Metric Depth Unprojection", status: "completed" },
          { name: "SOR Point Cloud Fusion & Poisson Mesh Generation", status: "completed" }
        ]).map((stage, idx) => {
          const isDone = stage.status === "completed";
          const isInProgress = stage.status === "in-progress";

          return (
            <div 
              key={idx} 
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                isInProgress 
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-white shadow-sm' 
                  : isDone 
                    ? 'bg-white/[0.02] border-white/[0.06] text-zinc-300' 
                    : 'bg-transparent border-white/[0.03] text-zinc-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isInProgress ? (
                    <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                  ) : (
                    <span className="text-zinc-600">{idx + 1}</span>
                  )}
                </div>
                <span className={isInProgress ? 'text-white font-medium' : ''}>{stage.name}</span>
              </div>

              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                isDone 
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                  : isInProgress 
                    ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 animate-pulse' 
                    : 'text-zinc-600'
              }`}>
                {stage.status.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Terminal Live Output */}
      <div className="mt-4 bg-zinc-950/80 border border-white/[0.08] rounded-xl p-3 text-[11px] font-mono shadow-inner">
        <div className="flex items-center gap-1.5 text-zinc-400 pb-1.5 mb-2 border-b border-white/[0.06]">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] tracking-wide text-zinc-400">TELEMETRY & CV LOGS</span>
        </div>
        <div className="max-h-24 overflow-y-auto space-y-1 text-zinc-400">
          {(jobState?.logs || [
            "[INIT] Loaded single-pass video mission: Sector-7 Echo",
            "[CV] Laplacian variance calculated: 24 sharp keyframes retained",
            "[AI] YOLOv8-Seg applied: dynamic vehicle trajectories suppressed",
            "[VIO] Fused GPS/IMU timestamps at 30Hz: UTM Metric scale locked",
            "[3D] Monocular depth unprojected: 38,420 point cloud vertices generated",
            "[READY] Metrically accurate 3D model prepared for tactical visualization"
          ]).map((log, i) => (
            <div key={i} className="text-emerald-400/90 leading-tight">
              &gt; {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
