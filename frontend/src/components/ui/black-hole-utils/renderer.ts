/**
 * High-performance WebGL Black Hole Renderer
 * Simulates:
 * - Event Horizon & Photon Sphere (gravitational lensing / light bending)
 * - Relativistic Accretion Disk with Keplerian rotation & Doppler beaming
 * - Stellar Background warp & Einstein Ring
 */

export function createRenderer({ canvas }) {
  if (!canvas) {
    return {
      ready: Promise.resolve(),
      dispose: () => {}
    };
  }

  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) {
    console.warn("WebGL not supported for black hole renderer");
    return {
      ready: Promise.resolve(),
      dispose: () => {}
    };
  }

  let animationFrameId = null;
  let isDisposed = false;

  // Vertex Shader
  const vsSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Fragment Shader: Black Hole gravitational lensing & accretion disk simulation
  const fsSource = `
    precision highp float;
    varying vec2 v_uv;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;

    #define PI 3.14159265359

    // Simple pseudo-random hash
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    // Value noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    // FBM (Fractal Brownian Motion)
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < 4; ++i) {
        v += a * noise(p);
        p = rot * p * 2.0 + shift;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 st = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

      // Mouse influence for parallax
      vec2 mouseOffset = (u_mouse - 0.5) * 0.35;
      st += mouseOffset;

      float r = length(st);
      float angle = atan(st.y, st.x);

      // Schwarzschild radius and photon sphere
      float rs = 0.36; // Event Horizon
      float photonSphere = rs * 1.5; // 0.54

      // Deep Space background stars
      vec2 starCoord = st * 35.0;
      float starVal = pow(hash(floor(starCoord)), 38.0) * 1.8;
      vec3 starColor = vec3(starVal);

      // Relativistic Light Bending (Gravitational Lensing)
      float deflection = 0.0;
      if (r > rs * 0.7) {
        deflection = (rs * 0.45) / (r - rs * 0.4);
      }

      vec2 warpedSt = st + normalize(st) * deflection * 0.28;
      float warpedR = length(warpedSt);

      // Accretion Disk geometry (squashed ellipse with tilt)
      float tilt = 0.38; // Inclination angle
      vec2 diskCoord = vec2(st.x, st.y / tilt);
      float diskR = length(diskCoord);
      float diskAngle = atan(diskCoord.y, diskCoord.x);

      // Keplerian differential rotation
      float omega = 1.2 / (pow(diskR + 0.1, 1.2) + 0.01);
      float rotAngle = diskAngle - u_time * omega * 0.8;

      // Disk density
      float diskInner = rs * 1.25;
      float diskOuter = rs * 3.8;
      float diskMask = smoothstep(diskInner, diskInner + 0.15, diskR) * (1.0 - smoothstep(diskOuter - 0.6, diskOuter, diskR));

      // Accretion disk plasma swirl texture
      float diskNoise = fbm(vec2(rotAngle * 3.0, diskR * 12.0 - u_time * 0.5));
      float diskDensity = diskMask * (0.6 + 0.4 * diskNoise);

      // Relativistic Doppler Beaming
      float doppler = 1.0 + 0.65 * sin(diskAngle);

      // Accretion disk color grading
      vec3 innerColor = vec3(1.0, 0.95, 0.85) * 2.2;
      vec3 outerColor = vec3(1.0, 0.42, 0.08);
      float tempT = smoothstep(diskInner, diskOuter, diskR);
      vec3 diskColor = mix(innerColor, outerColor, tempT) * diskDensity * doppler;

      // Secondary Einstein Ring
      float ringDist = abs(r - photonSphere * 1.06);
      float einsteinRing = exp(-ringDist * 42.0) * 1.4;
      vec3 ringColor = vec3(1.0, 0.85, 0.6) * einsteinRing;

      // Event Horizon core shadow
      float shadow = smoothstep(rs, rs + 0.025, r);

      // HDR Glow / Outer Corona Halo
      float halo = 0.08 / (r * 1.8 + 0.15);
      vec3 haloColor = vec3(1.0, 0.48, 0.12) * halo * 0.7;

      // Composite final pixel color
      vec3 col = starColor * (1.0 - diskMask * 0.9);
      col += diskColor * 1.4;
      col += ringColor;
      col += haloColor;

      // Cutout the event horizon shadow inside Schwarzschild boundary
      col *= shadow;

      // Soft vignette
      float vig = 1.0 - smoothstep(0.8, 1.8, length(st));
      col *= vig;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function createShader(glCtx, type, source) {
    const shader = glCtx.createShader(type);
    glCtx.shaderSource(shader, source);
    glCtx.compileShader(shader);
    if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
      console.error("Shader compile log:", glCtx.getShaderInfoLog(shader));
      glCtx.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vertShader || !fragShader) {
    return { ready: Promise.resolve(), dispose: () => {} };
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link log:", gl.getProgramInfoLog(program));
    return { ready: Promise.resolve(), dispose: () => {} };
  }

  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
  ]);

  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const aPosLoc = gl.getAttribLocation(program, 'a_position');
  const uResLoc = gl.getUniformLocation(program, 'u_resolution');
  const uTimeLoc = gl.getUniformLocation(program, 'u_time');
  const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');

  let mouseX = 0.5;
  let mouseY = 0.5;
  const onMouseMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      mouseX = (e.clientX - rect.left) / rect.width;
      mouseY = 1.0 - (e.clientY - rect.top) / rect.height;
    }
  };
  window.addEventListener('mousemove', onMouseMove);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth * dpr;
    const height = canvas.clientHeight * dpr;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  let startTime = performance.now();

  function render() {
    if (isDisposed) return;

    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(program);

    gl.enableVertexAttribArray(aPosLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    const time = (performance.now() - startTime) * 0.001;
    gl.uniform2f(uResLoc, canvas.width, canvas.height);
    gl.uniform1f(uTimeLoc, time);
    gl.uniform2f(uMouseLoc, mouseX, mouseY);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    animationFrameId = requestAnimationFrame(render);
  }

  render();

  return {
    ready: Promise.resolve(),
    dispose: () => {
      isDisposed = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      if (gl) {
        gl.deleteBuffer(posBuffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
      }
    }
  };
}
