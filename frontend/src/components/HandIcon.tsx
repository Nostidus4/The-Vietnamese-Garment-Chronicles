// Small line icons drawn with an uneven hand-ink stroke (round caps, slightly wobbly paths) to sit beside the
// hand-drawn illustrations, instead of the system emoji, which look different on every phone (#148).

export type HandIconName = "speaker" | "book" | "dress" | "notebook" | "aodai" | "stamp" | "bowl";

const PATHS: Record<HandIconName, string[]> = {
  speaker: ["M4 9.6 L8 9.4 L12.4 5.6 L12.2 18.5 L8 14.7 L4.1 14.5 Z", "M15.6 9.2 C17.2 10.7 17.2 13.4 15.6 14.9", "M18.3 6.6 C21 9.2 21 14.8 18.4 17.5"],
  book: ["M3.6 6.2 C6.8 5.4 9.6 5.8 12 7.6 C14.4 5.8 17.2 5.4 20.4 6.2 L20.3 18.6 C17.3 17.9 14.4 18.2 12 19.8 C9.6 18.2 6.7 17.9 3.7 18.6 Z", "M12 7.6 L12 19.6"],
  dress: ["M9.3 3.6 L10.4 6.4 C11.4 7.2 12.7 7.2 13.7 6.4 L14.8 3.6", "M10.4 6.4 L9 11.2 L5.4 20.2 C9.4 21.2 14.7 21.2 18.6 20.2 L15 11.2 L13.7 6.4", "M9 11.2 L15 11.2"],
  notebook: ["M6.2 3.8 L18 4 L17.8 20.2 L6 20 Z", "M9.2 3.9 L9 20.1", "M12.2 8.6 L15.4 8.7", "M12.1 11.8 L15.2 11.9"],
  // a figure in áo dài and nón lá, not the kimono emoji (👘) nor a western dress (👗): the conical hat with its brim and
  // one ring of leaf, the standing collar, long sleeves, the front flap crossing to the right, two long panels
  aodai: [
    "M4.4 8.4 L12 2.3 L19.6 8.4",
    "M4.4 8.4 C8.7 9.9 15.3 9.9 19.6 8.4",
    "M8.6 5.6 C10.9 6.1 13.1 6.1 15.4 5.6",
    "M10.6 10 L13.4 10 L13.4 11.4 L10.6 11.4 Z",
    "M10.6 11.4 L8 12.2 L5.8 17.8 L7.2 18.2 L8.8 14.4",
    "M13.4 11.4 L16 12.2 L18.2 17.8 L16.8 18.2 L15.2 14.4",
    "M8.8 14.4 L9.2 16.5 L8.4 22.1 L11.9 22.1 L11.9 16.7 M15.2 14.4 L14.8 16.5 L15.6 22.1 L12.1 22.1 L12.1 16.7",
    "M12.4 11.5 C13.4 12.2 14.2 13 14.8 14",
  ],
  // a stamp ring with a tick: "tem", where the emoji 📮 showed a red Japanese post box
  stamp: [
    "M12 3.2 C16.9 3.2 20.8 7.1 20.8 12 C20.8 16.9 16.9 20.8 12 20.8 C7.1 20.8 3.2 16.9 3.2 12 C3.2 7.1 7.1 3.2 12 3.2 Z",
    "M12 6.2 C15.2 6.2 17.8 8.8 17.8 12 C17.8 15.2 15.2 17.8 12 17.8 C8.8 17.8 6.2 15.2 6.2 12 C6.2 8.8 8.8 6.2 12 6.2",
    "M9.2 12.3 L11.2 14.2 L14.9 9.9",
  ],
  // a bowl of rice with chopsticks: a dish of Bà's, where the emoji 🍲 was a hot pot
  bowl: [
    "M3.6 11.4 L20.4 11.4 C20 15.9 16.6 19 12 19 C7.4 19 4 15.9 3.6 11.4 Z",
    "M9.4 19 L9.8 20.8 L14.2 20.8 L14.6 19",
    "M6.8 11.2 C7.6 9.4 9.4 8.6 11 9.2 C12.4 8 14.8 8.1 16 9.5 C17 9.6 17.6 10.3 17.6 11.2",
    "M14.6 2.8 L19.4 9.8 M17.6 2.4 L21 9.2",
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
