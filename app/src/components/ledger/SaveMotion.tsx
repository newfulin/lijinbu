import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { formatYuan } from "../../lib/money";
import { shouldAnimate } from "../../lib/settings";
import { Celebrate3D } from "./Celebrate3D";

export function SaveMotion() {
  const { motion, reduceMotion, experimental3d, toast } = useApp();
  const animate = Boolean(motion && shouldAnimate(reduceMotion));
  const want3d = Boolean(animate && experimental3d);
  const [use3d, setUse3d] = useState(false);
  const [fallback2d, setFallback2d] = useState(false);

  useEffect(() => {
    if (!motion) return;
    if (want3d) {
      setUse3d(true);
      setFallback2d(false);
    } else if (animate) {
      setUse3d(false);
      setFallback2d(true);
    }
  }, [motion, want3d, animate]);

  const show2d = Boolean(motion && (!want3d || fallback2d) && shouldAnimate(reduceMotion));

  return (
    <>
      {use3d && motion ? (
        <Celebrate3D
          direction={motion.direction}
          onDone={(fellBack) => {
            setUse3d(false);
            if (fellBack) setFallback2d(true);
          }}
        />
      ) : null}
      {show2d ? (
        <div
          key={motion.key}
          className={`pointer-events-none fixed inset-0 z-[60] flex items-center justify-center ${
            motion.direction === "in" ? "motion-pulse-in" : "motion-pulse-out"
          }`}
        >
          <div
            className={`fly-amount text-3xl font-semibold ${
              motion.direction === "in" ? "text-income" : "text-expense"
            }`}
          >
            {formatYuan(
              motion.amountCents,
              true,
              motion.direction === "in" ? "in" : "out",
            )}
          </div>
        </div>
      ) : null}
      {toast ? (
        <div className="fixed bottom-8 left-1/2 z-[70] -translate-x-1/2 rounded-card bg-ink px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </>
  );
}
