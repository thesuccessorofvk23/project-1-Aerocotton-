import * as THREE from "three";

/**
 * Procedural "Aero fabric" material.
 *
 * Geometry folds come from layered value noise (fbm) computed in the vertex
 * shader; the fragment shader adds a woven thread structure, a sheen
 * window, and three dye uniforms that the ten collection palettes drive.
 * No textures, no models, no post-processing — one draw call.
 * Edges dissolve toward the page ivory so the cloth appears to float.
 */

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uFoldScale;
  uniform float uFoldHeight;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying float vFold;

  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * noise(p);
      p *= 2.03;
      amp *= 0.5;
    }
    return v;
  }

  float field(vec2 p) {
    return fbm(p * uFoldScale + uTime * 0.05);
  }

  void main() {
    vUv = uv;
    vec3 pos = position;

    float fold = field(pos.xy);
    float ridge = fbm(pos.xy * uFoldScale * 2.7 - uTime * 0.03);
    pos.z += (fold - 0.5) * uFoldHeight + (ridge - 0.5) * uFoldHeight * 0.35;
    vFold = fold;

    // Approximate normal from the noise gradient (central differences).
    float e = 0.08;
    float hL = field(pos.xy - vec2(e, 0.0));
    float hR = field(pos.xy + vec2(e, 0.0));
    float hD = field(pos.xy - vec2(0.0, e));
    float hU = field(pos.xy + vec2(0.0, e));
    vNormalW = normalize(vec3(
      (hL - hR) * uFoldHeight,
      (hD - hU) * uFoldHeight,
      2.0 * e
    ));

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vPosW = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uDyeA;
  uniform vec3 uDyeB;
  uniform vec3 uDyeC;
  uniform float uExposure;
  uniform float uDissolve;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying float vFold;

  void main() {
    // Woven thread structure: two-direction sin interference + fine cross thread.
    float threads = 0.5
      + 0.24 * sin(vUv.x * 900.0)
      + 0.24 * sin(vUv.y * 900.0)
      + 0.06 * sin((vUv.x + vUv.y) * 2600.0);

    vec3 base = mix(uDyeA, uDyeB, smoothstep(0.25, 0.75, vFold));
    base = mix(base, uDyeC, smoothstep(0.62, 0.92, vFold) * 0.55);
    base *= 0.9 + 0.2 * threads;

    // Key light from upper left + gentle fill from the right.
    vec3 L = normalize(vec3(-0.45, 0.65, 0.62));
    vec3 N = normalize(vNormalW);
    float diff = clamp(dot(N, L), 0.0, 1.0);
    float fill = clamp(dot(N, normalize(vec3(0.7, -0.2, 0.5))), 0.0, 1.0) * 0.25;

    // Fabric sheen: broad, off-angle, never glossy.
    vec3 V = normalize(cameraPosition - vPosW);
    vec3 H = normalize(L + V);
    float sheen = pow(clamp(dot(N, H), 0.0, 1.0), 24.0) * 0.16;

    // Slow travelling light window — the "loom light" pass.
    float sweep = 0.5 + 0.5 * sin(vUv.x * 3.0 - uTime * 0.35);
    sweep = pow(sweep, 3.0) * 0.10;

    vec3 color = base * (0.55 + 0.5 * diff + fill) + vec3(sheen) + base * sweep;
    color *= uExposure;

    // Edges dissolve toward the page ivory so the cloth floats, not a rectangle.
    vec3 pageIvory = vec3(0.957, 0.941, 0.910);
    float edge = smoothstep(0.0, 0.20, vUv.x) * smoothstep(1.0, 0.80, vUv.x)
               * smoothstep(0.0, 0.16, vUv.y) * smoothstep(1.0, 0.84, vUv.y);
    color = mix(pageIvory, color, edge);

    // Dissolve for palette transitions; uOpacity for reduced-motion/static mode.
    float visible = (1.0 - uDissolve) * uOpacity;
    color = mix(pageIvory, color, visible);
    if (visible < 0.02) discard;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createFabricMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uFoldScale: { value: 1.6 },
      uFoldHeight: { value: 0.55 },
      uDyeA: { value: new THREE.Color("#b08d57") },
      uDyeB: { value: new THREE.Color("#dcc9a5") },
      uDyeC: { value: new THREE.Color("#f6f1e7") },
      uExposure: { value: 1.05 },
      uDissolve: { value: 0 },
      uOpacity: { value: 1 },
    },
  });
}
