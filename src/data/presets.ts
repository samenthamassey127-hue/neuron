import type { PatientPreset, RawKeystrokeEvent } from "../types";

const SENTENCE = "The quick brown fox jumps over the lazy dog.";

function simulateStream(
  baseHold: number,
  holdVar: number,
  baseFlight: number,
  flightVar: number,
  pauseChance: number = 0.05,
  fatigueDrift: number = 0.0
): RawKeystrokeEvent[] {
  let currentTime = 1000.0;
  const events: RawKeystrokeEvent[] = [];

  for (let i = 0; i < SENTENCE.length; i++) {
    const char = SENTENCE[i];
    const drift = i * fatigueDrift;
    const hold = Math.max(40, baseHold + drift + (Math.random() - 0.5) * holdVar);
    const downTime = currentTime;
    const upTime = downTime + hold;

    events.push({
      key: char,
      downTime: Math.round(downTime),
      upTime: Math.round(upTime)
    });

    let flight = Math.max(40, baseFlight + (Math.random() - 0.5) * flightVar);
    if (Math.random() < pauseChance) {
      flight += 320 + Math.random() * 250; // Involuntary micro-hesitation
    }

    currentTime = upTime + flight;
  }

  return events;
}

export const CLINICAL_PRESETS: PatientPreset[] = [
  {
    id: "preset-healthy-young",
    name: "Cohort A · Healthy Control",
    demographics: "Age 24 · Right Dominant",
    condition: "Nominal Neuromuscular Baseline",
    simulatedClass: "HEALTHY_CONTROL",
    text: SENTENCE,
    generateEvents: () => simulateStream(88, 16, 120, 24, 0.02, 0.01)
  },
  {
    id: "preset-healthy-senior",
    name: "Cohort B · Healthy Senior",
    demographics: "Age 68 · Right Dominant",
    condition: "Age-Appropriate Motor Cadence",
    simulatedClass: "HEALTHY_CONTROL",
    text: SENTENCE,
    generateEvents: () => simulateStream(110, 22, 160, 35, 0.03, 0.02)
  },
  {
    id: "preset-motor-fatigue",
    name: "Cohort C · Muscular Fatigue",
    demographics: "Age 32 · Extended Screen Time",
    condition: "Acute Reversible Motor Drift",
    simulatedClass: "MILD_MOTOR_FATIGUE",
    text: SENTENCE,
    generateEvents: () => simulateStream(125, 30, 185, 60, 0.10, 0.35)
  },
  {
    id: "preset-early-parkinsons",
    name: "Cohort D · Early Motor Decline",
    demographics: "Age 64 · Tremor Suspicion",
    condition: "Bradykinesia & Micro-Jitter Cohort",
    simulatedClass: "ELEVATED_TREMOR_RISK",
    text: SENTENCE,
    generateEvents: () => simulateStream(175, 55, 260, 110, 0.22, 0.48)
  }
];
