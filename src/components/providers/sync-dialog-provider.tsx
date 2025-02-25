"use client";

import { SyncDialogProvider } from "@/contexts/dialog-context";
import { SyncDialog } from "@/components/sync-dialog";

export function SyncDialogWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SyncDialogProvider>
      {children}
      <SyncDialog />
    </SyncDialogProvider>
  );
}
