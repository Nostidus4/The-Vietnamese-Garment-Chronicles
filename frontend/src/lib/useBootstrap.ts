"use client";

import { useEffect, useState } from "react";
import { getBootstrap } from "./api";
import type { Bootstrap } from "./types";

/** The book's content (one request, shared by every caller). `start = false` holds the request back until it turns true. */
export function useBootstrap(start = true) {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!start) return;
    let alive = true;
    getBootstrap()
      .then((d) => alive && setData(d))
      .catch(() => alive && setError("Không kết nối được backend. Hãy chạy FastAPI ở cổng 8000."));
    return () => {
      alive = false;
    };
  }, [start]);

  return { data, error };
}
