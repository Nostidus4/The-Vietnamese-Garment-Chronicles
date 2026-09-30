"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { HAS_API, serverReady } from "@/lib/api";

/**
 * The backend runs on a free server that sleeps when nobody uses it. Ping it as soon as the app opens;
 * if it has not answered after 3 s, say so instead of letting the first request time out.
 */
export function ServerWake() {
  return HAS_API ? <Wake /> : null; // a static build has no server to wake
}

function Wake() {
  const [state, setState] = useState<"checking" | "waking" | "ready" | "down">("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    const slow = setTimeout(() => alive && setState((s) => (s === "checking" ? "waking" : s)), 3000);
    serverReady().then((ok) => alive && setState(ok ? "ready" : "down"));
    return () => {
      alive = false;
      clearTimeout(slow);
    };
  }, [attempt]);

  return (
    <AnimatePresence>
      {(state === "waking" || state === "down") && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#140c07]/70 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="status"
          aria-live="polite"
        >
          <div className="paper max-w-sm rounded-lg p-6 text-center shadow-xl">
            {state === "waking" ? (
              <>
                <p className="font-hand m-0 text-2xl text-[#2F4A6D]">Đang đánh thức máy chủ…</p>
                <p className="m-0 mt-2 text-sm text-stone-600">
                  Máy chủ miễn phí ngủ khi không có ai dùng, thường mất khoảng 30–60 giây để dậy. Bà đang pha ấm trà chờ con.
                </p>
                <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-2 w-2 rounded-full bg-[#D9A43B]"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="font-hand m-0 text-2xl text-[#B5452E]">Máy chủ chưa dậy được</p>
                <p className="m-0 mt-2 text-sm text-stone-600">Có thể mạng đang chậm. Con thử lại nhé.</p>
                <button
                  onClick={() => {
                    setState("checking");
                    setAttempt((a) => a + 1);
                  }}
                  className="mt-4 rounded-full bg-[#2F4A6D] px-5 py-2 text-sm text-amber-50"
                >
                  Thử lại
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
