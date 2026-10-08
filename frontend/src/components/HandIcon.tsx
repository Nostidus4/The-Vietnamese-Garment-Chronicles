// Small line icons drawn with an uneven hand-ink stroke (round caps, slightly wobbly paths) to sit beside the
// hand-drawn illustrations, instead of the system emoji, which look different on every phone (#148).

export type HandIconName = "speaker" | "book" | "dress" | "notebook" | "aodai";

const PATHS: Record<HandIconName, string[]> = {
  speaker: ["M4 9.6 L8 9.4 L12.4 5.6 L12.2 18.5 L8 14.7 L4.1 14.5 Z", "M15.6 9.2 C17.2 10.7 17.2 13.4 15.6 14.9", "M18.3 6.6 C21 9.2 21 14.8 18.4 17.5"],
  book: ["M3.6 6.2 C6.8 5.4 9.6 5.8 12 7.6 C14.4 5.8 17.2 5.4 20.4 6.2 L20.3 18.6 C17.3 17.9 14.4 18.2 12 19.8 C9.6 18.2 6.7 17.9 3.7 18.6 Z", "M12 7.6 L12 19.6"],
  dress: ["M9.3 3.6 L10.4 6.4 C11.4 7.2 12.7 7.2 13.7 6.4 L14.8 3.6", "M10.4 6.4 L9 11.2 L5.4 20.2 C9.4 21.2 14.7 21.2 18.6 20.2 L15 11.2 L13.7 6.4", "M9 11.2 L15 11.2"],
  notebook: ["M6.2 3.8 L18 4 L17.8 20.2 L6 20 Z", "M9.2 3.9 L9 20.1", "M12.2 8.6 L15.4 8.7", "M12.1 11.8 L15.2 11.9"],
  // a Vietnamese robe, not the kimono emoji (👘) nor a western dress (👗): standing collar, long sleeves, the front flap
  // crossing to the right armpit, slit at the sides from the waist, trousers under it
  aodai: [
    "M10.3 2.8 L13.7 2.8 L13.8 4.7 L10.2 4.7 Z",
    "M10.2 4.7 L7.2 5.7 L4.4 13.4 L6.1 13.8 L8.2 8.4",
    "M13.8 4.7 L16.8 5.7 L19.6 13.4 L17.9 13.8 L15.8 8.4",
    "M8.2 8.4 L8.8 12.4 L7.6 21.2 L11.9 21.2 L11.9 12.6 M15.8 8.4 L15.2 12.4 L16.4 21.2 L12.1 21.2 L12.1 12.6",
    "M12.6 4.8 C13.9 5.8 14.9 6.9 15.6 8.2",
    "M10.2 21.2 L10 22.6 M13.8 21.2 L14 22.6",
  ],
};

export function HandIcon({ name, className = "" }: { name: HandIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.3em"
      height="1.3em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={`inline-block shrink-0 align-[-0.2em] ${className}`}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
