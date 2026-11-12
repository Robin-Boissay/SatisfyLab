import * as THREE from 'three';
import { MergeTier } from './themeRegistry';
import { SimulationEvent, MergeEvent } from './simulation/types';

interface BallMeshRef {
  mesh: THREE.Mesh;
  material: THREE.MeshPhysicalMaterial;
  currentTier: number;
}

interface Spark3D {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export class MergeDrop3DRenderer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private sphereGeom: THREE.SphereGeometry;
  private sparkGeom: THREE.SphereGeometry;
  private ballMeshes: Map<number, BallMeshRef> = new Map();
  private sparks: Spark3D[] = [];

  private containerGroup: THREE.Group;
  private flashLight: THREE.PointLight;
  private textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
  private textureCache: Map<string, THREE.Texture> = new Map();

  // Facteur d'échelle 2D (540x960) vers coordonnées 3D Three.js
  private readonly scaleFactor = 0.02;
  private readonly offsetX = -270 * 0.02; // Centré en X
  private readonly offsetY = 480 * 0.02;  // Inversion Y

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(canvas.width, canvas.height, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();

    // Caméra perspective 9:16
    const aspect = canvas.width / canvas.height;
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 22);
    this.camera.lookAt(0, 0, 0);

    // Géométrie partagée pour performance maximale 60 FPS
    this.sphereGeom = new THREE.SphereGeometry(1, 32, 24);
    this.sparkGeom = new THREE.SphereGeometry(0.12, 12, 12);

    this.containerGroup = new THREE.Group();
    this.scene.add(this.containerGroup);

    // Éclairage Studio ASMR
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.4);
    mainLight.position.set(6, 12, 10);
    this.scene.add(mainLight);

    // Rim light Cyan
    const rimCyan = new THREE.DirectionalLight(0x00f0ff, 1.2);
    rimCyan.position.set(-8, -4, 5);
    this.scene.add(rimCyan);

    // Rim light Rose/Fuchsia
    const rimRose = new THREE.DirectionalLight(0xff007f, 1.0);
    rimRose.position.set(8, -6, 5);
    this.scene.add(rimRose);

    // Lumière dynamique d'impact/fusion
    this.flashLight = new THREE.PointLight(0xffffff, 0, 25);
    this.flashLight.position.set(0, 0, 4);
    this.scene.add(this.flashLight);

    this.buildContainer3D();
  }

  private buildContainer3D() {
    // Parois de la cuve stylisées en verre épais avec réfraction
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.85,
      ior: 1.45,
      thickness: 0.6
    });

    const cylinderGeom = new THREE.CylinderGeometry(4.8, 4.4, 15, 36, 1, true);
    const containerMesh = new THREE.Mesh(cylinderGeom, glassMat);
    containerMesh.position.set(0, -1.8, -0.5);
    this.containerGroup.add(containerMesh);
  }

  private toWorldX(x: number): number {
    return (x - 270) * this.scaleFactor;
  }

  private toWorldY(y: number): number {
    return -(y - 480) * this.scaleFactor;
  }

  /**
   * Met à jour les positions et l'animation des sphères 3D à partir de la simulation physique
   */
  public update(
    balls: { id: number; tier: number; x: number; y: number; radius: number; rotation?: number }[],
    currentTiers: MergeTier[],
    events: SimulationEvent[] = [],
    dt: number = 0.0166
  ): void {
    const presentIds = new Set<number>();

    for (const b of balls) {
      presentIds.add(b.id);
      let ref = this.ballMeshes.get(b.id);
      const tierData = currentTiers[b.tier] || currentTiers[0];

      if (!ref || ref.currentTier !== b.tier) {
        if (ref) {
          this.scene.remove(ref.mesh);
          ref.material.dispose();
        }

        let mapTex: THREE.Texture | null = null;
        if (tierData.image) {
          mapTex = this.textureCache.get(tierData.image) || null;
          if (!mapTex) {
            mapTex = this.textureLoader.load(tierData.image);
            this.textureCache.set(tierData.image, mapTex);
          }
        }

        const mat = new THREE.MeshPhysicalMaterial({
          color: mapTex ? new THREE.Color(0xffffff) : new THREE.Color(tierData.color || '#00f0ff'),
          map: mapTex,
          roughness: 0.12,
          metalness: 0.15,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08
        });

        const mesh = new THREE.Mesh(this.sphereGeom, mat);
        this.scene.add(mesh);
        ref = { mesh, material: mat, currentTier: b.tier };
        this.ballMeshes.set(b.id, ref);
      }

      const r3D = ((b as any).visualRadius || b.radius) * this.scaleFactor;
      ref.mesh.scale.set(r3D, r3D, r3D);
      ref.mesh.position.set(this.toWorldX(b.x), this.toWorldY(b.y), 0);

      if (b.rotation !== undefined) {
        ref.mesh.rotation.z = b.rotation;
      }
    }

    // Nettoyage des billes supprimées / fusionnées
    for (const [id, ref] of this.ballMeshes.entries()) {
      if (!presentIds.has(id)) {
        this.scene.remove(ref.mesh);
        ref.material.dispose();
        this.ballMeshes.delete(id);
      }
    }

    // Gestion des événements de merge (étincelles 3D et flash lumineux)
    for (const ev of events) {
      if (ev.type === 'merge') {
        const m = ev as MergeEvent;
        const wx = this.toWorldX(m.x);
        const wy = this.toWorldY(m.y);

        this.flashLight.position.set(wx, wy, 2);
        this.flashLight.intensity = 3.5;

        const tierColor = currentTiers[m.nextTier]?.color || '#ffd700';
        const colorObj = new THREE.Color(tierColor);

        // Crée 12 étincelles sphériques 3D
        for (let s = 0; s < 12; s++) {
          const sparkMat = new THREE.MeshBasicMaterial({ color: colorObj });
          const sparkMesh = new THREE.Mesh(this.sparkGeom, sparkMat);
          sparkMesh.position.set(wx, wy, (Math.random() - 0.5) * 1.5);
          this.scene.add(sparkMesh);

          const ang = Math.random() * Math.PI * 2;
          const spd = 4 + Math.random() * 8;
          this.sparks.push({
            mesh: sparkMesh,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            vz: (Math.random() - 0.5) * 4,
            life: 0.6,
            maxLife: 0.6
          });
        }
      }
    }

    // Atténuation douce du flash lumineux
    if (this.flashLight.intensity > 0) {
      this.flashLight.intensity = Math.max(0, this.flashLight.intensity - dt * 8);
    }

    // Mise à jour des particules 3D
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life -= dt;
      sp.mesh.position.x += sp.vx * dt;
      sp.mesh.position.y += sp.vy * dt;
      sp.mesh.position.z += sp.vz * dt;
      const alpha = Math.max(0, sp.life / sp.maxLife);
      sp.mesh.scale.set(alpha, alpha, alpha);

      if (sp.life <= 0) {
        this.scene.remove(sp.mesh);
        (sp.mesh.material as THREE.Material).dispose();
        this.sparks.splice(i, 1);
      }
    }
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public destroy(): void {
    for (const ref of this.ballMeshes.values()) {
      this.scene.remove(ref.mesh);
      ref.material.dispose();
    }
    this.ballMeshes.clear();

    for (const sp of this.sparks) {
      this.scene.remove(sp.mesh);
      (sp.mesh.material as THREE.Material).dispose();
    }
    this.sparks = [];

    this.sphereGeom.dispose();
    this.sparkGeom.dispose();
    this.renderer.dispose();
  }
}
