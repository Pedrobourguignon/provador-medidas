"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { AreaMedida } from "@/lib/medicao";
import type { ProdutoId } from "@/lib/produtos";

// O manequim é gerado proceduralmente (sem arquivo .glb) com proporções fixas:
// cada "anel" do tronco é uma elipse calculada a partir de uma circunferência em cm.

type Anel = { y: number; circ: number; k: number }; // k = profundidade / largura

const COR_PELE = "#efe1d3";
const COR_PECA = "#d6457a";
const COR_PECA_ESCURA = "#b8325f";
const COR_PECA_CLARA = "#f0a3bf";
const Y_CALCINHA = 0.17;
const Y_CINTURA = 0.27;
const Y_BARRA_CAMISA = 0.12;
const Y_GOLA = 0.615;
const COR_FITA = "#f2a900";

const SUB_BUSTO = 76;
const BUSTO = 92;
const CINTURA = 72;
const QUADRIL = 98;

function semiEixos(circCm: number, k: number) {
  // Aproximação da circunferência da elipse: C ≈ 2π·√((a² + b²) / 2)
  const a = circCm / 100 / (2 * Math.PI * Math.sqrt((1 + k * k) / 2));
  return { a, b: a * k };
}

const ANEIS: Anel[] = [
  { y: 0.0, circ: QUADRIL * 0.93, k: 0.74 },
  { y: 0.1, circ: QUADRIL, k: 0.72 },
  { y: 0.27, circ: CINTURA, k: 0.72 },
  { y: 0.39, circ: SUB_BUSTO, k: 0.7 },
  { y: 0.47, circ: SUB_BUSTO * 1.04, k: 0.66 },
  { y: 0.55, circ: SUB_BUSTO * 1.13, k: 0.56 },
  { y: 0.6, circ: SUB_BUSTO * 0.98, k: 0.6 },
  { y: 0.635, circ: 38, k: 0.9 },
  { y: 0.7, circ: 33, k: 0.95 },
];

const PEITO = semiEixos(SUB_BUSTO * 1.04, 0.66);
const BASE_SUB = semiEixos(SUB_BUSTO, 0.7);
const OMBRO = semiEixos(SUB_BUSTO * 1.13, 0.56);
const RAIO_MAMA = 0.03 + (BUSTO - SUB_BUSTO) * 0.0016;
const Y_MAMA = 0.445;
const X_MAMA = PEITO.a * 0.46;
const Z_MAMA = PEITO.b * 0.72;

/** Perfil do tronco: para cada altura, os semi-eixos (x = largura, z = profundidade). */
const PERFIL = (() => {
  const controle = ANEIS.map(({ y, circ, k }) => {
    const { a, b } = semiEixos(circ, k);
    return new THREE.Vector3(a, y, b);
  });
  // Fecha em cima e embaixo
  controle.unshift(new THREE.Vector3(0.001, ANEIS[0].y - 0.01, 0.001));
  controle.push(new THREE.Vector3(0.001, ANEIS[ANEIS.length - 1].y + 0.012, 0.001));
  return new THREE.CatmullRomCurve3(controle, false, "centripetal").getPoints(140);
})();

/** Semi-eixos do tronco na altura `y` (ponto mais próximo do perfil). */
function perfilEm(y: number) {
  return PERFIL.reduce((m, p) => (Math.abs(p.y - y) < Math.abs(m.y - y) ? p : m));
}

/** Superfície do tronco; com `desdeY`/`ateY`/`folga` gera só uma faixa, levemente maior (usada nas peças). */
function criarTronco(ateY = Infinity, folga = 1, desdeY = -Infinity) {
  const perfil = PERFIL.filter((p) => p.y >= desdeY && p.y <= ateY);
  const segmentos = 72;
  const posicoes: number[] = [];
  const indices: number[] = [];

  perfil.forEach((p) => {
    for (let s = 0; s <= segmentos; s++) {
      const t = (s / segmentos) * Math.PI * 2;
      posicoes.push(Math.sin(t) * p.x * folga, p.y, Math.cos(t) * p.z * folga);
    }
  });
  for (let r = 0; r < perfil.length - 1; r++) {
    for (let s = 0; s < segmentos; s++) {
      const i = r * (segmentos + 1) + s;
      const j = i + segmentos + 1;
      indices.push(i, i + 1, j, i + 1, j + 1, j);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Contorno (acabamento/elástico) do tronco na altura `y`. */
function criarContorno(y: number, folga: number, raio = 0.004) {
  const p = perfilEm(y);
  const curva = new THREE.EllipseCurve(0, 0, p.x * folga, p.z * folga).getPoints(96);
  const pontos = curva.map((c) => new THREE.Vector3(c.x, p.y, c.y));
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos, true), 128, raio, 8, true);
}

function criarAlcas() {
  const geos = [-1, 1].map((lado) => {
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(lado * X_MAMA * 1.05, Y_MAMA + RAIO_MAMA * 0.75, Z_MAMA + RAIO_MAMA * 0.45),
      new THREE.Vector3(lado * OMBRO.a * 0.42, 0.585, OMBRO.b * 0.75),
      new THREE.Vector3(lado * OMBRO.a * 0.4, 0.622, 0),
      new THREE.Vector3(lado * OMBRO.a * 0.4, 0.585, -OMBRO.b * 0.8),
      new THREE.Vector3(lado * BASE_SUB.a * 0.42, 0.41, -BASE_SUB.b * 1.02),
    ]);
    return new THREE.TubeGeometry(curva, 48, 0.0035, 8, false);
  });
  return mergeSimples(geos);
}

/** Envoltória convexa 2D (monotone chain) — é exatamente o caminho que uma fita esticada faz. */
function envoltoria(pontos: THREE.Vector2[]) {
  const ps = [...pontos].sort((p, q) => p.x - q.x || p.y - q.y);
  const cruz = (o: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const inferior: THREE.Vector2[] = [];
  for (const p of ps) {
    while (inferior.length >= 2 && cruz(inferior[inferior.length - 2], inferior[inferior.length - 1], p) <= 0)
      inferior.pop();
    inferior.push(p);
  }
  const superior: THREE.Vector2[] = [];
  for (const p of [...ps].reverse()) {
    while (superior.length >= 2 && cruz(superior[superior.length - 2], superior[superior.length - 1], p) <= 0)
      superior.pop();
    superior.push(p);
  }
  return inferior.slice(0, -1).concat(superior.slice(0, -1));
}

/** Distância da origem até o polígono convexo na direção (sin t, cos t) — o polígono está no plano xz. */
function raioNaDirecao(poligono: THREE.Vector2[], t: number) {
  const dx = Math.sin(t);
  const dz = Math.cos(t);
  let melhor = 0;
  for (let i = 0; i < poligono.length; i++) {
    const p = poligono[i];
    const q = poligono[(i + 1) % poligono.length];
    const ex = q.x - p.x;
    const ez = q.y - p.y;
    const det = dx * -ez - dz * -ex;
    if (Math.abs(det) < 1e-9) continue;
    const dist = (p.x * -ez - p.y * -ex) / det;
    const u = (dx * p.y - dz * p.x) / det;
    if (dist > 0 && u >= 0 && u <= 1) melhor = Math.max(melhor, dist);
  }
  return melhor;
}

/**
 * Camisa: como o tronco, mas cada anel é a envoltória do corpo + seios naquela altura,
 * para o tecido cobrir o busto em vez de contornar cada seio.
 */
function criarCamisa(desdeY: number, ateY: number, folga: number) {
  const perfil = PERFIL.filter((p) => p.y >= desdeY && p.y <= ateY);
  const segmentos = 72;
  const posicoes: number[] = [];
  const indices: number[] = [];

  perfil.forEach((p) => {
    const pontos: THREE.Vector2[] = [];
    for (let i = 0; i < 72; i++) {
      const t = (i / 72) * Math.PI * 2;
      pontos.push(new THREE.Vector2(Math.sin(t) * p.x, Math.cos(t) * p.z));
    }
    // Corte do seio (esfera escalada [1, 0.95, 0.85]) na altura do anel, com folga para a rotação.
    const dy = (p.y - Y_MAMA) / 0.95;
    const r = RAIO_MAMA * 1.08;
    if (Math.abs(dy) < r) {
      const rc = Math.sqrt(r * r - dy * dy);
      for (const lado of [-1, 1]) {
        for (let i = 0; i < 32; i++) {
          const t = (i / 32) * Math.PI * 2;
          pontos.push(new THREE.Vector2(lado * X_MAMA + Math.cos(t) * rc, Z_MAMA + Math.sin(t) * rc * 0.85));
        }
      }
    }
    const contorno = envoltoria(pontos);
    for (let s = 0; s <= segmentos; s++) {
      const t = (s / segmentos) * Math.PI * 2;
      const raio = raioNaDirecao(contorno, t) * folga;
      posicoes.push(Math.sin(t) * raio, p.y, Math.cos(t) * raio);
    }
  });
  for (let r = 0; r < perfil.length - 1; r++) {
    for (let s = 0; s < segmentos; s++) {
      const i = r * (segmentos + 1) + s;
      const j = i + segmentos + 1;
      indices.push(i, i + 1, j, i + 1, j + 1, j);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Fita métrica ao redor do corpo na altura da área escolhida. */
function criarFita(area: AreaMedida) {
  const config: Record<AreaMedida, { y: number; circ: number; k: number; sobreSeios?: boolean }> = {
    quadril: { y: 0.1, circ: QUADRIL, k: 0.72 },
    cintura: { y: 0.27, circ: CINTURA, k: 0.72 },
    subBusto: { y: 0.385, circ: SUB_BUSTO, k: 0.7 },
    busto: { y: Y_MAMA, circ: SUB_BUSTO * 1.03, k: 0.67, sobreSeios: true },
  };
  const { y, circ, k, sobreSeios } = config[area];
  const { a, b } = semiEixos(circ, k);
  const folga = 1.025;

  const pontos: THREE.Vector2[] = [];
  for (let i = 0; i < 96; i++) {
    const t = (i / 96) * Math.PI * 2;
    pontos.push(new THREE.Vector2(Math.sin(t) * a * folga, Math.cos(t) * b * folga));
  }
  if (sobreSeios) {
    const r = RAIO_MAMA * 1.1;
    for (const lado of [-1, 1]) {
      for (let i = 0; i < 48; i++) {
        const t = (i / 48) * Math.PI * 2;
        pontos.push(new THREE.Vector2(lado * X_MAMA + Math.cos(t) * r, Z_MAMA + Math.sin(t) * r * 0.9));
      }
    }
  }

  const caminho = envoltoria(pontos).map((p) => new THREE.Vector3(p.x, y, p.y));
  const curva = new THREE.CatmullRomCurve3(caminho, true, "centripetal");
  return new THREE.TubeGeometry(curva, 256, 0.006, 8, true);
}

function Fita({ area }: { area: AreaMedida }) {
  const geo = useMemo(() => criarFita(area), [area]);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(({ clock }) => {
    if (material.current) material.current.emissiveIntensity = 0.5 + Math.sin(clock.elapsedTime * 4) * 0.35;
  });

  return (
    <mesh geometry={geo}>
      <meshStandardMaterial ref={material} color={COR_FITA} emissive={COR_FITA} roughness={0.4} />
    </mesh>
  );
}

function Material({ cor = COR_PECA, transparente = false }: { cor?: string; transparente?: boolean }) {
  return (
    <meshStandardMaterial
      color={cor}
      roughness={0.5}
      side={THREE.DoubleSide}
      transparent={transparente}
      opacity={transparente ? 0.55 : 1}
      depthWrite={!transparente}
    />
  );
}

/** Bojos: meia esfera frontal cobrindo a parte inferior de cada seio. */
function Bojos() {
  return [-1, 1].map((lado) => (
    <group key={lado} position={[lado * X_MAMA, Y_MAMA, Z_MAMA]} rotation={[0.12, lado * 0.32, 0]}>
      <mesh scale={[1, 0.95, 0.85]}>
        <sphereGeometry args={[RAIO_MAMA * 1.06, 48, 32, 0, Math.PI, Math.PI * 0.3, Math.PI * 0.55]} />
        <Material />
      </mesh>
    </group>
  ));
}

function Banda() {
  return (
    <mesh position={[0, 0.405, 0]} scale={[BASE_SUB.a * 1.03, 1, BASE_SUB.b * 1.03]}>
      <cylinderGeometry args={[1, 1, 0.035, 72, 1, true]} />
      <Material />
    </mesh>
  );
}

function Sutia() {
  const alcas = useMemo(() => criarAlcas(), []);
  return (
    <>
      <Bojos />
      <Banda />
      <mesh geometry={alcas}>
        <Material />
      </mesh>
    </>
  );
}

function Calcinha() {
  const calcinha = useMemo(() => criarTronco(Y_CALCINHA, 1.012), []);
  const elastico = useMemo(() => criarContorno(Y_CALCINHA, 1.02), []);
  return (
    <>
      <mesh geometry={calcinha}>
        <Material />
      </mesh>
      <mesh geometry={elastico}>
        <Material cor={COR_PECA_ESCURA} />
      </mesh>
    </>
  );
}

function Pijama() {
  const camisa = useMemo(() => criarCamisa(Y_BARRA_CAMISA, Y_GOLA, 1.018), []);
  const barra = useMemo(() => criarContorno(Y_BARRA_CAMISA, 1.02), []);
  const gola = useMemo(() => criarContorno(Y_GOLA, 1.02, 0.006), []);
  const short = useMemo(() => criarTronco(Y_CINTURA, 1.01), []);
  const botoes = [0.16, 0.22, 0.28, 0.34].map((y) => [0, y, perfilEm(y).z * 1.018 + 0.002] as const);
  return (
    <>
      <mesh geometry={short}>
        <Material cor={COR_PECA_CLARA} />
      </mesh>
      <mesh geometry={camisa}>
        <Material />
      </mesh>
      {[barra, gola].map((g, i) => (
        <mesh key={i} geometry={g}>
          <Material cor={COR_PECA_ESCURA} />
        </mesh>
      ))}
      {botoes.map((pos) => (
        <mesh key={pos[1]} position={pos} scale={[1, 1, 0.4]}>
          <sphereGeometry args={[0.006, 16, 12]} />
          <meshStandardMaterial color="#fff5ee" roughness={0.3} />
        </mesh>
      ))}
    </>
  );
}

/** Blusa do baby doll em evasê: sai logo abaixo do busto e abre até a altura do quadril. */
const EVASE = { topo: 0.39, barra: 0.03, abertura: 1.42 };

function BabyDoll() {
  const alcas = useMemo(() => criarAlcas(), []);
  const { topo, barra, abertura } = EVASE;
  const babado = useMemo(() => {
    const curva = new THREE.EllipseCurve(0, 0, BASE_SUB.a * 1.03 * abertura, BASE_SUB.b * 1.03 * abertura);
    const pontos = curva.getPoints(96).map((c) => new THREE.Vector3(c.x, barra, c.y));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos, true), 128, 0.004, 8, true);
  }, [abertura, barra]);
  return (
    <>
      <Calcinha />
      <Bojos />
      <Banda />
      <mesh geometry={alcas}>
        <Material />
      </mesh>
      <mesh position={[0, (topo + barra) / 2, 0]} scale={[BASE_SUB.a * 1.03, 1, BASE_SUB.b * 1.03]}>
        <cylinderGeometry args={[1, abertura, topo - barra, 72, 1, true]} />
        <Material transparente />
      </mesh>
      <mesh geometry={babado}>
        <Material cor={COR_PECA_ESCURA} />
      </mesh>
    </>
  );
}

const PECAS: Record<ProdutoId, () => React.ReactNode> = {
  sutia: Sutia,
  calcinha: Calcinha,
  pijama: Pijama,
  babyDoll: BabyDoll,
};

type PropsManequim = { peca: ProdutoId; mostrarPeca: boolean; destaque: AreaMedida | null };

function Manequim({ peca, mostrarPeca, destaque }: PropsManequim) {
  const tronco = useMemo(() => criarTronco(), []);
  const Peca = PECAS[peca];

  return (
    <group position={[0, -0.35, 0]}>
      <mesh geometry={tronco} castShadow>
        <meshStandardMaterial color={COR_PELE} roughness={0.75} />
      </mesh>

      {[-1, 1].map((lado) => (
        <group key={lado} position={[lado * X_MAMA, Y_MAMA, Z_MAMA]} rotation={[0.12, lado * 0.32, 0]}>
          <mesh scale={[1, 0.95, 0.85]} castShadow>
            <sphereGeometry args={[RAIO_MAMA, 48, 32]} />
            <meshStandardMaterial color={COR_PELE} roughness={0.75} />
          </mesh>
        </group>
      ))}

      {mostrarPeca && <Peca />}

      {destaque && <Fita area={destaque} />}

      {/* Suporte do manequim */}
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.45, 16]} />
        <meshStandardMaterial color="#8a7a6e" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.44, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.02, 48]} />
        <meshStandardMaterial color="#8a7a6e" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Junta geometrias indexadas em uma só (evita importar BufferGeometryUtils). */
function mergeSimples(geos: THREE.BufferGeometry[]) {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  let offset = 0;
  for (const g of geos) {
    const p = g.getAttribute("position");
    const n = g.getAttribute("normal");
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
    }
    const index = g.getIndex();
    if (index) for (let i = 0; i < index.count; i++) idx.push(index.getX(i) + offset);
    offset += p.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setIndex(idx);
  return geo;
}

export default function Mannequin3D({ peca, mostrarPeca, destaque }: PropsManequim) {
  return (
    <Canvas shadows camera={{ position: [0.45, 0.05, 1.9], fov: 35 }} dpr={[1, 2]}>
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#fff5ee", "#b9a89c", 0.6]} />
      <directionalLight position={[2, 3, 2]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-2, 1.5, -1]} intensity={0.5} />
      <Manequim peca={peca} mostrarPeca={mostrarPeca} destaque={destaque} />
      <ContactShadows position={[0, -0.8, 0]} opacity={0.35} scale={2} blur={2.5} far={1} />
      <OrbitControls
        enablePan={false}
        minDistance={0.9}
        maxDistance={2.8}
        target={[0, -0.2, 0]}
        autoRotate
        autoRotateSpeed={0.8}
      />
    </Canvas>
  );
}
