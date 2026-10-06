"use client";

import Link from "next/link";
// Du Ký của con (#19): the reader's own notebook on the same sewing table as Bà's.
// Desktop: a cloth-bound book that opens like Bà's and turns like paper —
//   inside cover (name, colour, new page, cloud) · tủ tem · one page per lần mặc · "+ Trang mới".
// Phones (< 760 px): the same pages, one under the other.

import HTMLFlipBook from "react-pageflip";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { pageSize, useBookScale, useViewport } from "@/lib/bookScale";
import { byWhen, COVER_COLORS, ensureMigrated, loadBook, setCover, TAKEN_OUT, useDuKy, type DuKyBook, type DuKyPage, type TakenOut } from "@/lib/dukyBook";
import { useBootstrap } from "@/lib/useBootstrap";
import type { Bootstrap } from "@/lib/types";
import { BookCover } from "../book/BookCover";
import { NoPageTurn } from "../book/Flipbook";
import { Page } from "../book/Page";
import { BookSizeControl } from "../desk/BookSizeControl";
import { CloudSync } from "./CloudSync";
import { DuKyCover } from "./DuKyCover";
import { DuKyPageView } from "./DuKyPageView";
import { ExportCard } from "./ExportCard";
import { NewPageDialog, type NewPreset } from "./NewPageDialog";
import { ShareDialog } from "./ShareDialog";
import { StampCabinet } from "./StampCabinet";
import { asset } from "@/lib/base";
import { HAS_API } from "@/lib/api";

// where the reader is, kept across a rebuild of the book (new size or a page added)
const memo = { page: 0 };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const byDate = byWhen;

type Actions = {
  onNew: (p: NewPreset) => void;
  onExport: (p: DuKyPage) => void;
  onShare?: (p: DuKyPage) => void;
};

export default function DuKyNotebook() {
  const { data, error } = useBootstrap();
  const book = useDuKy();
  const [ready, setReady] = useState(false);
  const [creating, setCreating] = useState<NewPreset | null>(null);
  const [exporting, setExporting] = useState<DuKyPage | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null); // a page to turn to once the book is open
  const [pasted, setPasted] = useState(false); // "Đã dán vào sổ" after a new page
  const [trash, setTrash] = useState<TakenOut | null>(null); // a page just taken out, still to be undone
  useEffect(() => {
    const on = (e: Event) => setTrash((e as CustomEvent<TakenOut>).detail);
    window.addEventListener(TAKEN_OUT, on);
    return () => window.removeEventListener(TAKEN_OUT, on);
  }, []);
  // five seconds to change one's mind, then the photos leave this device too
  useEffect(() => {
    if (!trash) return;
    const t = setTimeout(() => {
      void trash.forget();
      setTrash(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [trash]);
  useEffect(() => {
    if (!pasted) return;
    const t = setTimeout(() => setPasted(false), 2500);
    return () => clearTimeout(t);
  }, [pasted]);
  const vp = useViewport();
  const portrait = vp.w < 760;

  // then /du-ky?new=worn&region=hue (from Bà's book) or ?region=hue (open on that region's newest page)
  useEffect(() => {
    if (!data) return;
    ensureMigrated(data.garments).then(() => {
      setReady(true);
      const q = new URLSearchParams(window.location.search);
      const region = q.get("region") ?? undefined;
      const want = q.get("new");
      if (want === "worn" || want === "planned") setCreating({ status: want, region });
      else if (region) {
        const last = [...loadBook().pages].filter((p) => p.region_id === region).sort(byDate).pop();
        if (last) setFocusId(last.id);
      }
      if (q.toString()) window.history.replaceState(null, "", asset("/du-ky"));
    });
  }, [data]);

  const onExportDone = useCallback((err?: string) => {
    setExporting(null);
    setExportError(err ?? null);
  }, []);

  if (error) return <p className="p-6 text-red-700">{error}</p>;
  if (!data || !ready) return <p className="font-hand p-6 text-xl text-stone-600">Đang mở sổ…</p>;

  const actions: Actions = { onNew: setCreating, onExport: setExporting, onShare: HAS_API ? (p) => setSharing(p.id) : undefined }; // a share link lives on the server (#48)
  const sharePage = book.pages.find((p) => p.id === sharing);

  return (
    <>
      {portrait ? (
        <ScrollBook data={data} book={book} actions={actions} />
      ) : (
        <DeskBook data={data} book={book} actions={actions} focusId={focusId} onFocused={() => setFocusId(null)} />
      )}
      {creating && (
        <NewPageDialog
          data={data}
          preset={creating}
          onClose={() => setCreating(null)}
          onCreated={(p) => {
            setCreating(null);
            setFocusId(p.id);
            setPasted(true);
          }}
        />
      )}
      {sharePage && <ShareDialog page={sharePage} onClose={() => setSharing(null)} />}
      {exporting && <ExportCard page={exporting} data={data} onDone={onExportDone} />}
      {(pasted || trash) && (
        <div role="status" className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/80 px-4 py-2 text-sm text-white">
          {trash ? (
            <>
              <span>Đã xóa trang.</span>
              <button
                type="button"
                onClick={() => {
                  trash.undo();
                  setTrash(null);
                }}
                className="font-semibold text-amber-200 underline"
              >
                Hoàn tác
              </button>
            </>
          ) : (
            <span>Đã dán vào sổ ✓</span>
          )}
        </div>
      )}
      {exportError && (
        <p role="alert" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-sm text-white" onClick={() => setExportError(null)}>
          {exportError}
        </p>
      )}
    </>
  );
}

/* ---------------- the pages ---------------- */

function InsideCover({ book, actions, compact = false }: { book: DuKyBook; actions: Actions; compact?: boolean }) {
  const [name, setName] = useState(book.cover.name);
  return (
    <div className="flex h-full flex-col text-[#27354f]">
      <p className="m-0 text-[0.75rem] tracking-[0.3em] text-stone-600">SỔ NÀY CỦA</p>
      <input
        value={name}
        maxLength={24}
        onChange={(e) => setName(e.target.value.slice(0, 24))}
        onBlur={() => name !== book.cover.name && setCover({ name: name.trim() })}
        placeholder="tên của con"
        aria-label="Tên trên bìa sổ"
        className="font-hand w-full border-0 border-b border-stone-400 bg-transparent text-[1.5rem] outline-none placeholder:text-stone-400"
        style={{ color: "#1f3a78" }}
      />
      {/* the cover holds 24 letters: say so while typing instead of cutting the name off silently (#63) */}
      {name.length >= 18 && <p className="m-0 text-right text-[0.75rem] text-stone-600">{name.length}/24 chữ</p>}
      <div className="mt-2 flex items-center gap-2" role="radiogroup" aria-label="Màu bìa">
        <span className="text-[0.75rem] text-stone-600">Màu bìa</span>
        {COVER_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={book.cover.color === c}
            aria-label={`Màu ${c}`}
            onClick={() => setCover({ color: c })}
            className={`h-5 w-5 rounded-full border-2 ${book.cover.color === c ? "border-[#D9A43B] ring-2 ring-[#D9A43B]/40" : "border-white/60"}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <p className="font-hand m-0 mt-4 text-[1.1rem] leading-snug text-[#8a4b2a]">
        Sổ của Bà là những nơi Bà đã đi. Sổ này là những lần con mặc.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={() => actions.onNew({ status: "planned" })} className="rounded-full bg-[#27354f] px-4 py-2 text-sm text-amber-50">
          + Chuẩn bị đi sự kiện
        </button>
        <button type="button" onClick={() => actions.onNew({ status: "worn" })} className="rounded-full border border-[#27354f] px-4 py-2 text-sm">
          + Trang đã mặc
        </button>
      </div>
      <div className="mt-auto">
        <CloudSync compact={compact} />
        <p className="m-0 mt-1 text-[0.75rem] text-stone-600">Không đăng nhập thì sổ và ảnh chỉ lưu trên máy này.</p>
      </div>
    </div>
  );
}

function LastPage({ actions, empty }: { actions: Actions; empty: boolean }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 text-center"
      style={{ backgroundImage: "repeating-linear-gradient(transparent 0 27px, rgba(90,120,170,0.16) 27px 28px)" }}
    >
      <p className="font-hand m-0 text-[1.3rem] text-[#8a4b2a]">{empty ? "Trang đầu tiên của con đang chờ." : "Lần mặc tiếp theo?"}</p>
      <button type="button" onClick={() => actions.onNew({ status: "planned" })} className="rounded-full bg-[#27354f] px-4 py-2 text-sm text-amber-50">
        + Chuẩn bị đi sự kiện
      </button>
      <button type="button" onClick={() => actions.onNew({ status: "worn" })} className="rounded-full border border-[#27354f] px-4 py-2 text-sm text-[#27354f]">
        + Trang đã mặc
      </button>
      <Link href="/" className="mt-2 text-xs text-stone-600 underline">
        hoặc mở sổ của Bà, chọn một vùng rồi mặc thử
      </Link>
    </div>
  );
}

/* ---------------- desktop: the notebook on the table ---------------- */

type Phase = "closed" | "opening" | "open" | "closing";

function DeskBook({
  data,
  book,
  actions,
  focusId,
  onFocused,
}: {
  data: Bootstrap;
  book: DuKyBook;
  actions: Actions;
  focusId: string | null;
  onFocused: () => void;
}) {
  const reduced = !!useReducedMotion();
  const size = pageSize(useViewport(), useBookScale()[0]);
  const [phase, setPhase] = useState<Phase>("closed");
  const bookRef = useRef<HTMLDivElement>(null);
  const rot = useMotionValue(0);
  const frontLight = useTransform(rot, [0, -90], ["brightness(1)", "brightness(0.55)"]);
  const backLight = useTransform(rot, [-90, -180], ["brightness(0.6)", "brightness(1)"]);
  const pages = [...book.pages].sort(byDate);

  async function open() {
    if (phase !== "closed") return;
    setPhase("opening");
    if (!reduced && bookRef.current) {
      await Promise.all([
        animate(bookRef.current, { x: size.w / 2 }, { duration: 0.7, ease: [0.65, 0, 0.35, 1] }),
        animate(rot, -180, { duration: 1.3, delay: 0.25, ease: [0.55, 0.02, 0.22, 1] }),
      ]);
      await sleep(80);
    } else rot.set(-180);
    setPhase("open");
  }
  async function close() {
    if (phase !== "open") return;
    setPhase("closing");
    memo.page = 0;
    if (!reduced && bookRef.current) {
      await sleep(30);
      await Promise.all([
        animate(rot, 0, { duration: 1.2, ease: [0.55, 0.02, 0.22, 1] }),
        animate(bookRef.current, { x: 0 }, { duration: 0.65, delay: 0.8, ease: [0.65, 0, 0.35, 1] }),
      ]);
    } else {
      rot.set(0);
      if (bookRef.current) bookRef.current.style.transform = "none";
    }
    setPhase("closed");
  }

  // a page to show (just created, or asked for from Bà's book): open the book on its spread. An open book is turned
  // there by DuKyFlip: a page made with a photo built the book before the photo was in, on the old spread (#63)
  const focusAt = focusId ? pages.findIndex((p) => p.id === focusId) : -1;
  const focusPage = focusAt < 0 ? null : focusAt + 2 - ((focusAt + 2) % 2);
  useEffect(() => {
    if (!focusId) return;
    const i = pages.findIndex((p) => p.id === focusId);
    if (i < 0) return;
    memo.page = (i + 2) - ((i + 2) % 2);
    onFocused();
    if (phase === "closed") setTimeout(open, 60);
  });

  useEffect(() => {
    if (phase !== "closed") return;
    const onKey = (e: KeyboardEvent) => (e.key === "ArrowRight" || e.key === "Enter") && !(e.target instanceof HTMLInputElement) && open();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const shown = phase === "open";
  return (
    <main className="desk fixed inset-0 overflow-hidden">
      <BookSizeControl />
      <Image src={asset("/page/Desk.webp")} alt="" fill priority quality={88} sizes="100vw" className="desk-bg object-cover" />
      <div className="desk-light pointer-events-none absolute inset-0" aria-hidden />

      {/* Bà's notebook, closed in the corner: back to her book */}
      <Link href="/"
        className="group absolute bottom-[7%] left-[3%] z-10 block w-[9vw] min-w-[96px] max-w-[150px] rotate-[-9deg] transition-transform hover:-translate-y-1 hover:rotate-[-6deg]"
      >
        <div className="relative aspect-[1086/1448] shadow-[10px_16px_22px_rgba(20,8,0,0.55)]">
          <BookCover sizes="150px" />
        </div>
        <span className="font-hand mt-2 block text-center text-[#F3EAD7]/85 group-hover:text-[#F3EAD7]">Sổ của Bà</span>
      </Link>

      {/* the real flipbook, built under the desk copy and shown once the cover has landed */}
      {phase !== "closed" && (
        <div className={`absolute inset-0 flex items-center justify-center ${shown ? "" : "pointer-events-none opacity-0"}`} aria-hidden={!shown}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-1/2">
              <div className="book-shadow absolute inset-[1.5%]" />
            </div>
            <div className="absolute inset-y-0 right-0 w-1/2">
              <div className="book-shadow absolute inset-[1.5%]" />
            </div>
            <DuKyFlip data={data} book={book} pages={pages} size={size} actions={actions} active={shown} onClose={close} focusPage={focusPage} />
          </div>
        </div>
      )}

      {/* the desk copy: the closed cloth book; its cover swings open over the same first spread */}
      <div className={`absolute inset-0 flex items-center justify-center ${shown ? "pointer-events-none invisible" : ""}`} aria-hidden={shown}>
        <motion.div
          className="relative"
          style={{ width: size.w, height: size.h }}
          initial={reduced ? { opacity: 0 } : { y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div ref={bookRef} className="book-pages absolute inset-0 [perspective:2600px]">
            <div className="book-shadow absolute inset-[1.5%]" />
            <div className="paper --right absolute inset-0 overflow-hidden p-[7%]">
              <StampCabinet data={data} book={book} />
            </div>
            <motion.div
              className={`absolute inset-0 origin-left [transform-style:preserve-3d] ${phase === "closed" ? "cursor-pointer" : ""}`}
              style={{ rotateY: rot }}
              whileHover={phase === "closed" && !reduced ? { y: -5 } : undefined}
              onClick={open}
              // a button only while closed, named by what is printed on the cover; open, it is the page under the
              // reader's hands, with its own buttons (#58)
              role={phase === "closed" ? "button" : undefined}
              tabIndex={phase === "closed" ? 0 : undefined}
            >
              <motion.div className="absolute inset-0 [backface-visibility:hidden]" style={{ filter: frontLight }}>
                <DuKyCover name={book.cover.name} color={book.cover.color} />
              </motion.div>
              <motion.div
                className="paper --left absolute inset-0 overflow-hidden p-[7%] [backface-visibility:hidden] [transform:rotateY(180deg)]"
                style={{ filter: backLight }}
                inert={phase !== "open"}
              >
                <InsideCover book={book} actions={actions} />
              </motion.div>
            </motion.div>
          </div>
          {phase === "closed" && (
            <p className="font-hand absolute -bottom-14 left-0 right-0 text-center text-xl text-[#F3EAD7]/85">
              {book.pages.length ? `${book.pages.length} lần mặc · bấm để mở` : "Bấm để mở sổ của con"}
            </p>
          )}
        </motion.div>
      </div>
    </main>
  );
}

function DuKyFlip({
  data,
  book,
  pages,
  size,
  actions,
  active,
  onClose,
  focusPage,
}: {
  focusPage: number | null;
  data: Bootstrap;
  book: DuKyBook;
  pages: DuKyPage[];
  size: { w: number; h: number };
  actions: Actions;
  active: boolean;
  onClose: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pageflip ships no type for its instance
  const ref = useRef<any>(null);
  const sheets: { key: string; node: ReactNode; still?: boolean }[] = [
    { key: "inside", node: <InsideCover book={book} actions={actions} compact />, still: true },
    { key: "stamps", node: <StampCabinet data={data} book={book} /> },
    ...pages.map((p) => ({ key: p.id, node: <DuKyPageView page={p} data={data} compact onExport={actions.onExport} onShare={actions.onShare} />, still: true })),
    { key: "last", node: <LastPage actions={actions} empty={pages.length === 0} />, still: true },
  ];
  if (sheets.length % 2) sheets.push({ key: "blank", node: null });
  const n = sheets.length;
  const [page, setPage] = useState(Math.min(memo.page, n - 2));
  useEffect(() => {
    memo.page = page;
  }, [page]);
  const atStart = page < 2;
  const atEnd = page + 2 >= n;
  const prev = () => (atStart ? onClose() : ref.current?.pageFlip()?.flipPrev("bottom"));
  const next = () => !atEnd && ref.current?.pageFlip()?.flipNext("bottom");
  const turnTo = (to: number) => ref.current?.pageFlip()?.turnToPage(to - (to % 2));
  useEffect(() => {
    if (focusPage === null) return;
    // after the book has (re)built itself on its old spread; not cancelled when the focus is cleared a moment later
    setTimeout(() => ref.current?.pageFlip()?.flip(Math.min(focusPage, n - 2), "bottom"), 120);
  }, [focusPage, n]);

  const keys = useRef({ prev, next, active });
  useEffect(() => {
    keys.current = { prev, next, active };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!keys.current.active || (e.target instanceof HTMLElement && e.target.closest("input, textarea, select"))) return;
      if (e.key === "ArrowRight") keys.current.next();
      if (e.key === "ArrowLeft") keys.current.prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tabs = [
    { label: "Tủ tem", page: 1 },
    ...(pages.length ? [{ label: "Các lần mặc", page: 2 }] : []),
    { label: "Trang mới", page: 2 + pages.length },
  ];
  return (
    <div className="relative">
      <HTMLFlipBook
        // page-flip keeps the pages it was given: a new size or a new page builds a new book on the same spread
        key={`${size.w}x${size.h}-${n}-${pages.map((p) => p.id.slice(0, 4)).join("")}`}
        ref={ref}
        width={size.w}
        height={size.h}
        size="fixed"
        minWidth={size.w}
        maxWidth={size.w}
        minHeight={size.h}
        maxHeight={size.h}
        startPage={Math.min(memo.page, n - 2)}
        drawShadow
        flippingTime={900}
        usePortrait={false}
        startZIndex={0}
        autoSize={false}
        maxShadowOpacity={0.35}
        showCover={false}
        mobileScrollSupport
        clickEventForward
        useMouseEvents
        swipeDistance={30}
        showPageCorners
        disableFlipByClick
        onFlip={(e: { data: number }) => setPage(e.data)}
        className="book-open book-pages select-none"
        style={{}}
      >
        {sheets.map((s) => (
          <Page key={s.key} className="relative flex flex-col overflow-hidden p-[7%]">
            {s.still ? <NoPageTurn>{s.node}</NoPageTurn> : s.node}
          </Page>
        ))}
      </HTMLFlipBook>

      <div className="absolute left-full top-[8%] flex flex-col gap-1.5" role="tablist" aria-label="Đánh dấu trang">
        {tabs.map((t, i) => {
          const on = page === t.page - (t.page % 2);
          return (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => turnTo(t.page)}
              className="font-hand whitespace-nowrap rounded-r-md py-1 pl-2 pr-3 text-left text-[0.85rem] text-amber-50 shadow-[2px_2px_5px_rgba(0,0,0,0.3)] transition-transform"
              style={{ background: ["#B5452E", "#D9A43B", "#2F4A6D"][i % 3], transform: `translateX(${on ? 0 : -6}px)` }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="absolute left-0 right-0 top-full mt-5 flex items-center justify-center gap-6">
        <button type="button" className="page-turn" onClick={prev} aria-label={atStart ? "Gấp sổ lại" : "Trang trước"}>
          <span aria-hidden>‹</span> {atStart ? "Gấp sổ" : "Trang trước"}
        </button>
        <button type="button" className="page-turn" onClick={next} disabled={atEnd} aria-label="Trang sau">
          Trang sau <span aria-hidden>›</span>
        </button>
      </div>
    </div>
  );
}

/* ---------------- phones: one page under the other ---------------- */

function ScrollBook({ data, book, actions }: { data: Bootstrap; book: DuKyBook; actions: Actions }) {
  const pages = [...book.pages].sort(byDate); // the same order as the book on a computer: a notebook, not a feed (#57)
  const card = "paper rounded-md p-5 shadow-[0_8px_20px_rgba(20,8,0,0.35)]";
  // a page just written goes to the end: take the reader there
  const count = useRef(pages.length);
  const newest = pages.at(-1)?.id;
  useEffect(() => {
    if (pages.length > count.current && newest) document.getElementById(`page-${newest}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    count.current = pages.length;
  }, [pages.length, newest]);
  return (
    <main className="desk min-h-screen px-4 pb-16 pt-4">
      <div className="relative mx-auto aspect-[3/4] w-[62%] max-w-[260px] shadow-[10px_16px_24px_rgba(20,8,0,0.5)]">
        <DuKyCover name={book.cover.name} color={book.cover.color} />
      </div>
      <div className="mx-auto mt-6 flex max-w-md flex-col gap-5">
        <section className={card}>
          <InsideCover book={book} actions={actions} />
        </section>
        <section className={`${card} min-h-[20rem]`}>
          <StampCabinet data={data} book={book} />
        </section>
        {pages.map((p) => (
          <section key={p.id} id={`page-${p.id}`} className={card}>
            <DuKyPageView page={p} data={data} onExport={actions.onExport} onShare={actions.onShare} />
          </section>
        ))}
        <section className={`${card} h-72`}>
          <LastPage actions={actions} empty={pages.length === 0} />
        </section>
        <Link href="/" className="font-hand text-center text-lg text-[#F3EAD7]/85 underline">
          ‹ Về sổ của Bà
        </Link>
      </div>
    </main>
  );
}
