"use client";

// "Tạo link" (#27): a public page for one Du Ký page. Only the month, the garment, the occasion, the line the reader
// wrote and the photos they tick leave this device: never the notebook's name, the exact day or the place.
// Real photos need a second, explicit yes. The link can be taken down at any time with the key kept on this device.

import { useState } from "react";
import { createShare, deleteShare, type ShareMeta } from "@/lib/api";
import { getPhoto, shrinkPhoto, updatePage, usePhotoUrl, type DuKyPage, type PhotoRef } from "@/lib/dukyBook";
import { asset } from "@/lib/base";

const LABELS = ["Authentic", "Adapted", "Inspired"];
export const shareUrl = (id: string) => `${window.location.origin}${asset("/du-ky/p/")}?id=${encodeURIComponent(id)}`;

function Thumb({ photo, on, toggle }: { photo: PhotoRef; on: boolean; toggle: () => void }) {
  const url = usePhotoUrl(photo.id);
  return (
    <label className={`relative block w-20 cursor-pointer rounded border-2 p-0.5 ${on ? "border-[#27354f]" : "border-transparent opacity-60"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- object URL from IndexedDB */}
      {url && <img src={url} alt="" className="aspect-[3/4] w-full object-cover" />}
      <input type="checkbox" checked={on} onChange={toggle} className="absolute left-1 top-1" />
      <span className="block text-center text-[0.6rem]">{photo.kind === "real" ? "Ảnh thật" : "Ảnh AI"}</span>
    </label>
  );
}

export function ShareDialog({ page, onClose }: { page: DuKyPage; onClose: () => void }) {
  const [picked, setPicked] = useState<string[]>(page.photos.filter((p) => p.kind !== "real").map((p) => p.id));
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const chosen = page.photos.filter((p) => picked.includes(p.id));
  const hasReal = chosen.some((p) => p.kind === "real");

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const blobs = await Promise.all(chosen.map(async (p) => shrinkPhoto((await getPhoto(p.id))!)));
      const meta: ShareMeta = {
        region_id: page.region_id,
        garment_id: page.garment_id,
        occasion_id: page.occasion_id,
        month: (page.date ?? page.created_at).slice(0, 7),
        status: page.status,
        note: page.note.slice(0, 200),
        compass_label: page.compass_label && LABELS.includes(page.compass_label) ? page.compass_label : null,
        photo_kinds: chosen.map((p) => p.kind),
        photo_samples: chosen.map((p) => !!p.sample),
      };
      const r = await createShare(meta, blobs);
      updatePage(page.id, { share: r });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa tạo được link.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!page.share) return;
    setBusy(true);
    try {
      await deleteShare(page.share.id, page.share.delete_key);
      updatePage(page.id, { share: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa gỡ được link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal aria-label="Chia sẻ trang" onClick={onClose}>
      <div className="paper w-full max-w-md rounded-lg p-5 text-sm text-stone-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display m-0 text-xl text-[#27354f]">Link chia sẻ trang này</h2>
        {page.share ? (
          <>
            <p className="mt-3">Ai có link đều xem được trang này. Con gỡ lúc nào cũng được.</p>
            <div className="mt-2 flex gap-2">
              <input readOnly value={shareUrl(page.share.id)} className="min-w-0 flex-1 rounded border border-stone-300 bg-white px-2 py-1 text-xs" onFocus={(e) => e.target.select()} />
              <button
                type="button"
                className="rounded-full border border-stone-700 px-3 py-1 text-xs"
                onClick={() => navigator.clipboard?.writeText(shareUrl(page.share!.id)).then(() => setCopied(true))}
              >
                {copied ? "Đã chép ✓" : "Chép"}
              </button>
            </div>
            <div className="mt-5 flex justify-between">
              <button type="button" onClick={remove} disabled={busy} className="text-[#B5452E] underline disabled:opacity-50">
                Gỡ link (xóa khỏi máy chủ)
              </button>
              <button type="button" onClick={onClose} className="underline">
                Xong
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3">
              Trang công khai chỉ có: tháng/năm, trang phục, dịp, dòng con viết và những ảnh con chọn. Không có tên sổ, ngày cụ thể hay nơi chốn.
            </p>
            {page.photos.length > 0 && (
              <div className="mt-3 flex gap-2">
                {page.photos.map((p) => (
                  <Thumb key={p.id} photo={p} on={picked.includes(p.id)} toggle={() => setPicked((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))} />
                ))}
              </div>
            )}
            {hasReal && (
              <label className="mt-3 flex items-start gap-2 rounded bg-[#B5452E]/10 p-2 text-xs">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
                <span>Tôi hiểu ảnh thật của mình sẽ công khai cho bất kỳ ai có link, cho tới khi tôi gỡ.</span>
              </label>
            )}
            {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="underline">
                Thôi
              </button>
              <button
                type="button"
                onClick={create}
                disabled={busy || (hasReal && !agree)}
                className="rounded-full bg-[#27354f] px-5 py-1.5 text-amber-50 disabled:opacity-50"
              >
                {busy ? "Đang tạo…" : "Tạo link"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
