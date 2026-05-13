"use client";

import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { type SyncStatus } from "@/hooks/useSync";

interface SyncStatusProps {
  status: SyncStatus;
  onSync: () => void;
}

export default function SyncStatusBar({ status, onSync }: SyncStatusProps) {
  const config = {
    idle:     { icon: Cloud,         color: "text-ink-faint", label: "Cloud sync ready",  spin: false },
    syncing:  { icon: RefreshCw,     color: "text-accent",    label: "Syncing…",          spin: true  },
    synced:   { icon: CheckCircle2,  color: "text-done",      label: "All synced",        spin: false },
    error:    { icon: AlertCircle,   color: "text-urgent",    label: "Sync failed",       spin: false },
    disabled: { icon: CloudOff,      color: "text-ink-faint", label: "Local only",        spin: false },
  }[status];

  const Icon = config.icon;

  return (
    <button
      onClick={status !== "disabled" ? onSync : undefined}
      disabled={status === "syncing" || status === "disabled"}
      className="flex items-center gap-2 w-full group"
      title={status === "disabled" ? "Add Supabase keys to enable sync" : "Click to sync now"}
    >
      <Icon
        className={`w-3.5 h-3.5 flex-shrink-0 ${config.color} ${config.spin ? "animate-spin" : ""}`}
      />
      <span className={`font-mono text-[9px] ${config.color}`}>{config.label}</span>
    </button>
  );
}
