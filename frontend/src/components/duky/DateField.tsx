"use client";

// A date typed the way Du Ký writes it, d/m/yyyy (#145): a native date field showed the browser's own format.
import { useId, useState } from "react";
import { formatDateVi, parseDateVi } from "@/lib/dateVi";

/** `value` and `onChange` speak yyyy-mm-dd (or null); `max` refuses a later day, with a reason. */
export function DateField({ value, onChange, max, maxWhy, className }: { value: string | null; onChange: (iso: string | null) => void; max?: string; maxWhy?: string; className?: string }) {
  const [text, setText] = useState(formatDateVi(value));
  const [err, setErr] = useState<string | null>(null);
  const id = useId();
  const commit = () => {
    if (!text.trim()) return setErr(null), onChange(null);
    const iso = parseDateVi(text);
    if (!iso) return setErr("Ngày chưa đúng, con viết kiểu 17/2/2026 nhé.");
    if (max && iso > max) return setErr(maxWhy ?? "Ngày này chưa tới.");
    setErr(null);
    setText(formatDateVi(iso));
    onChange(iso);
  };
  return (
    <>
      <input
        value={text}
        inputMode="numeric"
        placeholder="vd. 17/2/2026"
        onChange={(e) => setText(e.target.value.slice(0, 10))}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        aria-invalid={!!err || undefined}
        aria-describedby={err ? id : undefined}
        className={className}
      />
      {err && (
        <span id={id} role="alert" className="block text-[0.75rem] text-[#B5452E]">
          {err}
        </span>
      )}
    </>
  );
}
