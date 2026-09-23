from typing import Dict, Any

def translate_to_clinical_telemetry(raw_telemetry: Dict[str, Any], melo_score: float) -> Dict[str, Any]:
    err = raw_telemetry.get('error_count', 0)
    hesitation = raw_telemetry.get('hesitation_pause_ms', 0)
    
    sub_score = 100.0 - (err * 10) - (hesitation / 1000.0)
    sub_score = max(0.0, min(100.0, round(sub_score)))
    
    components = []
    raw_game_id = str(raw_telemetry.get('game_id', ''))
    norm_game = raw_game_id.lower().replace(' ', '').replace('_', '')
    
    if 'smritimandir' in norm_game:
        components.append({
            "code": { "coding": [
                { "system": "ICF", "code": "b1560", "display": "Visuospatial/Attention functions" },
                { "system": "MoCA", "code": "Visuospatial/Clock Draw", "display": "Visuospatial" },
                { "system": "MMSE", "code": "Figure Copy", "display": "Visuospatial" }
            ]},
            "valueInteger": int(sub_score)
        })
    elif 'dainikdinlipi' in norm_game:
        components.append({
            "code": { "coding": [
                { "system": "ICF", "code": "b1440", "display": "Memory functions" },
                { "system": "MoCA", "code": "5-Word Delayed Recall", "display": "Memory" },
                { "system": "CALS", "code": "Serial Tracking", "display": "Memory" }
            ]},
            "valueInteger": int(sub_score)
        })
    elif 'dhyaankendra' in norm_game:
        components.append({
            "code": { "coding": [
                { "system": "ICF", "code": "b1641", "display": "Executive Planning / Organization" },
                { "system": "MoCA", "code": "Trail Making B", "display": "Executive" },
                { "system": "CALS", "code": "Complex Planning", "display": "Executive" }
            ]},
            "valueInteger": int(sub_score)
        })
    elif 'dhwanitarang' in norm_game:
        components.append({
            "code": { "coding": [
                { "system": "ICF", "code": "b1670", "display": "Semantic Reception / Language comprehension" },
                { "system": "MoCA", "code": "Naming", "display": "Language" },
                { "system": "MINT", "code": "Multilingual Naming Test", "display": "Language" }
            ]},
            "valueInteger": int(sub_score)
        })
    else:
        components.append({
            "code": { "coding": [] },
            "valueInteger": int(sub_score)
        })

    return {
        "resourceType": "Observation",
        "code": {
            "coding": [
                { "system": "http://loinc.org", "code": "72172-0", "display": "Cognitive status" }
            ]
        },
        "valueQuantity": {
            "value": melo_score,
            "unit": "score"
        },
        "component": components
    }
