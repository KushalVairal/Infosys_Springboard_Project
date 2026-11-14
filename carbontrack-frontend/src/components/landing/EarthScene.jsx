import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import livingEarthImg from '../../assets/earth-living-planet.jpg';

/**
 * Procedural Earth Ocean & Continent Texture Generator.
 * Creates an authentic satellite-style Earth texture with deep cobalt oceans,
 * shimmering turquoise coastal shallows, green continental outlines,
 * and delicate swirling white cloud veils.
 */
function createEarthOceanTexture() {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Deep Ocean Base Gradient (Midnight Cobalt to Cerulean)
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0.0, '#0a253c');
  oceanGrad.addColorStop(0.3, '#0e4168');
  oceanGrad.addColorStop(0.55, '#135987');
  oceanGrad.addColorStop(0.8, '#0e4168');
  oceanGrad.addColorStop(1.0, '#092137');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Turquoise / Cyan Tropical Coastal Currents & Reef Shallows
  const coastalGradients = [
    { x: 180, y: 300, rx: 140, ry: 75 },
    { x: 340, y: 320, rx: 120, ry: 65 },
    { x: 520, y: 280, rx: 160, ry: 85 },
    { x: 780, y: 310, rx: 150, ry: 80 },
    { x: 920, y: 290, rx: 130, ry: 70 },
    { x: 450, y: 360, rx: 110, ry: 55 },
    { x: 680, y: 370, rx: 140, ry: 65 },
  ];

  coastalGradients.forEach(({ x, y, rx, ry }) => {
    const cg = ctx.createRadialGradient(x, y, 10, x, y, rx);
    cg.addColorStop(0.0, 'rgba(43, 179, 177, 0.48)');
    cg.addColorStop(0.45, 'rgba(24, 139, 179, 0.32)');
    cg.addColorStop(0.8, 'rgba(18, 82, 127, 0.15)');
    cg.addColorStop(1.0, 'rgba(14, 58, 93, 0.0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Faint Continental Landmasses Visible on Southern/Mid Hemisphere
  const landmasses = [
    { cx: 210, cy: 340, r: 60 },
    { cx: 250, cy: 370, r: 45 },
    { cx: 530, cy: 330, r: 70 },
    { cx: 570, cy: 360, r: 50 },
    { cx: 810, cy: 350, r: 55 },
    { cx: 850, cy: 390, r: 40 },
  ];
  landmasses.forEach(({ cx, cy, r }) => {
    const lg = ctx.createRadialGradient(cx, cy, 5, cx, cy, r);
    lg.addColorStop(0, 'rgba(56, 142, 60, 0.60)');
    lg.addColorStop(0.6, 'rgba(46, 117, 60, 0.38)');
    lg.addColorStop(1, 'rgba(14, 58, 93, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4. Atmospheric Swirling White Cloud Belts
  for (let i = 0; i < 90; i++) {
    const cx = (i * 11.7) % width;
    const cy = 180 + ((i * 19.3) % 300);
    const cr = 22 + ((i * 7) % 55);
    const cg = ctx.createRadialGradient(cx, cy, 2, cx, cy, cr);
    cg.addColorStop(0.0, 'rgba(255, 255, 255, 0.34)');
    cg.addColorStop(0.4, 'rgba(255, 255, 255, 0.15)');
    cg.addColorStop(0.85, 'rgba(255, 255, 255, 0.03)');
    cg.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural Grass & Stone Terrace Texture.
 */
function createTerraceTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Rich Forest Meadow Green
  ctx.fillStyle = '#2f6d28';
  ctx.fillRect(0, 0, size, size);

  // Grass blades & earthy soil speckles
  const speckles = ['#388430', '#4ca43f', '#24521f', '#64b852', '#7a7238'];
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = speckles[i % speckles.length];
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1.5 + Math.random() * 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Contact Ground Shadow Radial Texture.
 */
function createContactShadowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 8, half, half, half - 10);
  grad.addColorStop(0.0, 'rgba(16, 36, 24, 0.65)');
  grad.addColorStop(0.35, 'rgba(16, 36, 24, 0.40)');
  grad.addColorStop(0.70, 'rgba(16, 36, 24, 0.12)');
  grad.addColorStop(1.0, 'rgba(16, 36, 24, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Tree Catalog: Strictly reproducing the reference image:
 * - Summit & Ridge Crest: Tall Alpine Conifers / Pines (tiered conical needles, pointing up).
 * - Upper Right Crest: Majestic Tall Feature Tree with prominent wooden trunk & umbrella lime canopy.
 * - Mid & Front Plateau: Volumetric Broadleaf Deciduous Trees with warm golden ochre,
 *   lime green, and emerald foliage.
 */
const FOREST_TREES = [
  // --- Summit & High Ridge Pines (Tall conical evergreens crowning the top) ---
  { x: -0.18, y: 1.25, z: 0.15, type: 'pine', scale: 1.55, color: 0x1b4524 },
  { x: 0.02, y: 1.34, z: 0.10, type: 'pine', scale: 1.68, color: 0x183e20 },
  { x: 0.22, y: 1.28, z: 0.12, type: 'pine', scale: 1.50, color: 0x20502c },
  { x: -0.38, y: 1.12, z: 0.28, type: 'pine', scale: 1.40, color: 0x1d4928 },
  { x: 0.36, y: 1.15, z: 0.22, type: 'pine', scale: 1.45, color: 0x194123 },
  { x: -0.08, y: 1.18, z: -0.12, type: 'pine', scale: 1.45, color: 0x1c4627 },
  { x: 0.12, y: 1.20, z: -0.18, type: 'pine', scale: 1.40, color: 0x173c21 },

  // --- Majestic Summit Feature Tree (Top right crest towering in reference) ---
  { x: 0.44, y: 1.38, z: -0.02, type: 'broadleaf', scale: 1.80, color: 0x58ba46, trunkH: 0.70 },

  // --- Mid Ridge Broadleaf Trees (Lush puffy crowns) ---
  { x: -0.65, y: 0.88, z: 0.38, type: 'broadleaf', scale: 1.42, color: 0x48a43b },
  { x: -0.45, y: 0.82, z: 0.62, type: 'broadleaf', scale: 1.50, color: 0x5ab84a },
  { x: -0.22, y: 0.78, z: 0.78, type: 'broadleaf', scale: 1.45, color: 0x3d9432 },
  { x: 0.15, y: 0.75, z: 0.80, type: 'broadleaf', scale: 1.40, color: 0x62be50 },
  { x: 0.52, y: 0.72, z: 0.68, type: 'broadleaf', scale: 1.38, color: 0x4aa63c },
  { x: 0.76, y: 0.68, z: 0.35, type: 'broadleaf', scale: 1.45, color: 0x55b244 },

  // --- Warm Autumnal / Golden Ochre Trees (Matching reference accents) ---
  { x: -0.32, y: 0.64, z: 0.95, type: 'broadleaf', scale: 1.38, color: 0xbfa240 },
  { x: 0.28, y: 0.62, z: 0.98, type: 'broadleaf', scale: 1.32, color: 0xc4a648 },
  { x: 0.88, y: 0.52, z: 0.08, type: 'broadleaf', scale: 1.50, color: 0x68c454 },
  { x: -0.85, y: 0.54, z: 0.12, type: 'broadleaf', scale: 1.45, color: 0x52b044 },

  // --- Front Terrace Deciduous Trees (Framing architecture) ---
  { x: -0.78, y: 0.42, z: 0.72, type: 'broadleaf', scale: 1.30, color: 0x429936 },
  { x: -0.58, y: 0.38, z: 0.98, type: 'broadleaf', scale: 1.35, color: 0x58b449 },
  { x: -0.12, y: 0.34, z: 1.12, type: 'broadleaf', scale: 1.25, color: 0x388e2e },
  { x: 0.18, y: 0.32, z: 1.15, type: 'broadleaf', scale: 1.20, color: 0x4aa43c },
  { x: 0.68, y: 0.35, z: 0.95, type: 'broadleaf', scale: 1.35, color: 0x429e37 },

  // --- Woodland Wrap around Backside ---
  { x: -0.72, y: 0.80, z: -0.45, type: 'pine', scale: 1.35, color: 0x1c4728 },
  { x: -0.40, y: 0.95, z: -0.68, type: 'pine', scale: 1.40, color: 0x194123 },
  { x: 0.00, y: 1.02, z: -0.80, type: 'pine', scale: 1.45, color: 0x173c21 },
  { x: 0.45, y: 0.90, z: -0.62, type: 'pine', scale: 1.40, color: 0x20502c },
  { x: 0.78, y: 0.75, z: -0.35, type: 'broadleaf', scale: 1.30, color: 0x4aa63c },
];

/**
 * Hanging Bush & Foliage Shelf Clumps:
 * Creates the signature thick, undulating, overhanging moss/foliage rim
 * wrapping around the equatorial perimeter, exactly as seen in the reference image.
 */
function generateOverhangBushes() {
  const bushes = [];
  const bushCount = 130;

  // Authentic palette from the reference image
  const palette = [
    0x225c27, // Deep forest green
    0x388e3c, // Lush leaf green
    0x4caf50, // Fresh green
    0x66bb6a, // Spring lime green
    0xb89e3a, // Warm golden ochre accent
    0x2c6e26, // Olive moss
  ];

  for (let i = 0; i < bushCount; i++) {
    const angle = (i / bushCount) * Math.PI * 2 + (Math.sin(i * 3.3) * 0.08);
    // Radius ranges from 1.38 to 1.72 (protruding past the globe like a natural collar)
    const baseR = 1.48 + Math.sin(i * 4.4) * 0.14 + (Math.sin(i * 10.2) * 0.06);
    // Situated at the equator line (-0.18 to +0.18) with lush hanging dips
    const y = 0.02 + Math.sin(i * 5.6) * 0.14 + ((i % 3 - 1) * 0.06);
    const radius = 0.09 + ((i % 7) * 0.020);

    const x = Math.cos(angle) * baseR;
    const z = Math.sin(angle) * baseR;

    bushes.push({
      x,
      y,
      z,
      radius,
      color: palette[i % palette.length],
      scale: 0.88 + (i % 5) * 0.10,
    });
  }

  // Clustered moss mounds adhering to the lower blue globe (matching reference)
  const southernMossCount = 18;
  for (let j = 0; j < southernMossCount; j++) {
    const angle = (j / southernMossCount) * Math.PI * 2 + 0.3;
    const phi = 1.85 + (j % 4) * 0.20; // lower hemisphere
    const r = 1.36;
    const x = r * Math.sin(phi) * Math.cos(angle);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(angle);
    bushes.push({
      x,
      y,
      z,
      radius: 0.08 + (j % 3) * 0.035,
      color: j % 2 === 0 ? 0x245e28 : 0x367e31,
      scale: 0.85,
    });
  }

  return bushes;
}

export default function EarthScene({ scrollProgress = 0, className = '' }) {
  const containerRef = useRef(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const progressRef = useRef(scrollProgress);

  useEffect(() => {
    progressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // WebGL capability check
    const canvasTest = document.createElement('canvas');
    const gl = canvasTest.getContext('webgl') || canvasTest.getContext('experimental-webgl');
    if (!gl) {
      setWebGlSupported(false);
      return;
    }

    let width = container.clientWidth || 480;
    let height = container.clientHeight || 480;
    const isMobile = width < 640;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    // Pulled back slightly and near eye-level so the full sphere, upper crown, and ground shadow fit
    const baseCamZ = isMobile ? 6.2 : 5.5;
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0.15, baseCamZ);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    container.appendChild(renderer.domElement);

    // 2. Master World Group (Rotates in 360°)
    const worldGroup = new THREE.Group();
    // Gentle tilt (0.08 rad) so both the blue sphere bottom and the forest plateau are prominent
    worldGroup.rotation.x = 0.08;
    scene.add(worldGroup);

    const sphereRadius = 1.34;

    // A. Spherical Ocean Earth Globe (Glossy Blue Marble)
    const oceanGeo = new THREE.SphereGeometry(sphereRadius, 64, 64);
    const oceanTexture = createEarthOceanTexture();
    const oceanMat = new THREE.MeshStandardMaterial({
      map: oceanTexture,
      roughness: 0.22,
      metalness: 0.08,
      emissive: new THREE.Color(0x072235),
      emissiveIntensity: 0.20,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    worldGroup.add(oceanMesh);

    // B. Living Biosphere Continental Shelf (Earthy Core + Grassy Top)
    // 1. Bedrock & Soil Core Shelf (Sitting horizontally across the equator)
    const shelfGeo = new THREE.CylinderGeometry(1.58, 1.45, 0.18, 48);
    shelfGeo.translate(0, 0.05, 0);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0x453523, // Warm earthen bedrock
      roughness: 0.95,
      flatShading: true,
    });
    const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
    worldGroup.add(shelfMesh);

    // 2. Grassy Forest Plateau Cap (Mounded Upper Landscape)
    const plateauDomeGeo = new THREE.SphereGeometry(
      sphereRadius * 1.018,
      48,
      24,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.48
    );
    const terraceTexture = createTerraceTexture();
    const plateauMat = new THREE.MeshStandardMaterial({
      map: terraceTexture,
      roughness: 0.70,
      metalness: 0.04,
      flatShading: true,
    });
    const plateauMesh = new THREE.Mesh(plateauDomeGeo, plateauMat);
    worldGroup.add(plateauMesh);

    // 3. Central Hill Elevation Leading into the Summit Pines
    const hillGeo = new THREE.SphereGeometry(0.95, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.40);
    hillGeo.scale(1.10, 0.45, 1.10);
    hillGeo.translate(0, 0.72, 0.05);
    const hillMesh = new THREE.Mesh(hillGeo, plateauMat);
    worldGroup.add(hillMesh);

    // C. Thick Hanging Bush & Overhanging Foliage Shelf (Smooth Organic Foliage)
    const overhangData = generateOverhangBushes();
    // Smooth shaded foliage geometry for soft, dense, organic tree/bush heads
    const bushGeo = new THREE.IcosahedronGeometry(1, 2);
    const bushMeshGroup = new THREE.Group();

    // Group bushes by color to batch materials efficiently
    const colorGroups = {};
    overhangData.forEach((b) => {
      if (!colorGroups[b.color]) colorGroups[b.color] = [];
      colorGroups[b.color].push(b);
    });

    Object.keys(colorGroups).forEach((colorHex) => {
      const bushesInGroup = colorGroups[colorHex];
      const bMat = new THREE.MeshStandardMaterial({
        color: parseInt(colorHex, 10),
        roughness: 0.60,
        flatShading: false, // Smooth organic foliage
      });
      const instancedBushes = new THREE.InstancedMesh(bushGeo, bMat, bushesInGroup.length);
      const dummyB = new THREE.Object3D();

      bushesInGroup.forEach((b, idx) => {
        dummyB.position.set(b.x, b.y, b.z);
        const s = b.radius * b.scale;
        dummyB.scale.set(s, s * 0.88, s);
        dummyB.rotation.set(Math.sin(idx) * 0.3, idx * 0.5, Math.cos(idx) * 0.3);
        dummyB.updateMatrix();
        instancedBushes.setMatrixAt(idx, dummyB.matrix);
      });

      instancedBushes.instanceMatrix.needsUpdate = true;
      bushMeshGroup.add(instancedBushes);
    });
    worldGroup.add(bushMeshGroup);

    // D. 3D Tree Geometries with Natural Wood Trunks & Dynamic Growth
    const treeInstances = [];
    const treeGroup = new THREE.Group();

    // Trunk Materials
    const trunkBarkMat = new THREE.MeshStandardMaterial({
      color: 0x543d2b,
      roughness: 0.88,
    });
    const pineTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.88,
    });

    FOREST_TREES.forEach((treeData, idx) => {
      const treeNode = new THREE.Group();
      treeNode.position.set(treeData.x, treeData.y, treeData.z);

      // Orient tree generally upwards from planet center with natural variation
      const upVec = treeNode.position.clone().normalize();
      const alignQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), upVec);
      treeNode.quaternion.copy(alignQuat);

      const targetScale = treeData.scale * (isMobile ? 0.88 : 1.12);

      if (treeData.type === 'pine') {
        // --- Alpine Conifer / Pine: Visible Trunk + 4-Tiered Conical Foliage Layers ---
        const trunkH = 0.35;
        const trunkGeo = new THREE.CylinderGeometry(0.016, 0.024, trunkH, 7);
        trunkGeo.translate(0, trunkH / 2, 0);
        const trunkMesh = new THREE.Mesh(trunkGeo, pineTrunkMat);
        treeNode.add(trunkMesh);

        const pineMat = new THREE.MeshStandardMaterial({
          color: treeData.color || 0x1b4524,
          roughness: 0.52,
          flatShading: true,
        });

        // 4 Cascading Conical Foliage Tiers
        const tiers = [
          { r: 0.15, h: 0.22, y: 0.16 },
          { r: 0.13, h: 0.20, y: 0.28 },
          { r: 0.10, h: 0.18, y: 0.40 },
          { r: 0.07, h: 0.15, y: 0.50 },
        ];
        tiers.forEach((t) => {
          const cone = new THREE.ConeGeometry(t.r, t.h, 7);
          cone.translate(0, t.y + t.h / 2, 0);
          const coneMesh = new THREE.Mesh(cone, pineMat);
          treeNode.add(coneMesh);
        });
      } else {
        // --- Broadleaf Deciduous Tree: Slender Woody Trunk + Volumetric Puffy Cloud Foliage ---
        const trunkH = treeData.trunkH || 0.42;
        const trunkGeo = new THREE.CylinderGeometry(0.018, 0.028, trunkH, 7);
        trunkGeo.translate(0, trunkH / 2, 0);
        const trunkMesh = new THREE.Mesh(trunkGeo, trunkBarkMat);
        treeNode.add(trunkMesh);

        const leafMat = new THREE.MeshStandardMaterial({
          color: treeData.color || 0x4caf50,
          roughness: 0.58,
          flatShading: false, // Smooth fluffy foliage puffs
        });

        // Multi-head puffy cloud canopy (3-5 overlapping organic spheres)
        const canopyGroup = new THREE.Group();
        canopyGroup.position.set(0, trunkH, 0);

        const puffs = [
          { r: 0.16, x: 0.0, y: 0.08, z: 0.0 },
          { r: 0.13, x: -0.09, y: 0.04, z: 0.06 },
          { r: 0.14, x: 0.08, y: 0.05, z: -0.05 },
          { r: 0.11, x: 0.02, y: 0.16, z: 0.04 },
        ];

        puffs.forEach((p) => {
          const puffGeo = new THREE.IcosahedronGeometry(p.r, 2);
          puffGeo.translate(p.x, p.y, p.z);
          const puffMesh = new THREE.Mesh(puffGeo, leafMat);
          canopyGroup.add(puffMesh);
        });
        treeNode.add(canopyGroup);
      }

      // Initial scale (begins as healthy sapling, unfurls with scroll)
      const initialScale = targetScale * 0.88;
      treeNode.scale.set(initialScale, initialScale, initialScale);

      treeGroup.add(treeNode);
      treeInstances.push({
        node: treeNode,
        baseScale: targetScale,
        currentScale: initialScale,
        threshold: 0.03 + (idx / FOREST_TREES.length) * 0.70,
      });
    });
    worldGroup.add(treeGroup);

    // E. Integrated Eco-Architecture Nestled in Foliage (Matching Reference)
    const archGroup = new THREE.Group();

    // 1. Modern Eco-Tower (Concrete/Stone tower on right side of plateau)
    const towerGeo = new THREE.BoxGeometry(0.20, 0.44, 0.20);
    towerGeo.translate(0, 0.22, 0);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0xdcd4c8, // Warm architectural limestone
      roughness: 0.65,
      flatShading: true,
    });
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.set(0.66, 0.45, 0.48);
    towerMesh.rotation.y = -0.35;
    archGroup.add(towerMesh);

    // Tower Louvers / Vertical Accent Windows
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x2d3748 });
    for (let w = 0; w < 5; w++) {
      const winGeo = new THREE.BoxGeometry(0.16, 0.035, 0.205);
      winGeo.translate(0, 0.10 + w * 0.065, 0);
      const winMesh = new THREE.Mesh(winGeo, windowMat);
      towerMesh.add(winMesh);
    }

    // 2. Stone Terraces & Retaining Parapet Walls
    const wallGeo = new THREE.BoxGeometry(0.46, 0.08, 0.07);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x9e9488,
      roughness: 0.85,
      flatShading: true,
    });
    const wallMesh1 = new THREE.Mesh(wallGeo, wallMat);
    wallMesh1.position.set(-0.25, 0.32, 1.08);
    wallMesh1.rotation.y = 0.18;
    archGroup.add(wallMesh1);

    const wallMesh2 = new THREE.Mesh(wallGeo, wallMat);
    wallMesh2.position.set(0.20, 0.30, 1.10);
    wallMesh2.rotation.y = -0.22;
    archGroup.add(wallMesh2);

    // 3. Curved Stone Viaduct / Bridge Arch
    const bridgeGeo = new THREE.BoxGeometry(0.30, 0.07, 0.10);
    bridgeGeo.translate(0, 0.035, 0);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, wallMat);
    bridgeMesh.position.set(0.32, 0.38, 0.72);
    bridgeMesh.rotation.y = -0.45;
    archGroup.add(bridgeMesh);

    // 4. Nestled Low-Rise Eco Cottages (Left and right slopes)
    const cottageMat = new THREE.MeshStandardMaterial({
      color: 0xbcaaa4,
      roughness: 0.75,
      flatShading: true,
    });
    const cottageRoofMat = new THREE.MeshStandardMaterial({
      color: 0x5d4037,
      roughness: 0.6,
      flatShading: true,
    });

    [-0.72, 0.88].forEach((xPos, idx) => {
      const houseBase = new THREE.BoxGeometry(0.13, 0.09, 0.11);
      houseBase.translate(0, 0.045, 0);
      const houseMesh = new THREE.Mesh(houseBase, cottageMat);

      const roofGeo = new THREE.ConeGeometry(0.11, 0.08, 4);
      roofGeo.translate(0, 0.13, 0);
      roofGeo.rotateY(Math.PI / 4);
      const roofMesh = new THREE.Mesh(roofGeo, cottageRoofMat);
      houseMesh.add(roofMesh);

      houseMesh.position.set(xPos, 0.34, idx === 0 ? 0.65 : 0.40);
      houseMesh.rotation.y = idx === 0 ? 0.4 : -0.5;
      archGroup.add(houseMesh);
    });

    worldGroup.add(archGroup);

    // F. Contact Floor Shadow (Gives Grounded Studio Realism)
    const shadowGeo = new THREE.PlaneGeometry(3.4, 3.4);
    shadowGeo.rotateX(-Math.PI / 2);
    shadowGeo.translate(0, -1.55, 0);
    const shadowTex = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.80,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    scene.add(shadowMesh);

    // G. Atmospheric Outer Glow
    const haloGeo = new THREE.SphereGeometry(sphereRadius * 1.20, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    scene.add(haloMesh);

    // 3. Orbiting Bird Flocks (Winged V-Shaped Birds in Flight)
    const birdGroup = new THREE.Group();
    const birdCount = isMobile ? 14 : 26;
    const birdRecords = [];

    // Lightweight 2-triangle winged bird geometry
    const wingGeo = new THREE.BufferGeometry();
    const wingVertices = new Float32Array([
      // Left Wing
      -0.050, 0.012, -0.018,
      0.0, 0.0, 0.018,
      0.0, 0.0, -0.018,
      // Right Wing
      0.0, 0.0, -0.018,
      0.0, 0.0, 0.018,
      0.050, 0.012, -0.018,
    ]);
    wingGeo.setAttribute('position', new THREE.BufferAttribute(wingVertices, 3));
    wingGeo.computeVertexNormals();

    const birdMat = new THREE.MeshBasicMaterial({
      color: 0x1f2923,
      side: THREE.DoubleSide,
    });

    for (let b = 0; b < birdCount; b++) {
      const birdMesh = new THREE.Mesh(wingGeo, birdMat);
      const orbitR = sphereRadius * 1.35 + Math.random() * 0.70;
      const phi = 0.32 + Math.random() * 0.65;
      const baseTheta = Math.random() * Math.PI * 2;
      const speed = 0.35 + Math.random() * 0.28;
      const flapSpeed = 9 + Math.random() * 6;

      birdRecords.push({
        mesh: birdMesh,
        r: orbitR,
        phi,
        theta: baseTheta,
        speed,
        flapSpeed,
        phase: Math.random() * Math.PI * 2,
      });

      birdGroup.add(birdMesh);
    }
    scene.add(birdGroup);

    // 4. Cinematic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xf2fbf5, 1.40);
    scene.add(ambientLight);

    // Top-right key sunlight casting rich shadows & highlights
    const keySun = new THREE.DirectionalLight(0xfffbee, 2.9);
    keySun.position.set(3.5, 7.0, 4.5);
    scene.add(keySun);

    // Soft cyan fill from lower left
    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.95);
    fillLight.position.set(-4.0, -2.0, -2.5);
    scene.add(fillLight);

    // Rim back-light for silhouette definition
    const rimLight = new THREE.DirectionalLight(0x86efac, 0.65);
    rimLight.position.set(0, 3, -5);
    scene.add(rimLight);

    // 5. Interactive Mouse Parallax & Drag Orbit
    let mouseX = 0;
    let mouseY = 0;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let isDragging = false;
    let prevPointerX = 0;
    let dragVelocity = 0;

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX = (e.clientX - cx) / (rect.width / 2);
      mouseY = (e.clientY - cy) / (rect.height / 2);

      if (isDragging) {
        const deltaX = e.clientX - prevPointerX;
        worldGroup.rotation.y += deltaX * 0.008;
        dragVelocity = deltaX * 0.008;
        prevPointerX = e.clientX;
      }
    };

    const onPointerDown = (e) => {
      isDragging = true;
      prevPointerX = e.clientX;
      container.style.cursor = 'grabbing';
    };

    const onPointerUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    // 6. Responsive Resize Handling
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 480;
      height = container.clientHeight || 480;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 7. Render Loop with Smooth 360° Rotation & Staggered Tree Growth
    let animId;
    let lastTime = performance.now();
    let flightTime = 0;

    const animate = (time) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) * 0.001, 0.1);
      lastTime = time;
      flightTime += delta;

      const progress = progressRef.current; // Scroll progress 0 to 1

      // A. Smooth Continuous 360° World Rotation (or momentum when dragging)
      if (!isDragging) {
        dragVelocity *= 0.92;
        const autoRot = 0.24 + progress * 0.28;
        worldGroup.rotation.y += delta * autoRot + dragVelocity;
      }

      // B. Parallax Tilt with Smooth Damping
      targetParallaxX = mouseX * 0.16;
      targetParallaxY = mouseY * 0.12;
      worldGroup.rotation.x = THREE.MathUtils.lerp(
        worldGroup.rotation.x,
        0.08 + targetParallaxY + progress * 0.10,
        0.05
      );
      worldGroup.rotation.z = THREE.MathUtils.lerp(worldGroup.rotation.z, -targetParallaxX * 0.22, 0.05);

      // C. Camera Zoom Response on Scroll
      const targetCamZ = baseCamZ - progress * 0.50;
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.05);

      // D. Animate Soaring Birds (Flapping & Orbital Glide)
      birdRecords.forEach((b) => {
        b.theta += delta * b.speed;
        const currentR = b.r;
        const curPhi = b.phi + Math.sin(flightTime * 0.9 + b.phase) * 0.04;

        b.mesh.position.set(
          currentR * Math.sin(curPhi) * Math.cos(b.theta),
          currentR * Math.cos(curPhi),
          currentR * Math.sin(curPhi) * Math.sin(b.theta)
        );

        // Orient bird along flight path tangent
        const tangent = new THREE.Vector3(
          -Math.sin(b.theta),
          0,
          Math.cos(b.theta)
        ).normalize();
        b.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

        // Flap wings smoothly
        const flap = Math.sin(flightTime * b.flapSpeed + b.phase) * 0.25;
        b.mesh.rotation.z = flap;
      });

      // E. Dynamic Staggered Tree Growth on Scroll / Interaction
      treeInstances.forEach((tr) => {
        let desiredScale = tr.baseScale * 0.88;
        if (progress > tr.threshold) {
          const factor = Math.min((progress - tr.threshold) / 0.22, 1.0);
          const easeOut = 1 - Math.pow(1 - factor, 3);
          desiredScale = tr.baseScale * (0.88 + 0.38 * easeOut);
        }

        if (Math.abs(tr.currentScale - desiredScale) > 0.002) {
          tr.currentScale = THREE.MathUtils.lerp(tr.currentScale, desiredScale, 0.1);
          tr.node.scale.set(tr.currentScale, tr.currentScale, tr.currentScale);
        }
      });

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // 8. Proper Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      resizeObserver.disconnect();

      oceanGeo.dispose();
      oceanTexture.dispose();
      oceanMat.dispose();

      shelfGeo.dispose();
      shelfMat.dispose();

      plateauDomeGeo.dispose();
      terraceTexture.dispose();
      plateauMat.dispose();

      hillGeo.dispose();
      bushGeo.dispose();

      shadowGeo.dispose();
      shadowTex.dispose();
      shadowMat.dispose();

      haloGeo.dispose();
      haloMat.dispose();

      wingGeo.dispose();
      birdMat.dispose();

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // WebGL Fallback Card (Shows high-res reference artwork)
  if (!webGlSupported) {
    return (
      <div className={`earth-fallback-card ${className}`}>
        <img
          src={livingEarthImg}
          alt="CarbonTrack Living Earth Biosphere"
          className="earth-reference-artwork-img"
        />
        <p className="earth-fallback-caption">
          CarbonTrack Living Biosphere (Hardware Acceleration / WebGL Fallback)
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`earth-canvas-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'grab',
        touchAction: 'none',
      }}
      aria-label="Interactive 3D living Earth rotating with lush forests, hanging moss shelf, architectural structures and atmospheric birds"
    />
  );
}
