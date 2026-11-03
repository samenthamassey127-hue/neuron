"""
NEURON - Neuromuscular Keystroke Biometrics Feature Engineering Engine
Extracts 14 clinical biomarkers from millisecond keydown/keyup event streams.
Based on PhysioNet & clinical motor disorder diagnostic protocols.
"""

import numpy as np
import math
from typing import List, Dict, Any

FEATURE_NAMES = [
    "mean_hold_time",
    "std_hold_time",
    "mean_flight_time",
    "std_flight_time",
    "flight_skewness",
    "micro_pause_rate",
    "pause_duration_ratio",
    "latency_jitter",
    "keystroke_entropy",
    "bimanual_gap",
    "unimanual_delay",
    "fatigue_drift_slope",
    "typing_cadence_cpm",
    "rhythm_harmonic_ratio"
]

LEFT_HAND_KEYS = set("12345qwertasdfgzxcvbQWERTASDFGZXCVB")
RIGHT_HAND_KEYS = set("67890yuiophjkl;nm,./YUIOPHJKLNM")

def extract_features_from_events(events: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Ingests an ordered list of keystroke events:
    [{ 'key': 'T', 'downTime': 102.4, 'upTime': 185.1 }, ...]
    """
    if len(events) < 3:
        # Fallback for empty or tiny inputs
        return {name: 0.0 for name in FEATURE_NAMES}

    hold_times = []
    flight_times = []
    bimanual_flights = []
    unimanual_flights = []
    pauses = []
    
    total_duration = max(1.0, (events[-1]["upTime"] - events[0]["downTime"])) / 1000.0 # seconds

    for i in range(len(events)):
        ev = events[i]
        ht = max(10.0, float(ev["upTime"] - ev["downTime"]))
        hold_times.append(ht)

        if i > 0:
            prev_ev = events[i - 1]
            # Flight time: time between previous key release and current key press
            ft = float(ev["downTime"] - prev_ev["upTime"])
            # Bound realistic flight time (-50ms to 2000ms)
            ft = max(-50.0, min(ft, 2500.0))
            flight_times.append(ft)

            if ft > 250.0:
                pauses.append(ft)

            curr_key = str(ev.get("key", ""))
            prev_key = str(prev_ev.get("key", ""))

            curr_is_left = curr_key in LEFT_HAND_KEYS
            prev_is_left = prev_key in LEFT_HAND_KEYS

            if curr_is_left != prev_is_left:
                bimanual_flights.append(ft)
            else:
                unimanual_flights.append(ft)

    ht_arr = np.array(hold_times)
    ft_arr = np.array(flight_times) if flight_times else np.array([120.0])

    mean_ht = float(np.mean(ht_arr))
    std_ht = float(np.std(ht_arr))

    mean_ft = float(np.mean(ft_arr))
    std_ft = float(np.std(ft_arr))

    # Skewness
    if std_ft > 1e-4:
        flight_skewness = float(np.mean(((ft_arr - mean_ft) / std_ft) ** 3))
    else:
        flight_skewness = 0.0

    # Micro pause rate & ratio
    micro_pause_rate = float(len(pauses) / max(1, len(events)))
    pause_duration_ratio = float(sum(pauses) / (total_duration * 1000.0)) if total_duration > 0 else 0.0

    # Latency jitter: average cycle-to-cycle delta
    if len(ft_arr) > 1:
        latency_jitter = float(np.mean(np.abs(np.diff(ft_arr))))
    else:
        latency_jitter = 15.0

    # Shannon Entropy of flight times
    hist, _ = np.histogram(ft_arr, bins=10, density=True)
    hist = hist[hist > 0]
    keystroke_entropy = float(-np.sum(hist * np.log2(hist + 1e-9)))

    # Hand coordination
    bimanual_gap = float(np.mean(bimanual_flights)) if bimanual_flights else mean_ft
    unimanual_delay = float(np.mean(unimanual_flights)) if unimanual_flights else mean_ft

    # Fatigue drift slope (linear regression slope of hold time across typing session)
    x = np.arange(len(ht_arr))
    if len(x) > 1:
        slope, _ = np.polyfit(x, ht_arr, 1)
        fatigue_drift_slope = float(slope)
    else:
        fatigue_drift_slope = 0.0

    # Cadence CPM
    typing_cadence_cpm = float((len(events) / max(0.1, total_duration)) * 60.0)

    # Harmonic ratio
    median_ft = np.median(ft_arr)
    rhythm_harmonic_ratio = float(std_ft / max(1.0, median_ft))

    return {
        "mean_hold_time": round(mean_ht, 2),
        "std_hold_time": round(std_ht, 2),
        "mean_flight_time": round(mean_ft, 2),
        "std_flight_time": round(std_ft, 2),
        "flight_skewness": round(flight_skewness, 3),
        "micro_pause_rate": round(micro_pause_rate, 3),
        "pause_duration_ratio": round(min(1.0, pause_duration_ratio), 3),
        "latency_jitter": round(latency_jitter, 2),
        "keystroke_entropy": round(keystroke_entropy, 3),
        "bimanual_gap": round(bimanual_gap, 2),
        "unimanual_delay": round(unimanual_delay, 2),
        "fatigue_drift_slope": round(fatigue_drift_slope, 4),
        "typing_cadence_cpm": round(typing_cadence_cpm, 1),
        "rhythm_harmonic_ratio": round(rhythm_harmonic_ratio, 3)
    }
