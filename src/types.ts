export interface RawKeystrokeEvent {
  key: string;
  downTime: number;
  upTime: number;
}

export interface BiomarkerRange {
  unit: string;
  healthy: string;
  status: "normal" | "elevated" | "abnormal" | "irregular" | "frequent" | "steep";
}

export interface NeuromuscularFeatures {
  mean_hold_time: number;
  std_hold_time: number;
  mean_flight_time: number;
  std_flight_time: number;
  flight_skewness: number;
  micro_pause_rate: number;
  pause_duration_ratio: number;
  latency_jitter: number;
  keystroke_entropy: number;
  bimanual_gap: number;
  unimanual_delay: number;
  fatigue_drift_slope: number;
  typing_cadence_cpm: number;
  rhythm_harmonic_ratio: number;
}

export interface AnalysisResponse {
  patient_id: string;
  motor_stability_score: number;
  clinical_class: "HEALTHY_CONTROL" | "MILD_MOTOR_FATIGUE" | "ELEVATED_TREMOR_RISK";
  severity: "nominal" | "moderate" | "critical";
  confidence: number;
  class_probabilities: {
    healthy_control: number;
    mild_motor_fatigue: number;
    elevated_tremor_risk: number;
  };
  keystroke_count: number;
  features: NeuromuscularFeatures;
  clinical_reference: Record<string, BiomarkerRange>;
  mds_updrs_triage: string;
}

export interface PatientPreset {
  id: string;
  name: string;
  demographics: string;
  condition: string;
  simulatedClass: "HEALTHY_CONTROL" | "MILD_MOTOR_FATIGUE" | "ELEVATED_TREMOR_RISK";
  text: string;
  generateEvents: () => RawKeystrokeEvent[];
}
