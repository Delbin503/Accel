import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface TruncatedTextProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "title"> {
  /** Plain-string content — rendered as the text and used as the tooltip label. */
  text?: string;
  /** Explicit tooltip label. Use together with `children` when the content is rich JSX. */
  title?: string;
  /** Rich content (e.g. text with an inline mono span). Provide `title` for the tooltip. */
  children?: React.ReactNode;
}

/**
 * Text that ellipsis-truncates when its container runs out of space and reveals
 * the full string in a tooltip on hover — but only when it is actually clipped,
 * so short titles get no superfluous tooltip.
 *
 * - Single-line by default. Pass a `line-clamp-*` class to clamp to multiple lines.
 * - Pass `text` for a plain string, or `children` + `title` to keep inline markup.
 */
export function TruncatedText({ text, title, children, className, ...props }: TruncatedTextProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = React.useState(false);
  const hasLineClamp = /\bline-clamp-/.test(className ?? "");

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setIsTruncated(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, title]);

  const node = (
    <span ref={ref} className={cn(!hasLineClamp && "block truncate", className)} {...props}>
      {children ?? text}
    </span>
  );

  if (!isTruncated) return node;

  const tip = title ?? text ?? ref.current?.textContent ?? "";
  return (
    <Tooltip>
      <TooltipTrigger asChild>{node}</TooltipTrigger>
      <TooltipContent className="max-w-xs">{tip}</TooltipContent>
    </Tooltip>
  );
}
