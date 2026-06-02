import { PageHeader } from "@/components/layout/PageHeader";
import { LayoutGrid } from "lucide-react";

export default function ZonesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Zones</PageHeader.Title>
          <PageHeader.Description>Define and configure detection zones.</PageHeader.Description>
        </PageHeader.Content>
      </PageHeader>

      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-24 text-muted-foreground">
        <LayoutGrid className="size-10 opacity-30" />
        <p className="text-sm">This page is under construction.</p>
      </div>
    </div>
  );
}
