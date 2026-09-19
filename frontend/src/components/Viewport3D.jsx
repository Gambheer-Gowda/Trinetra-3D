import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createPhotogrammetricTextures, buildPhotogrammetricScene } from '../utils/photogrammetricModelBuilder.js';
import { 
  RotateCcw, 
  Ruler, 
  Box, 
  Crosshair, 
  Sliders, 
  Cuboid,
  Focus,
  X,
  Target,
  Sparkles,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  Eye
} from 'lucide-react';

export default function Viewport3D({ 
  mission,
  pointCloudData, 
  selectedKeyframe, 
  onSelectKeyframe,
  droneProgress,
  activeAsset
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  
  const pointsRef = useRef(null);
  const solidMeshRef = useRef(null);
  const objectsGroupRef = useRef(null);
  const frustumGroupRef = useRef(null);
  const droneMeshRef = useRef(null);
  const measurementLineRef = useRef(null);
  const selectionBoxRef = useRef(null);
  const texturesRef = useRef(null);
  
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const [displayType, setDisplayType] = useState('solid'); // 'solid', 'wireframe', 'points', 'hybrid'
  const [renderMode, setRenderMode] = useState('rgb');
  const [pointSize, setPointSize] = useState(2.2);
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measurementResult, setMeasurementResult] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [showFlightPath, setShowFlightPath] = useState(true);
  const [showBoundingBox, setShowBoundingBox] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [viewPreset, setViewPreset] = useState('perspective');
  const [autoRotate, setAutoRotate] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06090e);
    scene.fog = new THREE.FogExp2(0x06090e, 0.0025);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, -95, 75);
    camera.up.set(0, 0, 1);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 4, 25);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    // UNRESTRICTED FULL TOP-TO-BOTTOM ROTATION (0 to 180 degrees)
    controls.minPolarAngle = 0.001; // Can orbit to direct top zenith
    controls.maxPolarAngle = Math.PI - 0.001; // Can orbit all the way underneath to direct bottom nadir
    controlsRef.current = controls;

    // Omnidirectional Lighting for complete 3D Top-to-Bottom visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Top Sun Light
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.3);
    sunLight.position.set(50, -60, 90);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Bottom Fill Light (Illuminates bottom surfaces when viewing from underneath!)
    const bottomLight = new THREE.DirectionalLight(0x60a5fa, 0.85);
    bottomLight.position.set(-30, 40, -90);
    scene.add(bottomLight);

    const hemiLight = new THREE.HemisphereLight(0x00f0ff, 0x1e293b, 0.45);
    scene.add(hemiLight);

    // Tactical Floating Grid
    const gridHelper = new THREE.GridHelper(160, 32, 0x00f0ff, 0x1e293b);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -0.1;
    gridHelper.name = 'tactical_grid';
    scene.add(gridHelper);

    const frustumGroup = new THREE.Group();
    scene.add(frustumGroup);
    frustumGroupRef.current = frustumGroup;

    const objectsGroup = new THREE.Group();
    scene.add(objectsGroup);
    objectsGroupRef.current = objectsGroup;

    const droneGroup = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(0.8, 1.2, 0.5, 6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2 });
    const droneBody = new THREE.Mesh(bodyGeo, bodyMat);
    droneBody.rotation.x = Math.PI / 2;
    droneGroup.add(droneBody);

    const beaconGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    droneGroup.add(beacon);
    droneGroup.visible = false;
    scene.add(droneGroup);
    droneMeshRef.current = droneGroup;

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update auto-rotate on controls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.2;
    }
  }, [autoRotate]);

  // Construct Both Solid 3D Surface Mesh AND Dense Point Cloud
  useEffect(() => {
    if (!sceneRef.current || !pointCloudData?.points) return;
    const scene = sceneRef.current;

    if (pointsRef.current) {
      scene.remove(pointsRef.current);
      pointsRef.current.geometry.dispose();
      pointsRef.current.material.dispose();
      pointsRef.current = null;
    }
    if (solidMeshRef.current) {
      scene.remove(solidMeshRef.current);
      solidMeshRef.current.geometry.dispose();
      solidMeshRef.current.material.dispose();
      solidMeshRef.current = null;
    }

    const pts = pointCloudData.points;
    const count = pts.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < count; i++) {
      if (pts[i].z < minZ) minZ = pts[i].z;
      if (pts[i].z > maxZ) maxZ = pts[i].z;
    }
    const zSpan = Math.max(1.0, maxZ - minZ);

    for (let i = 0; i < count; i++) {
      const p = pts[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      if (renderMode === 'rgb') {
        colors[i * 3] = p.r;
        colors[i * 3 + 1] = p.g;
        colors[i * 3 + 2] = p.b;
      } else {
        const normZ = (p.z - minZ) / zSpan;
        const col = getHypsometricColor(normZ);
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }
    }

    // 1. Point Cloud
    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointMaterial = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95
    });

    const pointCloud = new THREE.Points(pointGeometry, pointMaterial);
    pointCloud.visible = displayType === 'points' || displayType === 'hybrid';
    scene.add(pointCloud);
    pointsRef.current = pointCloud;

    const b = pointCloudData.bounds;
    const oldBox = scene.getObjectByName('bbox_helper');
    if (oldBox) scene.remove(oldBox);

    if (showBoundingBox && b) {
      const boxGeo = new THREE.BoxGeometry(
        b.max.x - b.min.x,
        b.max.y - b.min.y,
        b.max.z - b.min.z
      );
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true,
        transparent: true,
        opacity: 0.25
      });
      const boxMesh = new THREE.Mesh(boxGeo, wireMat);
      boxMesh.position.set(
        (b.max.x + b.min.x) / 2,
        (b.max.y + b.min.y) / 2,
        (b.max.z + b.min.z) / 2
      );
      boxMesh.name = 'bbox_helper';
      scene.add(boxMesh);
    }
  }, [pointCloudData, renderMode, displayType, showBoundingBox, pointSize]);

  // Full Closed 3D Solid Objects with Base Foundations (Visible from Top and Bottom)
  useEffect(() => {
    if (!objectsGroupRef.current) return;
    const group = objectsGroupRef.current;

    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    const missionId = mission?.id || 'ntro_sector_echo';

    if (missionId.includes('flood') || missionId.includes('viaduct')) {
      // 1. Viaduct Bridge Pillars (Extending deep into bedrock from top to bottom)
      const pier1Geo = new THREE.BoxGeometry(6, 6, 24);
      const pierMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8, side: THREE.DoubleSide });
      const pier1 = new THREE.Mesh(pier1Geo, pierMat);
      pier1.position.set(0, -30, -3);
      group.add(pier1);

      const pier2Geo = new THREE.BoxGeometry(6, 6, 24);
      const pier2 = new THREE.Mesh(pier2Geo, pierMat);
      pier2.position.set(0, 30, -3);
      group.add(pier2);

      // 2. Viaduct Deck (Complete solid top-to-bottom slab)
      const deckGeo = new THREE.BoxGeometry(8, 38, 3.2);
      const deckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, side: THREE.DoubleSide });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      deck.position.set(0, -35, 8.5);
      deck.userData = {
        id: 'D1',
        name: 'Intact North Bridgehead Span',
        type: 'Structural Viaduct',
        dimensions: { length: 38.0, width: 8.0, height: 3.2 },
        volumeM3: 972.8,
        footprintM2: 304.0,
        status: 'Solid 3D Span / Underside Inspected'
      };
      group.add(deck);

      // Water Plane
      const waterGeo = new THREE.PlaneGeometry(120, 150);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide
      });
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.position.set(0, 0, -7.2);
      group.add(water);

    } else if (missionId.includes('urban') || missionId.includes('seismic')) {
      // Solid Multi-Story Buildings (Full 3D volume from foundation base to roof)
      const bldg1Geo = new THREE.BoxGeometry(22, 24, 26);
      const bldgMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6, metalness: 0.2, side: THREE.DoubleSide });
      const bldg1 = new THREE.Mesh(bldg1Geo, bldgMat);
      bldg1.position.set(-25, 20, 10);
      bldg1.rotation.z = 0.08;
      bldg1.castShadow = true;
      bldg1.userData = {
        id: 'U1',
        name: 'Commercial Complex Tower (Tilted)',
        type: 'Severe Hazard Structure',
        dimensions: { length: 24.0, width: 22.0, height: 26.0 },
        volumeM3: 13728.0,
        footprintM2: 528.0,
        status: 'Full 3D Solid Structural Mesh'
      };
      group.add(bldg1);

      const bldg2Geo = new THREE.BoxGeometry(30, 32, 20);
      const bldg2Mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7, side: THREE.DoubleSide });
      const bldg2 = new THREE.Mesh(bldg2Geo, bldg2Mat);
      bldg2.position.set(20, 12, 7.5);
      bldg2.castShadow = true;
      bldg2.userData = {
        id: 'U2',
        name: 'District Medical Emergency Center',
        type: 'Priority Civil Structure',
        dimensions: { length: 32.0, width: 30.0, height: 20.0 },
        volumeM3: 19200.0,
        footprintM2: 960.0,
        status: 'Solid Top-to-Bottom Multi-Level'
      };
      group.add(bldg2);

    } else {
      // High-Resolution Photogrammetric 3D Digital Twin (Multi-Story Residential Complex matching user's drone reference)
      if (!texturesRef.current) {
        texturesRef.current = createPhotogrammetricTextures();
      }
      buildPhotogrammetricScene(group, texturesRef.current);
    }

    // Apply display type (solid vs wireframe vs points)
    group.traverse(child => {
      if (child.isMesh && child.material) {
        child.material.wireframe = (displayType === 'wireframe');
      }
    });
    group.visible = displayType !== 'points';
  }, [mission, displayType]);

  // Update Flight Path & Camera Frustums
  useEffect(() => {
    if (!frustumGroupRef.current || !pointCloudData?.cameraTrajectory) return;
    const group = frustumGroupRef.current;
    
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    if (!showFlightPath) return;

    const traj = pointCloudData.cameraTrajectory;
    const pathPoints = [];

    traj.forEach((kf, idx) => {
      const pos = new THREE.Vector3(kf.position.x, kf.position.y, kf.position.z);
      pathPoints.push(pos);

      const isSelected = selectedKeyframe === idx;
      const fovRad = (kf.fov || 70) * (Math.PI / 180);
      const aspect = 16 / 9;
      const frustumDepth = isSelected ? 12.0 : 6.5;

      const halfH = frustumDepth * Math.tan(fovRad / 2);
      const halfW = halfH * aspect;

      const frustumGeo = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0, 0, 0,  -halfW, frustumDepth, -halfH,
        0, 0, 0,   halfW, frustumDepth, -halfH,
        0, 0, 0,   halfW, frustumDepth,  halfH,
        0, 0, 0,  -halfW, frustumDepth,  halfH,
        -halfW, frustumDepth, -halfH,   halfW, frustumDepth, -halfH,
         halfW, frustumDepth, -halfH,   halfW, frustumDepth,  halfH,
         halfW, frustumDepth,  halfH,  -halfW, frustumDepth,  halfH,
        -halfW, frustumDepth,  halfH,  -halfW, frustumDepth, -halfH
      ]);
      frustumGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

      const frustumMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0x00f0ff : 0x475569,
        linewidth: isSelected ? 2 : 1,
        transparent: true,
        opacity: isSelected ? 1.0 : 0.45
      });

      const frustumLine = new THREE.LineSegments(frustumGeo, frustumMat);
      frustumLine.position.copy(pos);
      frustumLine.rotation.z = (kf.rotation.yaw || 0) * (Math.PI / 180);
      frustumLine.rotation.x = ((kf.rotation.pitch || -42) + 90) * (Math.PI / 180);

      group.add(frustumLine);
    });

    if (pathPoints.length > 1) {
      const curve = new THREE.CatmullRomCurve3(pathPoints);
      const curvePoints = curve.getPoints(100);
      const splineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const splineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
      const splineLine = new THREE.Line(splineGeo, splineMat);
      group.add(splineLine);
    }
  }, [pointCloudData, selectedKeyframe, showFlightPath]);

  // Update UAV position on scrub
  useEffect(() => {
    if (!droneMeshRef.current || !pointCloudData?.cameraTrajectory) return;
    const traj = pointCloudData.cameraTrajectory;
    if (traj.length === 0) return;

    const progress = droneProgress !== undefined ? droneProgress : 0;
    const idxFloat = progress * (traj.length - 1);
    const idx0 = Math.floor(idxFloat);
    const idx1 = Math.min(traj.length - 1, idx0 + 1);
    const frac = idxFloat - idx0;

    const p0 = traj[idx0].position;
    const p1 = traj[idx1].position;

    const currentX = p0.x + (p1.x - p0.x) * frac;
    const currentY = p0.y + (p1.y - p0.y) * frac;
    const currentZ = p0.z + (p1.z - p0.z) * frac;

    droneMeshRef.current.position.set(currentX, currentY, currentZ);
    droneMeshRef.current.visible = true;

    if (viewPreset === 'fpv' && cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(currentX, currentY, currentZ);
      controlsRef.current.target.set(currentX, currentY + 30, currentZ - 25);
    }
  }, [droneProgress, pointCloudData, viewPreset]);

  // 3D Object Picking & Measurement
  const handleCanvasClick = (e) => {
    if (!mountRef.current || !cameraRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    if (measureMode && pointsRef.current) {
      raycasterRef.current.params.Points.threshold = 1.2;
      const intersects = raycasterRef.current.intersectObject(pointsRef.current);
      if (intersects.length > 0) {
        const clickPoint = intersects[0].point;
        const newPoints = [...measurePoints, clickPoint];

        if (newPoints.length === 1) {
          setMeasurePoints(newPoints);
          setMeasurementResult({ status: 'Select second target point in 3D scene' });
        } else if (newPoints.length === 2) {
          setMeasurePoints(newPoints);
          const p1 = newPoints[0];
          const p2 = newPoints[1];
          const distance = p1.distanceTo(p2);
          const deltaX = Math.abs(p2.x - p1.x);
          const deltaY = Math.abs(p2.y - p1.y);
          const deltaZ = Math.abs(p2.z - p1.z);

          setMeasurementResult({
            distanceMeters: distance.toFixed(2),
            horizontalDistance: Math.hypot(deltaX, deltaY).toFixed(2),
            heightDeltaMeters: deltaZ.toFixed(2),
            p1: { x: p1.x.toFixed(1), y: p1.y.toFixed(1), z: p1.z.toFixed(1) },
            p2: { x: p2.x.toFixed(1), y: p2.y.toFixed(1), z: p2.z.toFixed(1) }
          });

          if (measurementLineRef.current && sceneRef.current) {
            sceneRef.current.remove(measurementLineRef.current);
          }
          const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
          const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 3 });
          const line = new THREE.Line(lineGeo, lineMat);
          sceneRef.current.add(line);
          measurementLineRef.current = line;
        } else {
          if (measurementLineRef.current && sceneRef.current) {
            sceneRef.current.remove(measurementLineRef.current);
            measurementLineRef.current = null;
          }
          setMeasurePoints([clickPoint]);
          setMeasurementResult({ status: 'Select second target point in 3D scene' });
        }
      }
      return;
    }

    if (objectsGroupRef.current) {
      const intersects = raycasterRef.current.intersectObjects(objectsGroupRef.current.children, true);
      if (intersects.length > 0) {
        let picked = intersects[0].object;
        while (picked && !picked.userData?.name && picked.parent !== objectsGroupRef.current) {
          picked = picked.parent;
        }

        if (picked && picked.userData?.name) {
          setSelectedObject(picked.userData);

          if (selectionBoxRef.current && sceneRef.current) {
            sceneRef.current.remove(selectionBoxRef.current);
          }
          const bbox = new THREE.Box3().setFromObject(picked);
          const helper = new THREE.Box3Helper(bbox, 0x00f0ff);
          sceneRef.current.add(helper);
          selectionBoxRef.current = helper;
          return;
        }
      }
    }

    if (selectionBoxRef.current && sceneRef.current) {
      sceneRef.current.remove(selectionBoxRef.current);
      selectionBoxRef.current = null;
    }
    setSelectedObject(null);
  };

  const focusOnObject = (targetObj) => {
    if (!targetObj || !cameraRef.current || !controlsRef.current) return;
    const targetPos = targetObj.dimensions ? { x: 13, y: 15, z: 6 } : { x: 0, y: 0, z: 0 };
    controlsRef.current.target.set(targetPos.x, targetPos.y, targetPos.z);
    cameraRef.current.position.set(targetPos.x, targetPos.y - 35, targetPos.z + 25);
    controlsRef.current.update();
  };

  const clearMeasurement = () => {
    if (measurementLineRef.current && sceneRef.current) {
      sceneRef.current.remove(measurementLineRef.current);
      measurementLineRef.current = null;
    }
    setMeasurePoints([]);
    setMeasurementResult(null);
  };

  // Dedicated Perspective Handlers (Top, Oblique, Side, Bottom)
  const setCameraPerspective = (type) => {
    setViewPreset(type);
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (type === 'top') {
      // Direct zenith top-down nadir view (0 deg polar angle)
      camera.position.set(0, 4.001, 150);
      controls.target.set(0, 4, 0);
    } else if (type === 'oblique') {
      camera.position.set(0, -95, 75);
      controls.target.set(0, 4, 25);
    } else if (type === 'side') {
      // Horizontal side view (90 deg polar angle)
      camera.position.set(-110, 4, 30);
      controls.target.set(0, 4, 30);
    } else if (type === 'bottom') {
      // Direct bottom-up nadir view (180 deg polar angle looking from UNDERNEATH!)
      camera.position.set(0, -80, -70);
      controls.target.set(0, 4, 0);
    }
    controls.update();
  };

  return (
    <div className='relative w-full h-full bg-[#06090e] overflow-hidden select-none'>
      <div 
        ref={mountRef} 
        onClick={handleCanvasClick}
        className={`w-full h-full ${measureMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      />

      {/* 21st.dev Floating Glass Pill Docks */}
      <div className='absolute top-3.5 left-4 right-4 flex items-center justify-between pointer-events-none z-20 flex-wrap gap-2'>
        {/* Left: Model Geometry Type Dock */}
        <div className='pointer-events-auto flex items-center gap-1 bg-zinc-950/80 backdrop-blur-2xl p-1 rounded-full border border-white/[0.08] shadow-2xl'>
          <div className='flex items-center gap-1.5 pl-2.5 pr-2 text-xs font-semibold text-zinc-300'>
            <Cuboid className='w-3.5 h-3.5 text-cyan-400' />
            <span className='hidden sm:inline text-[11px] tracking-tight text-zinc-400'>Model</span>
          </div>

          <button 
            onClick={() => setDisplayType('solid')} 
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all duration-150 cursor-pointer ${
              displayType === 'solid' 
                ? 'bg-white text-zinc-950 font-semibold shadow-sm' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Solid 3D
          </button>

          <button 
            onClick={() => setDisplayType('wireframe')} 
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all duration-150 cursor-pointer ${
              displayType === 'wireframe' 
                ? 'bg-white text-zinc-950 font-semibold shadow-sm' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Surface Mesh
          </button>

          <button 
            onClick={() => setDisplayType('points')} 
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all duration-150 cursor-pointer ${
              displayType === 'points' 
                ? 'bg-white text-zinc-950 font-semibold shadow-sm' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Points
          </button>

          <button 
            onClick={() => setDisplayType('hybrid')} 
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all duration-150 cursor-pointer ${
              displayType === 'hybrid' 
                ? 'bg-white text-zinc-950 font-semibold shadow-sm' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Hybrid
          </button>

          <div className='h-4 w-px bg-white/10 mx-1' />

          <button 
            onClick={() => setRenderMode(renderMode === 'rgb' ? 'elevation' : 'rgb')} 
            className='px-3 py-1 text-[11px] rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white cursor-pointer border border-white/[0.08] transition'
          >
            {renderMode === 'rgb' ? 'Natural RGB' : 'Elevation DEM'}
          </button>
        </div>

        {/* Right: Camera Angles & 360 Turntable Dock */}
        <div className='pointer-events-auto flex items-center gap-1 bg-zinc-950/80 backdrop-blur-2xl p-1 rounded-full border border-white/[0.08] shadow-2xl text-xs'>
          <button 
            onClick={() => setCameraPerspective('top')}
            className={`px-2.5 py-1 rounded-full transition-all duration-150 cursor-pointer flex items-center gap-1 ${
              viewPreset === 'top' ? 'bg-white text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
            title='Direct Top-Down Zenith View'
          >
            <ArrowDown className='w-3 h-3' />
            <span>Top</span>
          </button>

          <button 
            onClick={() => setCameraPerspective('oblique')}
            className={`px-2.5 py-1 rounded-full transition-all duration-150 cursor-pointer ${
              viewPreset === 'oblique' || viewPreset === 'perspective' ? 'bg-white text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
            title='3D Oblique Perspective'
          >
            Oblique
          </button>

          <button 
            onClick={() => setCameraPerspective('side')}
            className={`px-2.5 py-1 rounded-full transition-all duration-150 cursor-pointer ${
              viewPreset === 'side' ? 'bg-white text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
            title='Horizontal Side Elevation View'
          >
            Side
          </button>

          <button 
            onClick={() => setCameraPerspective('bottom')}
            className={`px-2.5 py-1 rounded-full transition-all duration-150 cursor-pointer flex items-center gap-1 ${
              viewPreset === 'bottom' ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
            title='Direct Bottom-Up Underneath View'
          >
            <ArrowUp className='w-3 h-3' />
            <span>Bottom</span>
          </button>

          <div className='h-4 w-px bg-white/10 mx-1' />

          {/* 360 Turntable Auto-Rotate Toggle */}
          <button 
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1 rounded-full transition-all duration-150 cursor-pointer flex items-center gap-1.5 text-xs ${
              autoRotate 
                ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm shadow-emerald-500/20' 
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
            title='Continuous 360-degree Turntable Rotation'
          >
            <RotateCcw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>360&deg; Spin</span>
          </button>

          <div className='h-4 w-px bg-white/10 mx-1' />

          <button
            onClick={() => {
              setMeasureMode(!measureMode);
              if (measureMode) clearMeasurement();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-150 cursor-pointer ${
              measureMode 
                ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm' 
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Ruler className='w-3 h-3' />
            <span>Ruler</span>
          </button>
        </div>
      </div>

      {/* Selected Object Card (21st.dev Design System) */}
      {selectedObject && (
        <div className='absolute top-16 left-5 w-88 bg-zinc-950/85 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-2xl z-20 text-xs font-sans animate-in fade-in zoom-in-95'>
          <div className='flex items-center justify-between pb-3 border-b border-white/[0.08]'>
            <div className='flex items-center gap-2'>
              <span className='relative flex h-2 w-2'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75' />
                <span className='relative inline-flex rounded-full h-2 w-2 bg-cyan-500' />
              </span>
              <span className='text-zinc-200 font-semibold tracking-tight text-xs'>Reconstructed 3D Asset</span>
            </div>
            <button 
              onClick={() => setSelectedObject(null)}
              className='p-1 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.08] transition cursor-pointer'
            >
              <X className='w-4 h-4' />
            </button>
          </div>

          <div className='mt-3.5 space-y-3'>
            <div>
              <span className='text-[10px] text-zinc-400 font-medium tracking-wide block uppercase'>Structural Classification</span>
              <strong className='text-white text-sm tracking-tight block mt-0.5'>{selectedObject.name}</strong>
            </div>

            <div className='text-[11px] text-zinc-300 bg-white/[0.03] p-2 rounded-xl border border-white/[0.06] flex items-center justify-between'>
              <span>Type: <strong className='text-zinc-200'>{selectedObject.type}</strong></span>
              <span className='text-emerald-400 font-medium'>{selectedObject.status}</span>
            </div>

            {selectedObject.dimensions && (
              <div className='grid grid-cols-2 gap-2 text-[11px] pt-1'>
                <div className='bg-zinc-900/60 p-2.5 rounded-xl border border-white/[0.06]'>
                  <span className='text-zinc-400 block text-[10px]'>Dimensions:</span>
                  <span className='text-white font-semibold'>
                    {selectedObject.dimensions.length || selectedObject.dimensions.diameter}m &times; {selectedObject.dimensions.width || selectedObject.dimensions.diameter}m &times; {selectedObject.dimensions.height}m
                  </span>
                </div>
                <div className='bg-zinc-900/60 p-2.5 rounded-xl border border-white/[0.06]'>
                  <span className='text-zinc-400 block text-[10px]'>Enclosed Volume:</span>
                  <span className='text-emerald-400 font-semibold'>{selectedObject.volumeM3} m&sup3;</span>
                </div>
                <div className='bg-zinc-900/60 p-2.5 rounded-xl border border-white/[0.06]'>
                  <span className='text-zinc-400 block text-[10px]'>Footprint:</span>
                  <span className='text-zinc-200 font-semibold'>{selectedObject.footprintM2} m&sup2;</span>
                </div>
                <div className='bg-zinc-900/60 p-2.5 rounded-xl border border-white/[0.06]'>
                  <span className='text-zinc-400 block text-[10px]'>Solid Model:</span>
                  <span className='text-cyan-400 font-semibold'>Top &amp; Bottom</span>
                </div>
              </div>
            )}

            <button
              onClick={() => focusOnObject(selectedObject)}
              className='w-full mt-1 py-2 bg-white text-zinc-950 hover:bg-zinc-200 rounded-full font-medium text-xs transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm shadow-white/10 cursor-pointer active:scale-[0.98]'
            >
              <Focus className='w-3.5 h-3.5' />
              <span>Orbit &amp; Center Asset</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Measurement Card */}
      {measureMode && measurementResult && (
        <div className='absolute top-16 right-5 w-80 bg-zinc-950/85 backdrop-blur-2xl p-4 rounded-2xl border border-amber-500/30 shadow-2xl text-xs font-sans z-20'>
          <div className='flex items-center justify-between pb-2.5 border-b border-white/[0.08]'>
            <span className='flex items-center gap-1.5 text-amber-300 font-medium'>
              <Crosshair className='w-4 h-4 animate-spin text-amber-400' />
              Metric 3D Distance Ruler
            </span>
            <button onClick={clearMeasurement} className='text-zinc-400 hover:text-white px-2 py-0.5 rounded-full hover:bg-white/[0.08] text-[11px] cursor-pointer'>Clear</button>
          </div>

          {measurementResult.distanceMeters ? (
            <div className='mt-3 space-y-2'>
              <div className='flex justify-between items-baseline bg-zinc-900/60 p-2.5 rounded-xl border border-white/[0.06]'>
                <span className='text-zinc-400'>3D Euclidean:</span>
                <span className='text-base font-semibold text-cyan-400'>{measurementResult.distanceMeters} m</span>
              </div>
              <div className='flex justify-between text-zinc-400 text-[11px] px-1'>
                <span>Horizontal Distance:</span>
                <span className='text-zinc-200 font-medium'>{measurementResult.horizontalDistance} m</span>
              </div>
              <div className='flex justify-between text-zinc-400 text-[11px] px-1'>
                <span>Height Delta (&Delta;Z):</span>
                <span className='text-amber-300 font-medium'>{measurementResult.heightDeltaMeters} m</span>
              </div>
            </div>
          ) : (
            <p className='mt-2 text-zinc-400 italic text-[11px]'>{measurementResult.status}</p>
          )}
        </div>
      )}

      {/* 21st.dev Bottom Overlays Pill Docks */}
      <div className='absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20 flex-wrap gap-2'>
        {/* Bottom Left: Live Metric Badge Pill */}
        <div className='pointer-events-auto flex items-center gap-3 bg-zinc-950/80 backdrop-blur-2xl px-4 py-2 rounded-full border border-white/[0.08] shadow-2xl text-xs'>
          <div className='flex items-center gap-2'>
            <span className='relative flex h-2 w-2'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
              <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500' />
            </span>
            <span className='font-semibold text-white tracking-tight'>Twin Solid Reconstructed</span>
          </div>

          <div className='h-3.5 w-px bg-white/10' />

          <div className='flex items-center gap-3 text-zinc-400 text-[11px] font-medium'>
            <span>Points: <strong className='text-zinc-200'>{(pointCloudData?.pointCount || 21161).toLocaleString()}</strong></span>
            <span>Accuracy: <strong className='text-emerald-400'>&plusmn; 1.8 cm</strong></span>
            <span>Elevation: <strong className='text-zinc-300'>0&deg; &ndash; 180&deg; Orbit</strong></span>
          </div>
        </div>

        {/* Bottom Right: Viewport Display Toggles Pill */}
        <div className='pointer-events-auto flex items-center gap-3 bg-zinc-950/80 backdrop-blur-2xl px-4 py-2 rounded-full border border-white/[0.08] shadow-2xl text-xs'>
          <label className='flex items-center gap-1.5 text-zinc-300 cursor-pointer hover:text-white transition'>
            <input 
              type='checkbox' 
              checked={showFlightPath} 
              onChange={(e) => setShowFlightPath(e.target.checked)}
              className='accent-cyan-400 rounded' 
            />
            <span className='text-[11px] font-medium'>Flight Path</span>
          </label>

          <div className='h-3 w-px bg-white/10' />

          <label className='flex items-center gap-1.5 text-zinc-300 cursor-pointer hover:text-white transition'>
            <input 
              type='checkbox' 
              checked={showBoundingBox} 
              onChange={(e) => setShowBoundingBox(e.target.checked)}
              className='accent-cyan-400 rounded' 
            />
            <span className='text-[11px] font-medium'>Bounding Box</span>
          </label>

          <div className='h-3 w-px bg-white/10' />

          <label className='flex items-center gap-1.5 text-zinc-300 cursor-pointer hover:text-white transition'>
            <input 
              type='checkbox' 
              checked={showGrid} 
              onChange={(e) => setShowGrid(e.target.checked)}
              className='accent-cyan-400 rounded' 
            />
            <span className='text-[11px] font-medium'>Grid</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function getHypsometricColor(t) {
  t = Math.max(0, Math.min(1, t));
  if (t < 0.25) {
    const f = t / 0.25;
    return { r: 0.1, g: 0.2 + 0.6 * f, b: 0.9 };
  } else if (t < 0.5) {
    const f = (t - 0.25) / 0.25;
    return { r: 0.1 + 0.1 * f, g: 0.8 + 0.15 * f, b: 0.9 - 0.7 * f };
  } else if (t < 0.75) {
    const f = (t - 0.5) / 0.25;
    return { r: 0.2 + 0.75 * f, g: 0.95, b: 0.2 - 0.1 * f };
  } else {
    const f = (t - 0.75) / 0.25;
    return { r: 0.95, g: 0.95 - 0.8 * f, b: 0.1 };
  }
}
