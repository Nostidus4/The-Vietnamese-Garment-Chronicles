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

const BUCKET = "duky-photos";
const configured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export function CloudSync({ compact = false }: { compact?: boolean }) {
  const sb = useMemo(() => (configured ? createClient() : null), []);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [sb]);

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
      const { error } = await sb.from("duky_books").upsert({ user_id: uid, data: book, updated_at: new Date().toISOString() });
      if (error) throw error;
      return `Đã lưu ${book.pages.length} trang lên mây.`;
    });

  const download = () =>
    run(async () => {
      const uid = session!.user.id;
      const { data, error } = await sb.from("duky_books").select("data").eq("user_id", uid).maybeSingle();
      if (error) throw error;
      if (!data) return "Trên mây chưa có sổ nào.";
      const book = data.data as DuKyBook;
      if (loadBook().pages.length && !window.confirm("Thay sổ trên máy này bằng sổ trên mây?")) return "Đã giữ nguyên sổ trên máy.";
      for (const ph of book.pages.flatMap((p) => p.photos)) {
        if (await getPhoto(ph.id)) continue;
        const { data: blob } = await sb.storage.from(BUCKET).download(`${uid}/${ph.id}`);
        if (blob) await putPhoto(ph.id, blob);
      }
      saveBook(book);
      return `Đã tải về ${book.pages.length} trang.`;
    });

  const wipe = () =>
    run(async () => {
      if (!window.confirm("Xóa hẳn sổ và ảnh trên mây? Sổ trên máy này vẫn giữ nguyên.")) return "Chưa xóa gì.";
      const uid = session!.user.id;
      const { data: files } = await sb.storage.from(BUCKET).list(uid, { limit: 1000 });
      if (files?.length) await sb.storage.from(BUCKET).remove(files.map((f) => `${uid}/${f.name}`));
      const { error } = await sb.from("duky_books").delete().eq("user_id", uid);
      if (error) throw error;
      return "Đã xóa dữ liệu trên mây.";
    });

  const btn = "rounded-full border border-stone-600 px-3 py-1 text-[0.72rem] disabled:opacity-50";
  return (
    <div className={`rounded-md bg-white/40 p-2 text-[0.72rem] text-stone-700 ${compact ? "" : "mt-3"}`}>
      {session ? (
        <>
          <p className="m-0">Đang lưu cho {session.user.email}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <button type="button" disabled={busy} onClick={upload} className={btn}>
              Lưu sổ lên mây
            </button>
            <button type="button" disabled={busy} onClick={download} className={btn}>
              Tải sổ về
            </button>
            <button type="button" disabled={busy} onClick={wipe} className={`${btn} border-[#B5452E] text-[#B5452E]`}>
              Xóa dữ liệu trên mây
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
