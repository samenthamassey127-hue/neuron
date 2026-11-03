import React from "react";
import { Activity, Database, FileText, CheckCircle2 } from "lucide-react";

interface NavbarProps {
  onOpenDatasets: () => void;
  onOpenReport: () => void;
  accuracy: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDatasets, onOpenReport, accuracy }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#1f2633] bg-[#0b0e14]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2b3547] bg-[#141a24]">
            <Activity className="h-4 w-4 text-[#10b981]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-semibold tracking-tight text-[#f1f5f9]">
                NEURON
              </span>
              <span className="rounded border border-[#10b981]/30 bg-[#10b981]/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#10b981]">
                Deep ANN v1.0
              </span>
            </div>
            <p className="font-sans text-[11px] text-[#64748b]">
              Clinical Keystroke Neuromuscular Telemetry · MDS-UPDRS Protocol
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#94a3b8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            <span>Active Dataset: PhysioNet Parkinson's Cohort</span>
            <span className="text-[#475569]">|</span>
            <span className="text-[#10b981] flex items-center gap-1">
              <CheckCircle2 size={11} /> {accuracy}% Accuracy
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDatasets}
            className="flex items-center gap-1.5 rounded-lg border border-[#263142] bg-[#121721] px-3 py-1.5 font-sans text-xs font-medium text-[#cbd5e1] hover:border-[#38465e] hover:bg-[#18202d] transition"
          >
            <Database size={13} className="text-[#94a3b8]" />
            <span>Datasets</span>
          </button>

          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 rounded-lg border border-[#263142] bg-[#121721] px-3 py-1.5 font-sans text-xs font-medium text-[#cbd5e1] hover:border-[#38465e] hover:bg-[#18202d] transition"
          >
            <FileText size={13} className="text-[#94a3b8]" />
            <span>Doctor Brief</span>
          </button>
        </div>
      </div>
    </header>
  );
};
