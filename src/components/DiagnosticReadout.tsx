import React from "react";
import { ShieldCheck, AlertTriangle, ShieldAlert, Cpu } from "lucide-react";
import type { AnalysisResponse } from "../types";

interface DiagnosticReadoutProps {
  analysis: AnalysisResponse | null;
}

export const DiagnosticReadout: React.FC<DiagnosticReadoutProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="rounded-xl border border-[#1e2633] bg-[#0f131a] p-8 text-center text-[#64748b]">
        <Cpu className="mx-auto h-8 w-8 text-[#334155] mb-2" />
        <p className="font-mono text-xs uppercase tracking-wider">Awaiting Telemetry Input</p>
        <p className="font-sans text-xs mt-1 text-[#475569]">
          Type the passage or select a clinical cohort above to trigger Deep ANN motor inference.
        </p>
      </div>
    );
  }

  const { motor_stability_score, clinical_class, severity, confidence, class_probabilities, features, clinical_reference } = analysis;

  const severityConfig = {
    nominal: {
      label: "Healthy Neuromuscular Control",
      tone: "text-[#10b981] border-[#10b981]/30 bg-[#10b981]/10",
      barColor: "bg-[#10b981]",
      icon: ShieldCheck,
      desc: "Keystroke cadence, flight stability, and hold times fall within standard healthy reference ranges."
    },
    moderate: {
      label: "Mild Neuromuscular Fatigue",
      tone: "text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/10",
      barColor: "bg-[#f59e0b]",
      icon: AlertTriangle,
      desc: "Subtle hold time prolongation and fatigue drift observed. Characteristic of muscular fatigue or prolonged typing strain."
    },
    critical: {
      label: "Elevated Tremor & Motor Decline",
      tone: "text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10",
      barColor: "bg-[#ef4444]",
      icon: ShieldAlert,
      desc: "Significant flight time variance, cycle-to-cycle latency jitter, and involuntary micro-pauses consistent with early Parkinsonian motor markers."
    }
  }[severity];

  const IconComponent = severityConfig.icon;

  return (
    <div className="space-y-6">
      {/* Primary Diagnostic Banner */}
      <div className="rounded-xl border border-[#1e2633] bg-[#0f131a] p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#1b222f]">
          <div className="flex items-start gap-4">
            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${severityConfig.tone}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-base font-semibold text-[#f1f5f9]">
                  {severityConfig.label}
                </span>
                <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${severityConfig.tone}`}>
                  {clinical_class.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-1 font-sans text-xs text-[#94a3b8] max-w-xl">
                {severityConfig.desc}
              </p>
            </div>
          </div>

          {/* Motor Stability Gauge Metric */}
          <div className="flex items-center gap-4 rounded-lg border border-[#1c2330] bg-[#121621] p-4 shrink-0">
            <div>
              <span className="font-mono text-[10px] uppercase text-[#64748b]">
                Neuromuscular Stability
              </span>
              <p className="font-mono text-2xl font-bold text-[#f1f5f9]">
                {motor_stability_score}%
              </p>
            </div>
            <div className="h-10 w-10 rounded-full border-4 border-[#1e2738] flex items-center justify-center">
              <span className={`text-[10px] font-mono font-bold ${severityConfig.tone.split(" ")[0]}`}>
                {motor_stability_score >= 80 ? "A" : motor_stability_score >= 55 ? "B" : "C"}
              </span>
            </div>
          </div>
        </div>

        {/* Model Class Probabilities */}
        <div className="mt-4 pt-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-[#64748b] mb-1.5">
            <span>Deep ANN Class Probability Distribution (Confidence: {confidence}%):</span>
            <span className="text-[#94a3b8]">Input Keystrokes: {analysis.keystroke_count}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#161c27] flex">
            <div
              style={{ width: `${class_probabilities.healthy_control}%` }}
              className="bg-[#10b981] transition-all duration-500"
              title={`Healthy Control: ${class_probabilities.healthy_control}%`}
            />
            <div
              style={{ width: `${class_probabilities.mild_motor_fatigue}%` }}
              className="bg-[#f59e0b] transition-all duration-500"
              title={`Mild Fatigue: ${class_probabilities.mild_motor_fatigue}%`}
            />
            <div
              style={{ width: `${class_probabilities.elevated_tremor_risk}%` }}
              className="bg-[#ef4444] transition-all duration-500"
              title={`Elevated Tremor Risk: ${class_probabilities.elevated_tremor_risk}%`}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-[#64748b]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#10b981]" />
              Healthy ({class_probabilities.healthy_control}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
              Fatigue ({class_probabilities.mild_motor_fatigue}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
              Elevated Tremor ({class_probabilities.elevated_tremor_risk}%)
            </span>
          </div>
        </div>
      </div>

      {/* Biomarker Deviation Telemetry Grid */}
      <div className="rounded-xl border border-[#1e2633] bg-[#0f131a] p-6 shadow-sm">
        <h3 className="font-mono text-xs uppercase tracking-wider text-[#e2e8f0] pb-3 border-b border-[#1b222f] mb-4">
          Clinical Neuromuscular Biomarker Matrix
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 font-mono text-xs">
          {[
            {
              name: "Mean Hold Time",
              value: `${features.mean_hold_time} ms`,
              ref: clinical_reference.mean_hold_time?.healthy || "75-115 ms",
              status: clinical_reference.mean_hold_time?.status || "normal",
              desc: "Finger contact duration on keycap"
            },
            {
              name: "Cycle-to-Cycle Jitter",
              value: `${features.latency_jitter} ms`,
              ref: clinical_reference.latency_jitter?.healthy || "< 35 ms",
              status: clinical_reference.latency_jitter?.status || "normal",
              desc: "Consecutive flight time perturbation (Tremor proxy)"
            },
            {
              name: "Flight Time Std (Jitter)",
              value: `${features.std_flight_time} ms`,
              ref: clinical_reference.std_flight_time?.healthy || "< 45 ms",
              status: clinical_reference.std_flight_time?.status || "normal",
              desc: "Inter-key latency variance (Bradykinesia indicator)"
            },
            {
              name: "Involuntary Micro-Pauses",
              value: `${features.micro_pause_rate}`,
              ref: clinical_reference.micro_pause_rate?.healthy || "< 0.08",
              status: clinical_reference.micro_pause_rate?.status || "normal",
              desc: "Frequency of hesitation freezes > 250ms"
            },
            {
              name: "Fatigue Drift Slope",
              value: `${features.fatigue_drift_slope}`,
              ref: clinical_reference.fatigue_drift_slope?.healthy || "< 0.10",
              status: clinical_reference.fatigue_drift_slope?.status || "normal",
              desc: "Progression of hold time increase across sentence"
            },
            {
              name: "Cadence Velocity",
              value: `${features.typing_cadence_cpm} CPM`,
              ref: "> 180 CPM",
              status: features.typing_cadence_cpm < 140 ? "abnormal" : "normal",
              desc: "Effective typing velocity normalized for hesitations"
            }
          ].map((item, idx) => {
            const isAbnormal = item.status !== "normal";
            return (
              <div
                key={idx}
                className={`rounded-lg border p-3.5 transition ${
                  isAbnormal
                    ? "border-[#ef4444]/30 bg-[#ef4444]/[0.03]"
                    : "border-[#1c2330] bg-[#121620]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#94a3b8] font-medium">{item.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${
                      isAbnormal
                        ? "bg-[#ef4444]/20 text-[#ef4444]"
                        : "bg-[#10b981]/20 text-[#10b981]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-1.5 text-base font-bold text-[#f1f5f9]">{item.value}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-[#64748b]">
                  <span>Ref: {item.ref}</span>
                  <span className="truncate max-w-[130px] text-right">{item.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
