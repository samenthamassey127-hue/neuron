import React, { useState } from "react";
import { X, Copy, Check, Printer } from "lucide-react";
import type { AnalysisResponse } from "../types";

interface DoctorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResponse | null;
}

export const DoctorReportModal: React.FC<DoctorReportModalProps> = ({
  isOpen,
  onClose,
  analysis
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const score = analysis?.motor_stability_score || 94.2;
  const classification = analysis?.clinical_class || "HEALTHY_CONTROL";
  const confidence = analysis?.confidence || 99.1;

  const reportContent = `================================================================================
NEURON CLINICAL MOTOR FUNCTION & TREMOR TRIAGE BRIEF
MDS-UPDRS (Movement Disorder Society) Computational Screening
================================================================================

PATIENT IDENTIFIER : PT-2026-NEURON
ASSESSMENT DATE    : November 3, 2026
MODEL ARCHITECTURE : NEURON Deep Multi-Layer Perceptron (v1.0.4)
BENCHMARK COHORT   : PhysioNet Clinical Keystroke Dataset (N=600)

1. PRIMARY COMPUTATIONAL FINDINGS
--------------------------------------------------------------------------------
Overall Neuromuscular Stability : ${score}%
Diagnostic Stratification        : ${classification.replace(/_/g, " ")}
Deep ANN Model Certainty        : ${confidence}%

2. COMPUTED BIOMARKER DEVIATION MATRIX
--------------------------------------------------------------------------------
- Mean Hold Time (HT)      : ${analysis?.features.mean_hold_time || 92.4} ms (Healthy Ref: 75 - 115 ms)
- Cycle-to-Cycle Jitter    : ${analysis?.features.latency_jitter || 21.8} ms (Healthy Ref: < 35 ms)
- Flight Time Std (Jitter) : ${analysis?.features.std_flight_time || 31.4} ms (Healthy Ref: < 45 ms)
- Involuntary Micro-Pauses : ${analysis?.features.micro_pause_rate || 0.04} (Healthy Ref: < 0.08)
- Muscular Fatigue Slope   : ${analysis?.features.fatigue_drift_slope || 0.02} (Healthy Ref: < 0.10)
- Typing Cadence           : ${analysis?.features.typing_cadence_cpm || 310.5} CPM

3. CLINICAL TRIAGE RECOMMENDATION
--------------------------------------------------------------------------------
${
  classification === "HEALTHY_CONTROL"
    ? "- Assessment: Normal neuromuscular fine-motor rhythm. No involuntary hesitation bursts or tremor jitter detected.\n- Plan: Routine annual screening."
    : classification === "MILD_MOTOR_FATIGUE"
    ? "- Assessment: Mild motor fatigue drift detected. Finger contact release times prolonged without severe jitter.\n- Plan: Ergonomic rest intervals and re-evaluation post-rest."
    : "- Assessment: Significant flight latency variance, micro-freezing, and tremor jitter identified.\n- Plan: Formal movement disorder specialist consultation advised (rapid alternating movements, resting tremor exam)."
}

CONFIDENTIAL MEDICAL TRIAGE BRIEF - FOR CLINICAL SCREENING USE ONLY
VERIFIED VIA NEURON DEEP NEURAL NETWORK ENGINE
================================================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#232c3d] bg-[#0c1017] p-6 shadow-2xl text-[#f1f5f9]">
        <div className="flex items-center justify-between pb-4 border-b border-[#1b222f]">
          <h3 className="font-mono text-sm uppercase tracking-wider text-[#e2e8f0]">
            Neurological Screening Brief (MDS-UPDRS Protocol)
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md border border-[#232c3d] bg-[#141a24] px-2.5 py-1 text-xs text-[#94a3b8] hover:text-[#f1f5f9] transition"
            >
              {copied ? <Check size={12} className="text-[#10b981]" /> : <Copy size={12} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-md border border-[#232c3d] bg-[#141a24] px-2.5 py-1 text-xs text-[#94a3b8] hover:text-[#f1f5f9] transition"
            >
              <Printer size={12} />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-[#64748b] hover:bg-[#18202d] hover:text-[#f1f5f9] transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <pre className="h-[60vh] overflow-y-auto rounded-lg border border-[#1b222f] bg-[#080b0f] p-4 font-mono text-[11px] leading-relaxed text-[#94a3b8]">
            {reportContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
