import Link from "next/link";
import type { CSSProperties } from "react";
import { asset } from "@/lib/base";
import { WHO_BACKDROP, WHO_BOX, WhoChoices } from "../fitting/WhoChoices";

// What /chapter/<region> shows before its JavaScript and bootstrap.json have arrived. It is in the static HTML, so a
// phone on a slow line sees the room, its place and the header at once instead of "Đang lật trang…" (#120); the
// room then fills in under the same header. No hooks: the page renders it on the server and ChapterView while loading.

/**
 * The room's backdrop (a closed room is darker, LockedRoom), as the variables .fitting draws from: an upright phone
 * takes the strip of the room it shows (scripts/optimize-images.mjs, #120). A url() in an unused variable is not fetched.
 */
export const roomStyle = (locked = false) =>
  ({
    "--room-shade": locked
      ? "linear-gradient(rgba(20,12,7,0.6), rgba(20,12,7,0.3) 26%, rgba(20,12,7,0.3) 70%, rgba(20,12,7,0.85))"
      : "linear-gradient(rgba(20,12,7,0.55), rgba(20,12,7,0.12) 26%, rgba(20,12,7,0.12) 70%, rgba(20,12,7,0.8))",
    "--room": `url(${asset("/page/fitting-room.webp")})`,
    "--room-strip": `url(${asset("/page/fitting-room-portrait.webp")})`,
  }) as CSSProperties;

/** Where ChapterView keeps who wears and the last look. */
export const WARDROBE_KEY = "vpdk-wardrobe";

// Runs while the static HTML is read, before the first paint: a reader who has already said who wears (or who comes in
// through "Đi dự sự kiện", asked that first) never sees the static "Ai mặc?".
const KNOWN_SCRIPT = `try{var w=JSON.parse(localStorage.getItem("${WARDROBE_KEY}")||"null");if((w&&w.who)||new URLSearchParams(location.search).get("entry")==="event")document.documentElement.dataset.whoKnown="1"}catch(e){}`;

// `ask`: only in the static HTML (the page's Suspense fallback). A first visit then sees "Ai mặc?" with the room, not
// seconds later once the JavaScript has run; ChapterView opens the same box without animation in its place.
export function RoomShell({ regionId, place, locked = false, ask = false }: { regionId: string; place?: string; locked?: boolean; ask?: boolean }) {
  return (
    // no Desk.webp layer under the room: the browser downloads every layer, even one covered (#120); .fitting has a colour
    <main className="fitting" style={roomStyle(locked)} aria-busy>
      <header className="fitting-head">
        <Link href={locked ? "/" : `/?region=${regionId}&page=wear`} className="page-turn shrink-0 !text-[0.95rem]" aria-label={locked ? "Về bản đồ" : "Về trang Mặc"}>
          ‹ <span className="hidden sm:inline">{locked ? "Về bản đồ" : "Về trang Mặc"}</span>
        </Link>
        <div className="min-w-0 text-center">
          <p className="m-0 text-[0.75rem] uppercase tracking-[0.18em] text-amber-100/80 sm:tracking-[0.3em]">
            Tủ áo của Bà {place && <span className="whitespace-nowrap">· {place}</span>}
          </p>
          <h1 className="font-hand m-0 truncate text-[1.7rem] leading-tight text-amber-50">Đang mở tủ áo…</h1>
        </div>
        {/* keeps the title where the room's own buttons (LockedRoom: its spacer) will put it */}
        {locked ? (
          <span className="w-11 shrink-0" aria-hidden />
        ) : (
          <div className="invisible flex shrink-0 gap-2" aria-hidden>
            <span className="page-turn !text-[0.95rem]">📖</span>
            <span className="page-turn !text-[0.95rem]">📌</span>
          </div>
        )}
      </header>
      {ask && !locked && (
        <>
          <script dangerouslySetInnerHTML={{ __html: KNOWN_SCRIPT }} />
          <div className={`who-static ${WHO_BACKDROP}`} role="dialog" aria-modal="true" aria-label="Ai mặc?">
            <div className={WHO_BOX}>
              <WhoChoices value={null} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
