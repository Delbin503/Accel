import * as React from "react";
import { AlertCircle, Boxes, ChevronDown, Plus, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Dev-only forced states for the State Tester (prototype-only). */
export type ForcedState = "normal" | "loading" | "empty" | "noresults" | "error";

/* Two-pane shell that mirrors the real Model Management layout (380px models
   list + flexible detail panel) so empty / no-results / error keep the same
   structure instead of collapsing to a single panel. The list controls are
   static here — the live ones live on the real page (Populated state). */
function PaneShell({
  modelsLabel,
  searchValue = "",
  left,
  right,
}: {
  modelsLabel: string;
  searchValue?: string;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[600px] gap-4">
      {/* Left — models list */}
      <div className="flex w-[380px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex-shrink-0 border-b border-border px-4 py-4">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Models</p>
            <p className="text-sm text-muted-foreground">{modelsLabel}</p>
          </div>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchValue} readOnly placeholder="Search model" className="h-9 pl-9 text-base" />
          </div>
          <button
            disabled
            className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-base text-muted-foreground"
          >
            All tags
            <ChevronDown className="size-3.5 flex-shrink-0 text-muted-foreground" />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto p-3">{left}</div>
      </div>
      {/* Right — detail */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">{right}</div>
    </div>
  );
}

/** Right-panel placeholder identical to the real EmptyDetailState. */
function SelectModelPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="flex size-14 items-center justify-center rounded-full border border-dashed border-border">
        <Plus className="size-6" />
      </div>
      <p className="text-base">Select a model to configure</p>
    </div>
  );
}

/** Skeleton mirroring the Model Management two-pane layout (models list + detail). */
export function ModelSkeleton() {
  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[600px] gap-4">
      <div className="flex w-[380px] flex-shrink-0 flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="size-10 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-4">
          <div className="animate-pulse rounded-xl bg-muted" />
          <div className="animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <PaneShell
      modelsLabel="—"
      left={
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <AlertCircle className="size-6 text-sev-critical" />
          <p className="text-sm">Couldn't load.</p>
        </div>
      }
      right={
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
          <AlertCircle className="size-8 text-sev-critical" />
          <p className="text-sm text-foreground">Couldn't load detection models.</p>
          <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
        </div>
      }
    />
  );
}

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <PaneShell
      modelsLabel="0 models configured"
      left={
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <Boxes className="size-8 opacity-20" />
          <p className="text-sm">No models yet.</p>
        </div>
      }
      right={
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
          <Boxes className="size-10 opacity-30" />
          <p className="text-sm font-medium text-foreground">No models yet</p>
          <p className="text-[12px]">Create a model to upload files and build a verification sequence.</p>
          <Button size="sm" className="mt-1" onClick={onCreate}>Add New Model</Button>
        </div>
      }
    />
  );
}

export function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <PaneShell
      modelsLabel="0 of 3 models"
      searchValue="armoury-zzz"
      left={
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <SearchX className="size-8 opacity-30" />
          <p className="text-center text-sm font-medium text-foreground">No models match your filters</p>
          <p className="px-4 text-center text-[12px]">Try a different search term or clear the active tag filters.</p>
          <Button variant="outline" size="sm" className="mt-1" onClick={onClear}>Clear filters</Button>
        </div>
      }
      right={<SelectModelPlaceholder />}
    />
  );
}
