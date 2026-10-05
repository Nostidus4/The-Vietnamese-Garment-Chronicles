// What a reader sees when something fails (#63): our own messages are already in Bà's or Tèo's words and pass
// through; anything else ("Failed to fetch", "Failed to execute 'createImageBitmap'…", a bare "Lỗi 500") becomes a
// sentence a reader understands, with the caller's words for what did not work.

/** A reader-facing sentence for an error; `fallback` says what failed, e.g. "Chưa tạo được link, con thử lại nhé." */
export function friendlyError(e: unknown, fallback: string): string {
  // fetch() rejects with a TypeError when the network is down or the server cannot be reached
  if (e instanceof TypeError) return "Mạng đang chập chờn nên chưa làm được, con thử lại sau chút nhé.";
  const msg = e instanceof Error ? e.message.trim() : "";
  if (/^Lỗi 5\d\d$/.test(msg)) return "Máy chủ đang bận, con thử lại sau chút nhé.";
  if (/^Lỗi \d+$/.test(msg)) return fallback;
  // our messages are Vietnamese; a message with no Vietnamese letter came from a browser or a library
  return msg && /[^\x00-\x7F]/.test(msg) ? msg : fallback;
}
