"use client";

// Optional cloud copy of the Du Ký (#28). Without signing in everything stays on this device, as before.
// Sign in = a magic link by email (Supabase Auth, no password). The copy is private to the reader (see
// backend/supabase/duky.sql): the book in duky_books, the photos in the private bucket duky-photos/<user id>/.

import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { getPhoto, loadBook, putPhoto, saveBook, type DuKyBook } from "@/lib/dukyBook";
import { createClient } from "@/utils/supabase/client";
import { asset } from "@/lib/base";
import { friendlyError } from "@/lib/errors";
import { mergeBooks } from "@/lib/dukyMerge";

const BUCKET = "duky-photos";
const configured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export function CloudSync({ compact = false }: { compact?: boolean }) {
  const sb = useMemo(() => (configured ? createClient() : null), []);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null); // when the cloud copy was last written (#80)
  const [wiping, setWiping] = useState(false); // the second press of "Xóa dữ liệu trên mây"

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [sb]);
  const uid = session?.user.id;
  useEffect(() => {
    if (!sb || !uid) return;
    sb.from("duky_books")
      .select("updated_at")
      .eq("user_id", uid)
      .maybeSingle()
      .then(({ data }) => setSavedAt((data?.updated_at as string | undefined) ?? null));
  }, [sb, uid]);

  if (!sb) return null;

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg(await fn());
    } catch (e) {
      setMsg(friendlyError(e, "Chưa làm được, con thử lại nhé."));
    } finally {
      setBusy(false);
    }
  };

  const signIn = () =>
    run(async () => {
      const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}${asset("/du-ky")}` } });
      if (error) throw error;
      return "Đã gửi link đăng nhập, con mở email để bấm vào nhé.";
    });

  const upload = () =>
    run(async () => {
      const uid = session!.user.id;
      const book = loadBook();
      const { data: have } = await sb.storage.from(BUCKET).list(uid, { limit: 1000 });
      const there = new Set((have ?? []).map((f) => f.name));
      for (const ph of book.pages.flatMap((p) => p.photos)) {
        if (there.has(ph.id)) continue;
        const blob = await getPhoto(ph.id);
        if (!blob) continue;
        const { error } = await sb.storage.from(BUCKET).upload(`${uid}/${ph.id}`, blob, { contentType: blob.type || "image/jpeg", upsert: true });
        if (error) throw error;
      }
      const at = new Date().toISOString();
      const { error } = await sb.from("duky_books").upsert({ user_id: uid, data: book, updated_at: at });
      if (error) throw error;
      setSavedAt(at);
      return `Đã lưu ${book.pages.length} trang lên mây.`;
    });

  const download = () =>
    run(async () => {
      const uid = session!.user.id;
      const { data, error } = await sb.from("duky_books").select("data").eq("user_id", uid).maybeSingle();
      if (error) throw error;
      if (!data) return "Trên mây chưa có sổ nào.";
      // put together with the book on this device, never instead of it: nothing written here is lost
      const here = loadBook();
      const book = mergeBooks(here, data.data as DuKyBook);
      const added = book.pages.length - here.pages.length;
      for (const ph of book.pages.flatMap((p) => p.photos)) {
        if (await getPhoto(ph.id)) continue;
        const { data: blob } = await sb.storage.from(BUCKET).download(`${uid}/${ph.id}`);
        if (blob) await putPhoto(ph.id, blob);
      }
      saveBook(book);
      return added > 0 ? `Đã thêm ${added} trang từ mây vào sổ.` : "Sổ trên máy đã có đủ các trang trên mây.";
    });

  const wipe = () =>
    run(async () => {
      setWiping(false);
      const uid = session!.user.id;
      const { data: files } = await sb.storage.from(BUCKET).list(uid, { limit: 1000 });
      if (files?.length) await sb.storage.from(BUCKET).remove(files.map((f) => `${uid}/${f.name}`));
      const { error } = await sb.from("duky_books").delete().eq("user_id", uid);
      if (error) throw error;
      setSavedAt(null);
      return "Đã xóa dữ liệu trên mây.";
    });

  const btn = "rounded-full border border-stone-600 px-3 py-1 text-[0.72rem] disabled:opacity-50";
  return (
    <div className={`rounded-md bg-white/40 p-2 text-[0.72rem] text-stone-700 ${compact ? "" : "mt-3"}`}>
      {session ? (
        <>
          <p className="m-0">Đang lưu cho {session.user.email}</p>
          <p className="m-0 text-stone-500">
            {savedAt ? `Lần lưu lên mây gần nhất: ${new Date(savedAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "numeric" })}` : "Chưa lưu lên mây lần nào."}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <button type="button" disabled={busy} onClick={upload} className={btn}>
              Lưu sổ lên mây
            </button>
            <button type="button" disabled={busy} onClick={download} className={btn} title="Gộp các trang trên mây vào sổ trên máy này">
              Lấy trang từ mây về
            </button>
            {/* asked on the button itself: press again to delete, the book on this device stays */}
            <button
              type="button"
              disabled={busy}
              onClick={() => (wiping ? wipe() : setWiping(true))}
              onBlur={() => setWiping(false)}
              className={`${btn} border-[#B5452E] ${wiping ? "bg-[#B5452E] text-amber-50" : "text-[#B5452E]"}`}
            >
              {wiping ? "Bấm lần nữa để xóa hẳn trên mây" : "Xóa dữ liệu trên mây"}
            </button>
            <button type="button" onClick={() => sb.auth.signOut()} className="underline">
              Đăng xuất
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            signIn();
          }}
        >
          <p className="m-0">Muốn giữ sổ khi đổi máy? Đăng nhập bằng email (không cần mật khẩu).</p>
          <div className="mt-1.5 flex gap-1.5">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email của con"
              className="min-w-0 flex-1 rounded border border-stone-300 bg-white/80 px-2 py-1"
            />
            <button type="submit" disabled={busy} className={btn}>
              Gửi link
            </button>
          </div>
        </form>
      )}
      {msg && <p className="m-0 mt-1 text-[#8a4b2a]">{msg}</p>}
    </div>
  );
}
