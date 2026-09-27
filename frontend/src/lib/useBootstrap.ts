"use client";

import { useEffect, useState } from "react";
import { getBootstrap } from "./api";
import type { Bootstrap } from "./types";

export function useBootstrap() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getBootstrap()
      .then((d) => alive && setData(d))
      .catch(() => alive && setError("Không kết nối được backend. Hãy chạy FastAPI ở cổng 8000."));
    return () => {
      alive = false;
    };
  }, []);

  return { data, error };
}
