import pytest
from server.services.chi_calculator import calculate_chi, normalize_latency
from server.services.anomaly_detector import detect_rapid_cognitive_drop, detect_latency_spike, detect_non_adherence
from server.services.synthetic_generator import generate_synthetic_30_day_timeline
from server.services.alert_dispatcher import AlertDispatcher

def test_chi_calculation():
    chi = calculate_chi(memory_score=100, executive_score=100, latency_score=100, adherence_score=100)
    assert chi == 100.0
    
    chi = calculate_chi(memory_score=0, executive_score=0, latency_score=0, adherence_score=0)
    assert chi == 0.0

def test_normalize_latency():
    # Baseline 1000ms, std 100ms
    score = normalize_latency(1050, 1000, 100) # z = 0.5 <= 1.0
    assert score == 100.0
    
    score = normalize_latency(1150, 1000, 100) # z = 1.5 -> penalty 15
    assert score == 85.0
    
    score = normalize_latency(1300, 1000, 100) # z = 3.0 -> penalty > 2.0
    assert score == 50.0

def test_anomaly_detection_synthetic_data():
    dataset = generate_synthetic_30_day_timeline("ner-pat-78902-assamese")
    timeline = dataset["timeline"]
    
    chi_scores = []
    latencies = []
    adherence = []
    
    for day_data in timeline:
        lat_score = normalize_latency(day_data["latency_ms"], dataset["baseline_mean_latency"], dataset["baseline_std_latency"])
        chi = calculate_chi(
            memory_score=day_data["memory_score"],
            executive_score=day_data["executive_score"],
            latency_score=lat_score,
            adherence_score=100.0 if day_data["adherence"] else 0.0
        )
        chi_scores.append(chi)
        latencies.append(day_data["latency_ms"])
        adherence.append(day_data["adherence"])
        
    # Check for rapid drop (Should definitely fire around day 21-23)
    drop_incidents = detect_rapid_cognitive_drop("ner-pat-78902-assamese", chi_scores)
    assert len(drop_incidents) > 0
    assert any(i.severity == "CRITICAL" for i in drop_incidents)
    
    # Check for latency spike
    spike_incidents = detect_latency_spike("ner-pat-78902-assamese", latencies, dataset["baseline_mean_latency"], dataset["baseline_std_latency"])
    assert len(spike_incidents) > 0

def test_alert_dispatcher(caplog):
    import logging
    dispatcher = AlertDispatcher(use_mock=True)
    with caplog.at_level(logging.INFO):
        success = dispatcher.dispatch_sos(["+919876543210"], "Aita", {"lat": 26.14, "lon": 91.73})
        assert success
        assert "EMERGENCY: Aita has triggered an SOS alert." in caplog.text
        assert "https://maps.google.com/?q=26.14,91.73" in caplog.text
        
        dispatcher.dispatch_sms(["+919876543210"], "Please take medicine.", language="as")
        assert "স্মৃতিসেতু সতৰ্কবাণী" in caplog.text
