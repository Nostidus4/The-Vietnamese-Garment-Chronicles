"use client";

// Dev-only listening room for the Opening voice-over (needs the backend started with DEV_TOOLS=1).
// Pick the designed voice of each character, compare the 3 candidates of every take, regenerate one take,
// and play a whole screen back to back to hear whether it flows.

import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/api";
import { asset } from "@/lib/base";

type Cand = { key: string; file: string; duration?: number; rate?: number; cues?: number[]; cues_ok?: boolean; score?: number };
type Take = {
  id: string;
  voice: string;
  beats: number[];
  text: string;
  file?: string;
  picked?: string;
  cues?: number[];
  target_rate?: number;
  candidates?: Cand[];
  missing?: boolean;
};
type Voice = {
  id: string;
  name: string;
  voice_id: string | null;
  same_as?: string | null;
  rate: number;
  candidates: { key: string; voice_id: string; sample: string | null }[];
};
type Data = { voices: Voice[]; screens: { id: string; title: string; scene: string | null; takes: Take[] }[] };

const post = (path: string, body: object) =>
  fetch(`${API_URL}/dev/voiceover/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => {
    if (!r.ok) return r.text().then((t) => Promise.reject(new Error(t)));
    return r.json();
  });

export default function VoiceReview() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [stamp, setStamp] = useState(0); // cache-buster after a pick
  const player = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(() => {
    fetch(`${API_URL}/dev/voiceover`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Backend chưa bật DEV_TOOLS=1"))))
      .then((d: Data) => {
        setData(d);
        setStamp(Date.now());
      })
      .catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const act = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    try {
      await fn();
      load();
    } catch (e) {
      alert((e as Error).message.slice(0, 300));
    } finally {
      setBusy(null);
    }
  };

  const playScreen = async (sid: string, takes: Take[]) => {
    const el = (player.current ??= new Audio());
    for (const t of takes.filter((x) => x.file)) {
      el.src = asset(`/opening/voice-${sid}/${t.file}?v=${stamp}`);
      await el.play().catch(() => {});
      await new Promise((r) => (el.onended = r));
      await new Promise((r) => setTimeout(r, 450));
    }
  };

  if (error) return <main className="p-8 text-stone-800">⚠️ {error}. Chạy backend với DEV_TOOLS=1 rồi tải lại trang.</main>;
  if (!data) return <main className="p-8 text-stone-800">Đang tải…</main>;
  const voiceName = Object.fromEntries(data.voices.map((v) => [v.id, v.name]));

  return (
    <main className="min-h-screen bg-[#f6efe0] px-6 py-8 text-stone-800">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display m-0 text-3xl text-[#2F4A6D]">Phòng nghe giọng đọc – Opening</h1>
        <p className="mt-1 text-sm text-stone-600">
          Chỉ dùng ở bản dev. Gói miễn phí giới hạn 10 lần tạo giọng mỗi ngày: “Tạo lại” tốn 3 lần mỗi đoạn.
          {busy && <b className="ml-2 text-[#B5452E]">Đang {busy}…</b>}
        </p>

        <h2 className="mt-8 text-xl">1 · Giọng nhân vật</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {data.voices.map((v) => (
            <section key={v.id} className="rounded-lg bg-white/70 p-4 shadow-sm">
              <p className="m-0 font-semibold">
                {v.name} <span className="text-xs text-stone-500">({v.id} · tốc độ chuẩn {v.rate} âm tiết/giây)</span>
              </p>
              {v.same_as ? (
                <p className="m-0 mt-2 text-sm text-stone-600">Dùng chung giọng của {voiceName[v.same_as]}, đọc nhẹ và trong hơn (Google không cho thiết kế giọng trẻ nhỏ).</p>
              ) : v.candidates.length === 0 ? (
                <p className="m-0 mt-2 text-sm text-stone-600">Chưa thiết kế: python -m scripts.generate_voices design --voice {v.id}</p>
              ) : (
                <ul className="m-0 mt-2 list-none space-y-2 p-0">
                  {v.candidates.map((c) => (
                    <li key={c.key} className="flex items-center gap-2">
                      <span className={`w-6 text-center font-mono ${v.voice_id === c.voice_id ? "rounded bg-[#2F4A6D] text-white" : ""}`}>{c.key}</span>
                      {c.sample ? <audio controls preload="none" src={c.sample} className="h-8 flex-1" /> : <span className="flex-1 text-xs">không có mẫu</span>}
                      <button
                        disabled={!!busy || v.voice_id === c.voice_id}
                        onClick={() => act("chọn giọng", () => post("voice-pick", { voice: v.id, voice_id: c.voice_id }))}
                        className="rounded-full border border-stone-600 px-3 py-1 text-xs disabled:opacity-40"
                      >
                        {v.voice_id === c.voice_id ? "Đang dùng" : "Chọn"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <h2 className="mt-10 text-xl">2 · Từng screen</h2>
        {data.screens.map((s) => (
          <section key={s.id} className="mt-4 rounded-lg bg-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <p className="m-0 font-semibold">
                {s.id.toUpperCase()} · {s.title}
              </p>
              {s.takes.some((t) => t.file) && (
                <button onClick={() => playScreen(s.id, s.takes)} className="rounded-full bg-[#2F4A6D] px-3 py-1 text-xs text-white">
                  ▶ Nghe cả screen
                </button>
              )}
              <button
                disabled={!!busy}
                onClick={() => act(`tạo ${s.id}`, () => post("regenerate", { screen: s.id }))}
                className="ml-auto rounded-full border border-stone-600 px-3 py-1 text-xs disabled:opacity-40"
              >
                Tạo lại cả screen
              </button>
            </div>
            {s.scene && <p className="m-0 mt-1 text-xs italic text-stone-500">{s.scene}</p>}
            {s.takes.map((t) => (
              <div key={t.id} className="mt-3 border-t border-dashed border-stone-300 pt-3">
                <p className="m-0 text-sm">
                  <b>{t.id}</b> · {voiceName[t.voice]} · câu {t.beats.join(", ")}: <span className="text-stone-700">{t.text}</span>
                </p>
                {t.missing ? (
                  <p className="m-0 mt-1 text-xs text-[#B5452E]">Chưa tạo.</p>
                ) : (
                  <ul className="m-0 mt-2 list-none space-y-1.5 p-0">
                    {(t.candidates ?? []).map((c) => (
                      <li key={c.key} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`w-6 text-center font-mono ${t.picked === c.key ? "rounded bg-[#2F4A6D] text-white" : ""}`}>{c.key}</span>
                        <audio controls preload="none" src={asset(`/opening/voice-${s.id}/${c.file}?v=${stamp}`)} className="h-8 w-72" />
                        <span>{c.duration}s</span>
                        <span className={Math.abs((c.rate ?? 0) - (t.target_rate ?? 0)) > 0.8 ? "text-[#B5452E]" : ""}>
                          {c.rate} ât/s (chuẩn {t.target_rate})
                        </span>
                        {t.beats.length > 1 && (
                          <span className={c.cues_ok ? "" : "text-[#B5452E]"}>
                            mốc {c.cues?.join(" · ")}s{c.cues_ok ? "" : " (ước lượng)"}
                          </span>
                        )}
                        <span className="text-stone-400">điểm {c.score}</span>
                        <button
                          disabled={!!busy || t.picked === c.key}
                          onClick={() => act("chọn bản", () => post("take-pick", { screen: s.id, take: t.id, key: c.key }))}
                          className="rounded-full border border-stone-600 px-2 py-0.5 disabled:opacity-40"
                        >
                          {t.picked === c.key ? "Đang dùng" : "Dùng bản này"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  disabled={!!busy}
                  onClick={() => act(`tạo ${s.id} ${t.id}`, () => post("regenerate", { screen: s.id, take: t.id }))}
                  className="mt-2 rounded-full border border-stone-400 px-3 py-1 text-xs text-stone-600 disabled:opacity-40"
                >
                  Tạo lại đoạn này (3 bản)
                </button>
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
