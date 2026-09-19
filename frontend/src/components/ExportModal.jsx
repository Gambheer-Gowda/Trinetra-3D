import React from 'react';
import { Download, X, FileText, Box, Database, Map } from 'lucide-react';

export default function ExportModal({ isOpen, onClose, mission }) {
  if (!isOpen || !mission) return null;

  const downloadFile = (format) => {
    window.open(`/api/export/${mission.id}/${format}`, '_blank');
  };

  const formats = [
    {
      id: 'ply',
      name: 'Stanford Point Cloud (.PLY)',
      desc: 'RGB-colored dense 3D point cloud with vertex normals. Standard for CloudCompare, MeshLab, and 3D Gaussian Splatting.',
      icon: Box,
      color: 'text-cyan-400'
    },
    {
      id: 'obj',
      name: 'Wavefront 3D Mesh (.OBJ)',
      desc: 'Triangulated 3D mesh surface compatible with Autodesk, Blender, Unity, and Unreal Engine.',
      icon: Box,
      color: 'text-amber-400'
    },
    {
      id: 'xyz',
      name: 'LiDAR / ASCII Coordinates (.XYZ)',
      desc: 'Raw X, Y, Z, Intensity metric coordinates ready for GIS & civil engineering software.',
      icon: Database,
      color: 'text-emerald-400'
    },
    {
      id: 'dem',
      name: 'Digital Elevation Model Metadata (.JSON)',
      desc: 'WGS84 / UTM georeferencing, Ground Sample Distance, vertical RMSE, and elevation bounds.',
      icon: Map,
      color: 'text-indigo-400'
    }
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="bg-zinc-950/95 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white tracking-tight">Export 3D Reconstructed Data</h3>
              <p className="text-[10px] text-zinc-400">Georeferenced point clouds & elevation rasters</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.08] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-zinc-400">
            Export georeferenced metric 3D point clouds and elevation rasters generated from the single-pass UAV flight:
          </p>

          <div className="space-y-2">
            {formats.map(fmt => {
              const Icon = fmt.icon;
              return (
                <div 
                  key={fmt.id}
                  onClick={() => downloadFile(fmt.id)}
                  className="p-3 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/15 rounded-xl cursor-pointer transition-all duration-150 flex items-center justify-between group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 group-hover:border-white/10 transition">
                      <Icon className={`w-4 h-4 ${fmt.color}`} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition">
                        {fmt.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 max-w-xs leading-relaxed">
                        {fmt.desc}
                      </div>
                    </div>
                  </div>

                  <Download className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition ml-2 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-zinc-900/30 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-zinc-300 hover:text-white rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
