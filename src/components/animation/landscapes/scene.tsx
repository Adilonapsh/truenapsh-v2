// File: app/page.tsx (Next.js App Router with TypeScript)
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { useMemo, useRef } from "react";

const noiseGLSL = `// Simplex 2D noise
//
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 200.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}`;

function Landscape() {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef({ value: 0 });

  const geometry = useMemo(() => {
    return mergeGeometries(
      [
        new THREE.PlaneGeometry(1, 1, 250, 500),
        new THREE.PlaneGeometry(1, 1, 250, 500),
      ],
      true
    ).rotateX(-Math.PI / 2);
  }, []);

  const materials = useMemo(() => {
    return [0, 1].map((idx) => {
      const material = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x000000 : 0xffffff,
        side: idx === 0 ? THREE.FrontSide : THREE.BackSide,
      });

      // Add onBeforeCompile after creating the material
      material.onBeforeCompile = (shader: THREE.ShaderLibShader) => {
        shader.uniforms.time = timeRef.current;
        shader.uniforms.hasShift = { value: idx };

        shader.vertexShader = `
                uniform float hasShift;
                uniform float time;
                varying float river;
                varying float vHasShift;
                ${noiseGLSL}
                ${shader.vertexShader}
            `.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
                vHasShift = hasShift;
                float t = time * 2.0;
                vec3 pos = vec3(modelMatrix * vec4(position, 1.0));
                float treeNoise = abs(snoise((pos.xz - vec2(0., t)) * 0.25));
                treeNoise = pow(treeNoise, 0.5);
                float riverNoise = snoise(vec2(0, pos.z - t) * 0.05);
                riverNoise = smoothstep(5., 7., abs(pos.x + riverNoise * 2.5));
                transformed.y += treeNoise * 2.5 * riverNoise;
                transformed.y += hasShift * 0.05;
                river = riverNoise;
            `
        );

        shader.fragmentShader = `
                varying float vHasShift;
                varying float river;
                ${shader.fragmentShader}
            `.replace(
          "#include <color_fragment>",
          `#include <color_fragment>
                if(vHasShift < 0.5 && river < 0.01) diffuseColor.rgb = vec3(1.0);
                `
        );
      };

      return material;
    });
  }, []);

  useFrame((state) => {
    timeRef.current.value = state.clock.getElapsedTime();
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={materials}
      scale={[100, 1, 100]}
    />
  );
}

function Scene() {
  return (
    <Canvas camera={{ position: [-20, 25, 17], fov: 35 }}>
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
      <Landscape />
    </Canvas>
  );
}

export default function Home() {
  return (
    <main className="w-full h-screen bg-white">
      <Scene />
    </main>
  );
}
