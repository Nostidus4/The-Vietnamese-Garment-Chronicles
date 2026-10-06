import blur from "./placeholders.json";

/** A tiny blurred copy of a large picture, shown while it loads (made by `npm run images`). */
export const placeholder = (path: keyof typeof blur) => blur[path] as `data:image/${string}`;
