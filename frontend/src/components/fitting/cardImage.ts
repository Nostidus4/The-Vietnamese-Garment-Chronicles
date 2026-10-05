// The Việt phục card as a picture (PNG, 900×1350): what the Du Ký keeps and what "Tải ảnh" gives. Drawn in the
// browser from the paper doll's <svg> (or the AI picture), so nothing leaves the reader's machine.

const W = 900;
const H = 1350;

/** The doll's <svg> as an image URL, at a size fit for the card. */
export function dollImage(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", "600");
  clone.setAttribute("height", "1200");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const xml = new XMLSerializer().serializeToString(clone);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
}

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => fail(new Error("Không vẽ được ảnh của thẻ"));
    img.src = src;
  });
}

/** The family name next/font gave Patrick Hand (and Be Vietnam Pro), so the canvas writes in the same hands. */
function fontOf(className: string, fallback: string) {
  const probe = document.createElement("span");
  probe.className = className;
  document.body.appendChild(probe);
  const f = getComputedStyle(probe).fontFamily;
  probe.remove();
  return f || fallback;
}

export async function cardPicture(o: { art: string; title: string; meta: string; number: number; stamp: string; icon: string; aiNote: boolean }): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  await document.fonts?.ready;
  const hand = fontOf("font-hand", "cursive");
  const body = getComputedStyle(document.body).fontFamily || "sans-serif";

  // paper with a fine grain
  ctx.fillStyle = "#fbf6ea";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(139,107,61,0.07)";
  for (let y = 0; y < H; y += 9) for (let x = (y / 9) % 2 ? 4 : 0; x < W; x += 9) ctx.fillRect(x, y, 1.6, 1.6);

  // the picture, in a soft cream window
  const ax = 54, ay = 54, aw = W - 108, ah = 950;
  const glow = ctx.createRadialGradient(W / 2, ay + ah * 0.32, 40, W / 2, ay + ah * 0.4, ah * 0.75);
  glow.addColorStop(0, "#fbf6ea");
  glow.addColorStop(1, "#ead9b6");
  ctx.fillStyle = glow;
  ctx.fillRect(ax, ay, aw, ah);
  ctx.strokeStyle = "#d8c9a8";
  ctx.lineWidth = 2;
  ctx.strokeRect(ax, ay, aw, ah);
  const img = await load(o.art);
  const s = Math.min(aw / img.width, ah / img.height) * 0.94;
  const iw = img.width * s, ih = img.height * s;
  ctx.drawImage(img, ax + (aw - iw) / 2, ay + (ah - ih) / 2, iw, ih);
  if (o.aiNote) {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(ax + 14, ay + ah - 48, 250, 34);
    ctx.fillStyle = "#fff";
    ctx.font = `600 22px ${body}`;
    ctx.fillText("Ảnh minh họa AI", ax + 26, ay + ah - 24);
  }

  // the Compass stamp, red and a little crooked
  if (o.stamp) {
    ctx.save();
    ctx.translate(W - 150, 170);
    ctx.rotate(-0.21);
    ctx.strokeStyle = "#b5452e";
    ctx.fillStyle = "rgba(251,246,234,0.75)";
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, 82, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#b5452e";
    ctx.textAlign = "center";
    ctx.font = `700 24px ${body}`;
    ctx.fillText(o.stamp, 0, -6);
    ctx.font = `30px ${body}`;
    ctx.fillText(o.icon, 0, 34);
    ctx.restore();
  }

  // the name of the look in Bà's hand, then where and when
  ctx.textAlign = "left";
  ctx.fillStyle = "#8a4b2a";
  ctx.font = `64px ${hand}`;
  ctx.fillText(o.title, 60, 1110, W - 120);
  ctx.fillStyle = "#6b5a49";
  ctx.font = `28px ${body}`;
  ctx.fillText(o.meta, 60, 1180, W - 260);
  ctx.textAlign = "right";
  ctx.fillText(`Thẻ số ${o.number}`, W - 60, 1180);
  ctx.textAlign = "left";
  ctx.font = `24px ${body}`;
  ctx.fillStyle = "#8a6a3a";
  ctx.fillText("Tủ áo của Bà · Việt Phục Du Ký", 60, 1280);
  return canvas.toDataURL("image/png");
}
