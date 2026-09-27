import { forwardRef, type ReactNode } from "react";

// react-pageflip needs every page to forward its ref to a DOM node.
// It also rewrites the outer node's display/size, so layout classes go on the inner div.
export const Page = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(function Page(
  { children, className = "" },
  ref,
) {
  return (
    <div ref={ref} className="paper overflow-hidden">
      <div className={`h-full w-full ${className}`}>{children}</div>
    </div>
  );
});
