import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Center,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
  useProgress,
} from "@react-three/drei";

type Product3DViewerProps = {
  modelUrl: string;
  onClose: () => void;
};

function Model({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

function Loader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex min-w-[220px] flex-col items-center rounded-xl bg-black/80 px-6 py-5 text-white shadow-xl">
        <div className="mb-3 text-sm">
          Đang tải mô hình 3D...
        </div>

        <div className="h-2 w-48 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-200"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="mt-2 text-xs text-white/70">
          {progress.toFixed(0)}%
        </div>
      </div>
    </Html>
  );
}

export default function Product3DViewer({
  modelUrl,
  onClose,
}: Product3DViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = async () => {
    if (!viewerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await viewerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Không thể bật toàn màn hình:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 p-4 md:p-8">
      <div
        ref={viewerRef}
        className="relative h-full min-h-0 w-full overflow-hidden rounded-xl bg-[#171717]"
      >
        {/* Tiêu đề */}
        <div className="absolute left-5 top-5 z-20">
          <h2 className="text-lg font-medium text-white">
            Xem sản phẩm 3D
          </h2>

          <p className="mt-1 text-xs text-white/60">
            Kéo chuột để xoay mô hình
          </p>
        </div>

        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl leading-none text-black shadow-lg transition hover:bg-white"
        >
          ×
        </button>

        {/* Nút fullscreen */}
        <button
          type="button"
          onClick={handleFullscreen}
          className="absolute right-16 top-4 z-30 rounded-lg bg-white/90 px-4 py-2 text-sm text-black shadow-lg transition hover:bg-white"
        >
          ⛶ Toàn màn hình
        </button>

        {/* Viewer */}
        <div className="h-full w-full">
          <Canvas
            camera={{
              position: [4, 3, 5],
              fov: 45,
            }}
            dpr={[1, 1.5]}
            gl={{
              antialias: true,
              preserveDrawingBuffer: false,
            }}
          >
            <color attach="background" args={["#171717"]} />

            <ambientLight intensity={1.5} />

            <directionalLight
              position={[5, 8, 5]}
              intensity={2}
            />

            <directionalLight
              position={[-5, 3, -5]}
              intensity={1}
            />

            <Environment preset="studio" />

            <Suspense fallback={<Loader />}>
              <Bounds
                fit
                clip
                observe
                margin={1.2}
              >
                <Model modelUrl={modelUrl} />
              </Bounds>
            </Suspense>

            <OrbitControls
              makeDefault
              enableRotate
              enableZoom
              enablePan
              minDistance={0.5}
              maxDistance={20}
              dampingFactor={0.08}
              enableDamping
            />
          </Canvas>
        </div>

        {/* Hướng dẫn */}
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2">
          <div className="rounded-full bg-black/60 px-5 py-3 text-xs text-white/90 backdrop-blur-md">
            Kéo trái để xoay • Cuộn để zoom • Chuột phải để di chuyển
          </div>
        </div>
      </div>
    </div>
  );
}