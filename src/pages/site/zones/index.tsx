import { PageHeader } from "@accel/ui/components/layout/PageHeader";
import { LayoutGrid } from "lucide-react";

export default function ZonesPage() {
  return (
    <div data-slot="zones-page" className="flex flex-col gap-6">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Zones</PageHeader.Title>
        </PageHeader.Content>
      </PageHeader>

      <div data-slot="zones-page-empty" className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-24 text-muted-foreground">
        <LayoutGrid className="size-10 opacity-30" />
        <p className="text-sm">This page is under construction.</p>
      </div>
    </div>
  );
}
