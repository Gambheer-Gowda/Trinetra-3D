# Trinetra-3D: Single-Pass Drone Video to Accurate 3D Model Generation System
### Smart India Hackathon (SIH 2026) | Problem Statement ID: SIH26158
**Organization:** National Technical Research Organisation (NTRO), Government of India  
**Theme:** Robotics and Drones  
**Category:** Software  

---

## 1. Executive Summary & Problem Context
In traditional photogrammetric 3D reconstruction (e.g. Structure-from-Motion / SfM), unmanned aerial vehicles (UAVs) must fly exhaustive multi-grid or circular crosshatch patterns with 80%+ frontal and 70%+ side overlap. These flights take 45–90 minutes and require hours of offline computation.

However, in **critical national defense operations, forward tactical reconnaissance, rapid disaster triage (earthquakes, flash floods), and urgent surveillance**, drones only get **one single flight pass** over high-threat or dynamic areas. 

**SIH26158 Challenges Addressed:**
1. **Geometric Degeneracy & Baseline Collapse:** Forward-moving cameras have an optical focus-of-expansion where traditional epipolar geometry fails to establish depth scale.
2. **Severe Occlusions & Missing Angles:** Single-pass trajectories have limited viewing angles.
3. **Motion Blur & Rolling Shutter Noise:** UAV vibration and high forward flight velocity cause motion blur.
4. **Dynamic Object Ghosting:** Moving vehicles and personnel produce smeared phantom points in 3D space.
5. **Zero-GCP Metric Scaling:** Delivering millimeter/centimeter metric accuracy without physical ground control markers.

---

## 2. System Architecture & Pipeline Breakdown

```
[ UAV 4K Video Stream + SRT / KML Telemetry ]
                     ¦
                     ?
  +--------------------------------------------------------+
  ¦ 1. Laplacian Blur Filter & Adaptive Keyframe Extractor ¦
  ¦    (Rejects blurred frames, retains sharp keyframes)   ¦
  +--------------------------------------------------------+
                           ¦
                           ?
  +--------------------------------------------------------+
  ¦ 2. AI Dynamic Object Segmentation (YOLOv8-Seg)         ¦
  ¦    (Masks vehicles, moving humans to prevent ghosting) ¦
  +--------------------------------------------------------+
                           ¦
                           ?
  +--------------------------------------------------------+
  ¦ 3. Visual-Inertial Telemetry Extrinsics Fusion         ¦
  ¦    (GPS WGS84 -> UTM Metric Coordinate System)         ¦
  +--------------------------------------------------------+
                           ¦
                           ?
  +--------------------------------------------------------+
  ¦ 4. Monocular Metric Depth Estimation (Foundation Prior)¦
  ¦    (Dense depth unprojection into metric 3D points)    ¦
  +--------------------------------------------------------+
                           ¦
                           ?
  +--------------------------------------------------------+
  ¦ 5. Statistical Outlier Removal (SOR) & Mesh Gen        ¦
  ¦    (Rejects atmospheric noise, Poisson triangulation)  ¦
  +--------------------------------------------------------+
                           ¦
                           ?
  +--------------------------------------------------------+
  ¦ 6. Interactive Geospatial Intelligence Web Platform    ¦
  ¦    - WebGL 3D Point Cloud Viewport (Three.js)          ¦
  ¦    - 3D Euclidean Distance, Height & Volume Ruler      ¦
  ¦    - Synchronized Drone Video & HUD Artificial Horizon ¦
  ¦    - Tactical 2D GIS Map (Leaflet) with Footprint      ¦
  ¦    - Standard Exporters (PLY, OBJ, XYZ, DEM JSON)      ¦
  +--------------------------------------------------------+
```

---

## 3. Key Capabilities & Features

### 3D Interactive Viewport
- **High-Performance WebGL Point Cloud Rendering:** Smooth 60 FPS rendering with dynamic point size adjustment.
- **Elevation Hypsometric Colormaps:** Switch between Natural RGB, Digital Elevation Model (DEM) color ramps, Contour bands, and Depth intensity.
- **Flight Path & Camera Frustums:** Visualizes the actual 3D camera pyramids along the UAV trajectory to inspect optical coverage and pitch angles.
- **3D Metric Measurement Tool:** Click any two points on the 3D surface to compute true 3D Euclidean distance (meters), horizontal clearance ($\Delta XY$), and vertical structure height ($\Delta Z$).

### Synchronized Tactical Video Player & Telemetry HUD
- Primary Flight Display (PFD) HUD with real-time artificial horizon (pitch ladder, roll angle).
- Real-time readout of altitude (AGL meters), ground speed (m/s), compass heading, and camera gimbal angle.
- Video timeline scrubbing synchronized with 3D camera frustums and drone map position.

### 2D Tactical GIS Map
- High-resolution dark satellite GIS map with flight trajectory polyline, current UAV marker, sensor footprint polygon, and identified tactical assets.

### Defense-Grade Export Suite
- **.PLY**: Stanford Polygon file with RGB and vertex normals (CloudCompare / MeshLab).
- **.OBJ**: Wavefront 3D mesh surface (Blender / Unreal Engine).
- **.XYZ**: LiDAR ASCII point cloud for civil survey CAD.
- **.DEM**: Digital Elevation Model metadata.

---

## 4. Running the Platform

### Backend Service (Port 5000)
```bash
cd backend
npm install
node src/server.js
```

### Frontend Tactical Dashboard (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:3000** in your browser.
