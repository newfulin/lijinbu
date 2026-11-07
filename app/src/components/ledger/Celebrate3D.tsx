import { useEffect, useRef } from "react";

type Props = {
  direction: "in" | "out";
  /** fellBack=true 表示 three 加载/初始化失败，外层应回退 2D */
  onDone: (fellBack?: boolean) => void;
};

/**
 * 案头礼簿微缩庆祝：dynamic import('three')，纯几何无 glTF。
 * 失败时 onDone(true) → 由外层回退 2D。
 */
export function Celebrate3D({ direction, onDone }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let renderer: { dispose: () => void; domElement: HTMLCanvasElement; forceContextLoss?: () => void } | null =
      null;
    let timer = 0;

    const finish = (fellBack = false) => {
      if (cancelled) return;
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      try {
        renderer?.forceContextLoss?.();
        renderer?.dispose();
        renderer?.domElement?.remove();
      } catch {
        /* ignore */
      }
      onDone(fellBack);
    };

    (async () => {
      try {
        const THREE = await import("three");
        if (cancelled || !hostRef.current) {
          finish(true);
          return;
        }

        const w = 280;
        const h = 200;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
        camera.position.set(0.9, 1.1, 2.2);
        camera.lookAt(0, 0.2, 0);

        const webgl = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        webgl.setSize(w, h);
        webgl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        webgl.setClearColor(0x000000, 0);
        hostRef.current.appendChild(webgl.domElement);
        renderer = webgl;

        const light = new THREE.DirectionalLight(0xffffff, 1.15);
        light.position.set(2, 3, 2);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.55));

        const cover = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 0.12, 0.75),
          new THREE.MeshStandardMaterial({
            color: direction === "in" ? 0x0d9488 : 0xd97706,
            roughness: 0.45,
            metalness: 0.08,
          }),
        );
        cover.position.y = 0.18;
        scene.add(cover);

        const pages = new THREE.Mesh(
          new THREE.BoxGeometry(1.0, 0.22, 0.7),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 }),
        );
        pages.position.y = 0.02;
        scene.add(pages);

        const spine = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.28, 0.72),
          new THREE.MeshStandardMaterial({ color: 0x134e4a }),
        );
        spine.position.set(-0.52, 0.08, 0);
        scene.add(spine);

        const t0 = performance.now();
        const tick = (now: number) => {
          if (cancelled) return;
          const t = (now - t0) / 1000;
          cover.rotation.y = Math.sin(t * 2.2) * 0.35;
          pages.rotation.y = cover.rotation.y;
          spine.rotation.y = cover.rotation.y;
          cover.position.y = 0.18 + Math.sin(t * 4) * 0.03;
          webgl.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        timer = window.setTimeout(() => finish(false), 1300);
      } catch {
        finish(true);
      }
    })();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      try {
        renderer?.forceContextLoss?.();
        renderer?.dispose();
        renderer?.domElement?.remove();
      } catch {
        /* ignore */
      }
    };
  }, [direction, onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/20">
      <div className="rounded-card bg-white/90 p-4 shadow-card">
        <div ref={hostRef} className="mx-auto" style={{ width: 280, height: 200 }} />
        <p className="mt-2 text-center text-xs text-ink-muted">人情簿 · 记好了</p>
      </div>
    </div>
  );
}
