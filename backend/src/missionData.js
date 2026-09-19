/**
 * Realistic Tactical UAV Mission Datasets for SIH26158 NTRO Challenge
 */

const missions = [
  {
    id: "uav_photogrammetry_twin",
    title: "Photogrammetric Digital Twin: Multi-Story Residential Complex",
    organization: "National Technical Research Organisation (NTRO)",
    classification: "HIGH-RESOLUTION 3D RECONSTRUCTION // SIH26158",
    date: "2026-09-19",
    description: "Single-pass forward oblique drone video photogrammetry reconstruction featuring full solid multi-story residential towers, vertical facades, windows, balconies, roadway with vehicles, perimeter tree canopy, and textured ground terrain matching aerial survey specifications.",
    locationName: "Metropolitan Sector Alpha Residential Zone",
    coordinates: {
      lat: 28.5355,
      lon: 77.3910,
      elevationMeters: 205.0
    },
    flightProfile: {
      type: "Single-Pass Linear Oblique",
      speedMps: 12.5,
      targetAltitudeAGL: 48.0,
      cameraPitchDeg: -45.0,
      totalPassDurationSec: 28,
      groundSampleDistanceCm: 1.5,
      overlapForwardPct: 80,
      reconstructionAccuracyRMSE: "1.8 cm",
      dynamicFilteringScore: "99.4% dynamic noise filtered"
    },
    tacticalAssets: [
      { id: "B1", name: "Main Residential Tower (Block A)", type: "Multi-Story Structure", x: -10.0, y: 12.0, z: 15.0, status: "Full 3D Solid / 10 Stories" },
      { id: "B2", name: "Residential Annex (Block B)", type: "Multi-Story Structure", x: -28.0, y: 16.0, z: 12.0, status: "Full 3D Solid / 8 Stories" },
      { id: "B3", name: "Vehicle Parking & Roadway", type: "Infrastructure", x: -32.0, y: -20.0, z: 1.2, status: "Surveyed / 8 Vehicles" },
      { id: "B4", name: "Perimeter Forest Belt", type: "Vegetation", x: 25.0, y: -20.0, z: 7.0, status: "Volumetric Tree Canopy" }
    ],
    videoMeta: {
      resolution: "3840x2160 4K UHD",
      fps: 30,
      durationSec: 24,
      sensor: "DJI Zenmuse P1 Full-Frame 45MP",
      focalLengthMm: 35
    }
  },
  {
    id: "ntro_sector_echo",
    title: "NTRO Sector-7 Echo: Forward Outpost Reconnaissance",
    organization: "National Technical Research Organisation (NTRO)",
    classification: "SECRET // TACTICAL RECON",
    date: "2026-09-18",
    description: "Single-pass forward oblique UAV scan at 45m AGL over a fortified border forward outpost featuring command bunker, watchtower, satellite communications dome, perimeter trenches, and vehicle motorpool.",
    locationName: "Northern Border Tactical Corridor",
    coordinates: {
      lat: 34.15243,
      lon: 77.57721,
      elevationMeters: 3410.5
    },
    flightProfile: {
      type: "Single-Pass Linear Oblique",
      speedMps: 15.2,
      targetAltitudeAGL: 45.0,
      cameraPitchDeg: -42.0,
      totalPassDurationSec: 28,
      groundSampleDistanceCm: 1.8,
      overlapForwardPct: 78,
      reconstructionAccuracyRMSE: "2.4 cm",
      dynamicFilteringScore: "98.7% dynamic noise rejected"
    },
    tacticalAssets: [
      { id: "T1", name: "Command Bunker & SatCom Radome", type: "High Value Asset", x: 12.5, y: 15.0, z: 6.2, status: "Intact / Active" },
      { id: "T2", name: "Observation Watchtower", type: "Vantage Point", x: -22.0, y: 35.0, z: 12.8, status: "Active Surveillance" },
      { id: "T3", name: "Helipad Landing Zone (LZ Echo)", type: "Aviation", x: 30.0, y: -15.0, z: 1.0, status: "Clear for Insertion" },
      { id: "T4", name: "Perimeter Fortified Trench", type: "Defense", x: -45.0, y: 10.0, z: -1.5, status: "Reinforced" }
    ],
    videoMeta: {
      resolution: "3840x2160 4K UHD",
      fps: 30,
      durationSec: 24,
      sensor: "Sony IMX586 1/2-inch CMOS",
      focalLengthMm: 24
    }
  },
  {
    id: "ndrf_flood_viaduct",
    title: "NDRF Disaster Rapid Triage: Flash Flood Viaduct Collapse",
    organization: "National Disaster Response Force (NDRF)",
    classification: "URGENT // DISASTER RESPONSE",
    date: "2026-09-15",
    description: "Single-pass rapid assessment of a river gorge crossing after cloudburst. Reconstructs sheared concrete piers, stranded civil transport, water velocity vectors, and debris buildup to determine structural stability and rescue bridgehead.",
    locationName: "Teesta River Crossing Sector-B",
    coordinates: {
      lat: 27.28421,
      lon: 88.51432,
      elevationMeters: 840.2
    },
    flightProfile: {
      type: "Single-Pass River Corridor Flight",
      speedMps: 12.0,
      targetAltitudeAGL: 55.0,
      cameraPitchDeg: -55.0,
      totalPassDurationSec: 32,
      groundSampleDistanceCm: 2.3,
      overlapForwardPct: 74,
      reconstructionAccuracyRMSE: "3.1 cm",
      dynamicFilteringScore: "99.2% rushing water & vehicle motion filtered"
    },
    tacticalAssets: [
      { id: "D1", name: "Collapsed Span Pier 4", type: "Failure Zone", x: 0.0, y: 22.0, z: -8.5, status: "Critical Failure - 42m Breach" },
      { id: "D2", name: "Stranded Fuel Tanker", type: "Hazard", x: -18.0, y: 5.0, z: 3.2, status: "Fuel Risk / 2 Occupants" },
      { id: "D3", name: "Emergency Winch Landing Area", type: "Safe Zone", x: 40.0, y: -20.0, z: 5.0, status: "Designated Triage Alpha" }
    ],
    videoMeta: {
      resolution: "3840x2160 4K UHD",
      fps: 30,
      durationSec: 28,
      sensor: "Zenmuse H20T Wide",
      focalLengthMm: 28
    }
  },
  {
    id: "urban_seismic_zone",
    title: "Urban Recon: High-Density Earthquake Block Damage Assessment",
    organization: "Disaster Management & Urban Tactical Command",
    classification: "OFFICIAL TACTICAL USE",
    date: "2026-09-10",
    description: "Single-pass aerial corridor scan above a dense 4-block municipal district experiencing high-magnitude seismic impact. Evaluates pancake collapses, facade tilts, blocked evacuation arteries, and rooftop rescue access.",
    locationName: "Sector 14 Urban Metro Center",
    coordinates: {
      lat: 28.61393,
      lon: 77.20902,
      elevationMeters: 216.0
    },
    flightProfile: {
      type: "Single-Pass Urban Boulevard Flyover",
      speedMps: 10.5,
      targetAltitudeAGL: 65.0,
      cameraPitchDeg: -50.0,
      totalPassDurationSec: 30,
      groundSampleDistanceCm: 2.1,
      overlapForwardPct: 82,
      reconstructionAccuracyRMSE: "2.8 cm",
      dynamicFilteringScore: "96.5% fleeing pedestrians/cars segmented"
    },
    tacticalAssets: [
      { id: "U1", name: "Commercial Tower (Leaning 6.2 deg)", type: "Structural Hazard", x: -15.0, y: 18.0, z: 24.0, status: "Imminent Collapse Threat" },
      { id: "U2", name: "Hospital Rooftop Heli-Pad", type: "Medical Evac", x: 25.0, y: 30.0, z: 18.0, status: "Structural Integrity Confirmed" },
      { id: "U3", name: "Rubble-Blocked Main Arterial Road", type: "Logistics Blockage", x: 5.0, y: -10.0, z: 2.0, status: "Requires Heavy Machinery" }
    ],
    videoMeta: {
      resolution: "3840x2160 4K UHD",
      fps: 30,
      durationSec: 26,
      sensor: "Phase One P3 Payload",
      focalLengthMm: 35
    }
  }
];

module.exports = {
  missions
};
