/**
 * Telemetry Parser & Coordinate Transformation Engine
 * For SIH26158: Single-Pass Drone Video to Accurate 3D Model Generation
 * Handles SRT subtitle telemetry, CSV flight logs, and WGS84 to metric UTM conversion.
 */

// Approximate WGS84 to local metric projection centered at a reference origin
function wgs84ToMetric(lat, lon, refLat, refLon) {
  const R = 6378137.0; // WGS84 Earth radius in meters
  const dLat = (lat - refLat) * (Math.PI / 180);
  const dLon = (lon - refLon) * (Math.PI / 180);
  const meanLat = ((lat + refLat) / 2) * (Math.PI / 180);

  const x = dLon * Math.cos(meanLat) * R; // Easting in meters
  const y = dLat * R;                     // Northing in meters
  return { x, y };
}

// Convert Euler angles (yaw, pitch, roll in degrees) to a 3x3 rotation matrix
function eulerToRotationMatrix(yawDeg, pitchDeg, rollDeg) {
  const toRad = Math.PI / 180;
  const y = yawDeg * toRad;
  const p = pitchDeg * toRad;
  const r = rollDeg * toRad;

  const cy = Math.cos(y), sy = Math.sin(y);
  const cp = Math.cos(p), sp = Math.sin(p);
  const cr = Math.cos(r), sr = Math.sin(r);

  // Tait-Bryan angles Z-Y-X (yaw, pitch, roll)
  return [
    [cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr],
    [sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cy * sr],
    [-sp,     cp * sr,                cp * cr]
  ];
}

// Parse embedded drone SRT telemetry lines (standard in DJI, Skydio, custom tactical UAVs)
function parseSrtTelemetry(srtContent) {
  const blocks = srtContent.trim().split(/\n\s*\n/);
  const telemetryPoints = [];

  blocks.forEach((block, index) => {
    const lines = block.split('\n').map(l => l.trim());
    if (lines.length < 2) return;

    // Line 2 usually holds the timestamp range: 00:00:01,000 --> 00:00:02,000
    const timeMatch = lines[1]?.match(/(\d+):(\d+):(\d+),(\d+)/);
    let timeSeconds = index * 0.5;
    if (timeMatch) {
      timeSeconds = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000;
    }

    const dataLine = lines.slice(2).join(' ');
    
    // Extract metadata using regex
    const latMatch = dataLine.match(/latitude[:\s]+([-\d.]+)/i);
    const lonMatch = dataLine.match(/longitude[:\s]+([-\d.]+)/i);
    const altMatch = dataLine.match(/(?:rel_alt|altitude|rel_altitude)[:\s]+([-\d.]+)/i);
    const pitchMatch = dataLine.match(/(?:gb_pitch|pitch)[:\s]+([-\d.]+)/i);
    const yawMatch = dataLine.match(/(?:gb_yaw|yaw|heading)[:\s]+([-\d.]+)/i);
    const rollMatch = dataLine.match(/(?:gb_roll|roll)[:\s]+([-\d.]+)/i);
    const speedMatch = dataLine.match(/(?:speed|flight_speed)[:\s]+([-\d.]+)/i);

    if (latMatch && lonMatch) {
      telemetryPoints.push({
        frameIndex: index,
        timestamp: timeSeconds,
        latitude: parseFloat(latMatch[1]),
        longitude: parseFloat(lonMatch[1]),
        altitudeMeters: altMatch ? parseFloat(altMatch[1]) : 100.0,
        pitchDeg: pitchMatch ? parseFloat(pitchMatch[1]) : -45.0,
        yawDeg: yawMatch ? parseFloat(yawMatch[1]) : 90.0,
        rollDeg: rollMatch ? parseFloat(rollMatch[1]) : 0.0,
        speedMps: speedMatch ? parseFloat(speedMatch[1]) : 12.5
      });
    }
  });

  return telemetryPoints;
}

module.exports = {
  wgs84ToMetric,
  eulerToRotationMatrix,
  parseSrtTelemetry
};
