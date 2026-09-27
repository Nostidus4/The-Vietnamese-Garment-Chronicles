import { forwardRef, type ReactNode } from "react";

// react-pageflip needs every page to forward its ref to a DOM node.
// It also rewrites the outer node's display/size, so layout classes go on the inner div.
export const Page = forwardRef<HTMLDivElement, { children: ReactNode; className?: string; bare?: boolean; hard?: boolean; onClick?: () => void; label?: string }>(function Page(
  { children, className = "", bare = false, hard = false, onClick, label },
  ref,
) {
  return (
    <div ref={ref} className={bare ? "overflow-hidden" : "paper overflow-hidden"} data-density={hard ? "hard" : "soft"}>
      <div
        className={`h-full w-full ${className}`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        aria-label={label}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      >
        {children}
      </div>
    </div>
  );
});
