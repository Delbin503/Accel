import * as React from "react";
import { cn } from "@/lib/utils";

/* ─── Root ─────────────────────────────────────────────────────────────── */

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function PageHeader({ children, className, ...props }: PageHeaderProps) {
  return (
    <div
      className={cn("flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─── Left column ───────────────────────────────────────────────────────── */

function PageHeaderContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)} {...props}>
      {children}
    </div>
  );
}

/* ─── Title ─────────────────────────────────────────────────────────────── */

function PageHeaderTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn("text-xl font-semibold tracking-tight text-foreground", className)}
      {...props}
    >
      {children}
    </h1>
  );
}

/* ─── Description ───────────────────────────────────────────────────────── */

function PageHeaderDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

/* ─── Actions (right slot) ──────────────────────────────────────────────── */

function PageHeaderActions({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex shrink-0 items-center gap-2 pt-0.5 sm:pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─── Meta row (breadcrumbs, tags, timestamps) ──────────────────────────── */

function PageHeaderMeta({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2 text-xs text-muted-foreground", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─── Named exports ─────────────────────────────────────────────────────── */

PageHeader.Content = PageHeaderContent;
PageHeader.Title = PageHeaderTitle;
PageHeader.Description = PageHeaderDescription;
PageHeader.Actions = PageHeaderActions;
PageHeader.Meta = PageHeaderMeta;

export {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderActions,
  PageHeaderMeta,
};
