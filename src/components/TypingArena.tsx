import React, { useState, useRef, useEffect } from "react";
import { RotateCcw, Keyboard, Activity, UserCheck } from "lucide-react";
import { CLINICAL_PRESETS } from "../data/presets";
import type { RawKeystrokeEvent, PatientPreset } from "../types";

const TARGET_SENTENCE = "The quick brown fox jumps over the lazy dog.";

interface TypingArenaProps {
  onAnalyze: (events: RawKeystrokeEvent[], patientId?: string) => void;
  isAnalyzing: boolean;
}

export const TypingArena: React.FC<TypingArenaProps> = ({ onAnalyze, isAnalyzing }) => {
  const [typedText, setTypedText] = useState("");
  const [events, setEvents] = useState<RawKeystrokeEvent[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [lastMetrics, setLastMetrics] = useState<{ lastHT: number; lastFT: number; count: number }>({
    lastHT: 0,
    lastFT: 0,
    count: 0
  });

  const keydownMap = useRef<Map<string, number>>(new Map());
  const lastKeyupTime = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Avoid double logging on repeated keys held down
    if (e.repeat) return;
    const now = performance.now();
    keydownMap.current.set(e.key, now);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const upTime = performance.now();
    const downTime = keydownMap.current.get(e.key);
    keydownMap.current.delete(e.key);

    if (downTime !== undefined) {
      const holdTime = Math.round(upTime - downTime);
      const flightTime = lastKeyupTime.current > 0 ? Math.round(downTime - lastKeyupTime.current) : 110;
      lastKeyupTime.current = upTime;

      const newEvent: RawKeystrokeEvent = {
        key: e.key,
        downTime: Math.round(downTime),
        upTime: Math.round(upTime)
      };

      const updated = [...events, newEvent];
      setEvents(updated);
      setLastMetrics({
        lastHT: holdTime,
        lastFT: flightTime,
        count: updated.length
      });

      // Automatically trigger analysis once sufficient characters are typed
      if (updated.length >= 10 && updated.length % 5 === 0) {
        onAnalyze(updated, activePreset ? `PRESET-${activePreset}` : "LIVE-USER");
      }
    }
  };

  const handleReset = () => {
    setTypedText("");
    setEvents([]);
    setActivePreset(null);
    keydownMap.current.clear();
    lastKeyupTime.current = 0;
    setLastMetrics({ lastHT: 0, lastFT: 0, count: 0 });
    inputRef.current?.focus();
  };

  const loadPreset = (preset: PatientPreset) => {
    setActivePreset(preset.id);
    setTypedText(preset.text);
    const simEvents = preset.generateEvents();
    setEvents(simEvents);
    const last = simEvents[simEvents.length - 1];
    setLastMetrics({
      lastHT: Math.round(last.upTime - last.downTime),
      lastFT: 140,
      count: simEvents.length
    });
    onAnalyze(simEvents, preset.id);
  };

  return (
    <div className="rounded-xl border border-[#1e2633] bg-[#0f131a] p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1b222f] gap-3">
        <div className="flex items-center gap-2">
          <Keyboard className="h-4 w-4 text-[#94a3b8]" />
          <h2 className="font-mono text-sm uppercase tracking-wider text-[#e2e8f0]">
            Live Neuromuscular Keystroke Capture
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-md border border-[#232c3d] bg-[#141a24] px-2.5 py-1 text-xs text-[#94a3b8] hover:text-[#e2e8f0] transition"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Target Sentence Display */}
      <div className="mt-5 rounded-lg border border-[#1b222e] bg-[#0a0d13] p-4">
        <p className="font-mono text-[11px] uppercase tracking-wider text-[#64748b] mb-1.5">
          Standard Clinical Assessment Passage:
        </p>
        <p className="font-sans text-base leading-relaxed text-[#94a3b8]">
          {TARGET_SENTENCE.split("").map((char, index) => {
            const typedChar = typedText[index];
            let color = "text-[#64748b]";
            if (typedChar !== undefined) {
              color = typedChar === char ? "text-[#10b981]" : "text-[#ef4444]";
            }
            return (
              <span key={index} className={color}>
                {char}
              </span>
            );
          })}
        </p>
      </div>

      {/* Interactive Typing Input */}
      <div className="mt-4">
        <input
          ref={inputRef}
          type="text"
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder="Begin typing the passage here to initiate real-time telemetry..."
          className="w-full rounded-lg border border-[#242e3f] bg-[#141a24] px-4 py-3 font-mono text-sm text-[#f1f5f9] placeholder-[#475569] focus:border-[#3b82f6] focus:outline-none transition"
        />
      </div>

      {/* Real-time Telemetry Metrics Strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
        <div className="rounded-md border border-[#1c2330] bg-[#111620] p-2.5">
          <span className="text-[10px] uppercase text-[#64748b]">Keystrokes</span>
          <p className="mt-0.5 text-sm font-semibold text-[#f1f5f9]">{lastMetrics.count}</p>
        </div>
        <div className="rounded-md border border-[#1c2330] bg-[#111620] p-2.5">
          <span className="text-[10px] uppercase text-[#64748b]">Hold Time (HT)</span>
          <p className="mt-0.5 text-sm font-semibold text-[#f1f5f9]">
            {lastMetrics.lastHT > 0 ? `${lastMetrics.lastHT} ms` : "—"}
          </p>
        </div>
        <div className="rounded-md border border-[#1c2330] bg-[#111620] p-2.5">
          <span className="text-[10px] uppercase text-[#64748b]">Flight Time (FT)</span>
          <p className="mt-0.5 text-sm font-semibold text-[#f1f5f9]">
            {lastMetrics.lastFT > 0 ? `${lastMetrics.lastFT} ms` : "—"}
          </p>
        </div>
        <div className="rounded-md border border-[#1c2330] bg-[#111620] p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase text-[#64748b]">ANN Status</span>
            <p className="mt-0.5 text-xs text-[#10b981] font-semibold">
              {isAnalyzing ? "Inferring..." : events.length >= 4 ? "Active" : "Awaiting Input"}
            </p>
          </div>
          <Activity size={15} className={isAnalyzing ? "animate-pulse text-[#3b82f6]" : "text-[#10b981]"} />
        </div>
      </div>

      {/* Clinical Cohort Presets (1-Click Test) */}
      <div className="mt-6 border-t border-[#1b222f] pt-4">
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#64748b] mb-2.5">
          <UserCheck size={13} />
          <span>Simulate Verified Clinical Cohort Streams (PhysioNet Parameters):</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CLINICAL_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className={`rounded-lg border p-3 text-left transition ${
                  isSelected
                    ? "border-[#3b82f6] bg-[#172233]"
                    : "border-[#1e2633] bg-[#121620] hover:border-[#2e3b4f] hover:bg-[#161c27]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-sans text-xs font-medium text-[#f1f5f9]">{preset.name}</p>
                </div>
                <p className="mt-1 font-mono text-[10px] text-[#64748b]">{preset.demographics}</p>
                <p className="mt-1 text-[11px] text-[#94a3b8]">{preset.condition}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
