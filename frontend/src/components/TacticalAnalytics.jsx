import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Target, 
  AlertTriangle, 
  Eye, 
  BarChart3, 
  Layers, 
  Activity,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function TacticalAnalytics({ mission, pointCloudData }) {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [losAnalysisActive, setLosAnalysisActive] = useState(false);

  const assets = mission?.tacticalAssets || [];
  const profile = mission?.flightProfile || {};

  return (
    <div className="flex flex-col h-full bg-zinc-950/40 p-4 overflow-y-auto select-none font-sans text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight">Geospatial Intelligence</h2>
            <p className="text-[10px] text-zinc-400">Automated photogrammetric analytics</p>
          </div>
        </div>
        <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
          NTRO Recon
        </span>
      </div>

      {/* Accuracy & Photogrammetry Benchmark */}
      <div className="mt-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-2">
        <div className="text-xs font-semibold text-white flex items-center justify-between">
          <span>Single-Pass Accuracy Matrix</span>
          <span className="text-emerald-400 font-mono text-[11px]">RMSE: {profile.reconstructionAccuracyRMSE || '2.4 cm'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
          <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-white/5">
            <span className="text-zinc-500 block text-[10px] font-medium">GROUND SAMPLE DISTANCE</span>
            <strong className="text-white text-xs font-mono">{profile.groundSampleDistanceCm} cm / px</strong>
          </div>
          <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-white/5">
            <span className="text-zinc-500 block text-[10px] font-medium">FORWARD OVERLAP</span>
            <strong className="text-white text-xs font-mono">{profile.overlapForwardPct}% Single Pass</strong>
          </div>
        </div>
        <div className="text-[10px] text-emerald-400/90 flex items-center gap-1.5 pt-1">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Zero GCP dependency • Scaled via VIO Altimeter fusion</span>
        </div>
      </div>

      {/* Identified Tactical Assets & Hazard Zones */}
      <div className="mt-4 flex-1 space-y-2">
        <div className="text-[11px] text-zinc-400 font-medium tracking-wide flex items-center justify-between">
          <span>IDENTIFIED STRUCTURES & ASSETS</span>
          <span className="text-zinc-300 font-mono text-[10px]">{assets.length} Detected</span>
        </div>

        <div className="space-y-2">
          {assets.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => setSelectedAsset(item)}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 text-xs ${
                selectedAsset?.id === item.id 
                  ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-sm' 
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                    {item.id}
                  </span>
                  <strong className="text-white font-medium">{item.name}</strong>
                </div>
                <span className="text-[10px] text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-full">{item.type}</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/[0.06] font-mono">
                <span>Rel Pos: ({item.x}m, {item.y}m, {item.z}m)</span>
                <span className="text-emerald-400 font-medium">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tactical Line-of-Sight & Volumetrics */}
      <div className="mt-4 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-zinc-200 font-semibold flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-cyan-400" />
            Tactical Line-of-Sight (LOS)
          </span>
          <button 
            onClick={() => setLosAnalysisActive(!losAnalysisActive)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition cursor-pointer ${
              losAnalysisActive 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' 
                : 'text-zinc-400 bg-white/[0.04] hover:text-white border border-white/10'
            }`}
          >
            {losAnalysisActive ? 'Active (Raycasted)' : 'Enable LOS'}
          </button>
        </div>

        <div className="text-[11px] text-zinc-400 leading-relaxed">
          Raycasted occlusion volume estimation and vantage point analysis from elevated twin-tower structures.
        </div>
      </div>
    </div>
  );
}
