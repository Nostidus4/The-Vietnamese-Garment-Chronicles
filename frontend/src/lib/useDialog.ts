"use client";

// Every dialog of the app behaves the same with a keyboard (#58): when it opens the focus goes inside it, Tab and
// Shift+Tab go round inside it and never reach the page behind, Esc closes it, and when it closes the focus goes back
// to the button that opened it. Put the returned ref on the dialog's box.

import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// open dialogs, the newest last: only the one on top listens (a note of Tèo's opened inside the side sheet)
const stack: HTMLElement[] = [];

function focusables(el: HTMLElement): HTMLElement[] {
  return [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.getClientRects().length > 0 && !x.closest("[inert]"));
}

/** `onClose` runs on Esc (leave it out for a dialog that must be answered); `open` lets a kept-mounted dialog sleep. */
export function useDialog<T extends HTMLElement>(onClose?: () => void, open = true) {
  const ref = useRef<T>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // the dialog's own choice first ([data-autofocus]), else its first control, else the box itself
    const first = el.querySelector<HTMLElement>("[data-autofocus]") ?? focusables(el)[0];
    if (!first && !el.hasAttribute("tabindex")) el.tabIndex = -1;
    (first ?? el).focus({ preventScroll: true });

    stack.push(el);
    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== el) return;
      if (e.key === "Escape" && close.current) {
        // before the page's own Esc (leave the chapter, skip the opening) hears it
        e.stopPropagation();
        close.current();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables(el);
      if (!list.length) return e.preventDefault();
      const [a, z] = [list[0], list[list.length - 1]];
      const at = document.activeElement;
      if (!el.contains(at)) {
        e.preventDefault();
        a.focus();
      } else if (e.shiftKey && at === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && at === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      stack.splice(stack.indexOf(el), 1);
      if (before?.isConnected) before.focus({ preventScroll: true });
    };
  }, [open]);

  return ref;
}
