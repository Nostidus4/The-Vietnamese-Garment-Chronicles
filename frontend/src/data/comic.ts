// Script from the Google Doc tab "Kịch bản truyện tranh".
// Images are pre-generated with Nano Banana into /public/comic/page-N.png (no text drawn in them);
// speech bubbles below are HTML overlays so Vietnamese diacritics stay correct.

export interface Bubble {
  speaker: "Tí" | "Tèo" | "Bà" | "Cô giáo" | "Tí nhỏ" | "Sổ";
  text: string;
  x: number; // % from left
  y: number; // % from top
}

export interface ComicPageData {
  n: number;
  priority: "P0" | "P1";
  image: string;
  scene: string; // shown while the image is missing
  bubbles: Bubble[];
}

export const comicPages: ComicPageData[] = [
  {
    n: 1,
    priority: "P0",
    image: "/comic/page-1.png",
    scene: "Lớp học; cô giáo giơ poster “Ngày hội Sắc Việt”.",
    bubbles: [
      { speaker: "Cô giáo", text: "Mọi lựa chọn đều phải có lý do.", x: 8, y: 8 },
      { speaker: "Tí", text: "Chọn áo dài là xong!", x: 55, y: 50 },
      { speaker: "Tèo", text: "Tại sao lại là áo dài?", x: 12, y: 78 },
    ],
  },
  {
    n: 2,
    priority: "P0",
    image: "/comic/page-2.png",
    scene: "Hai bạn trước màn hình đầy ảnh trang phục.",
    bubbles: [
      { speaker: "Tèo", text: "Của vùng nào? Mặc dịp gì?", x: 10, y: 10 },
      { speaker: "Tí", text: "…Chắc?", x: 60, y: 40 },
      { speaker: "Tí", text: "Đồ của nước mình mà mình biết ít quá.", x: 20, y: 80 },
    ],
  },
  {
    n: 3,
    priority: "P0",
    image: "/comic/page-3.png",
    scene: "Hồi ức: bà khâu chiếc áo cổ cao bên máy may.",
    bubbles: [
      { speaker: "Tí nhỏ", text: "Áo dài hả bà?", x: 55, y: 20 },
      { speaker: "Bà", text: "Không phải cái gì dài dài cũng là áo dài đâu con.", x: 10, y: 70 },
    ],
  },
  {
    n: 4,
    priority: "P0",
    image: "/comic/page-4.png",
    scene: "Chiếc hộp dưới bàn may: áo dài xanh thiên thanh và cuốn sổ “Việt Phục Du Ký”.",
    bubbles: [
      { speaker: "Sổ", text: "Nếu một ngày con mở cuốn này, có lẽ con đã bắt đầu tò mò…", x: 10, y: 75 },
    ],
  },
  {
    n: 5,
    priority: "P1",
    image: "/comic/page-5.png",
    scene: "Ảnh bà thời trẻ mặc áo dài xanh trước máy may.",
    bubbles: [
      { speaker: "Bà", text: "Sau này bà mới hiểu, đẹp chỉ là một phần rất nhỏ.", x: 10, y: 78 },
    ],
  },
  {
    n: 6,
    priority: "P1",
    image: "/comic/page-6.png",
    scene: "Các trang sổ: Kinh Bắc, Huế, Nam Bộ, Tây Bắc; càng về cuối càng trống.",
    bubbles: [
      { speaker: "Bà", text: "Một bộ trang phục có thể kể ta biết người mặc nó đến từ đâu…", x: 8, y: 80 },
    ],
  },
  {
    n: 7,
    priority: "P1",
    image: "/comic/page-7.png",
    scene: "Bookmark thêu bản đồ Việt Nam phát sáng.",
    bubbles: [{ speaker: "Bà", text: "Nếu là con, con sẽ mặc câu chuyện này như thế nào?", x: 10, y: 80 }],
  },
  {
    n: 8,
    priority: "P1",
    image: "/comic/page-8.png",
    scene: "Gió thổi tung vải, Tí và Tèo bị cuốn vào sách.",
    bubbles: [{ speaker: "Sổ", text: "Hành trình của con bắt đầu từ đây.", x: 20, y: 85 }],
  },
];
