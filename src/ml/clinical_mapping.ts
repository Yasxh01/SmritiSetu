import { RawTelemetryPayload } from './melo';

export interface ClinicalTelemetryOutput {
    resourceType: "Observation";
    code: {
        coding: Array<{ system: string, code: string, display: string }>
    };
    valueQuantity: {
        value: number;
        unit: "score";
    };
    component: Array<{
        code: {
            coding: Array<{ system: string, code: string, display: string }>
        };
        valueInteger: number;
    }>;
}

export function translateToClinicalTelemetry(rawTelemetry: RawTelemetryPayload, mEloScore: number): ClinicalTelemetryOutput {
    // Normalization heuristic mapping error count and hesitation directly to sub-score (100 base)
    let normalizedSubScore = 100 - (rawTelemetry.error_count * 10) - (rawTelemetry.hesitation_pause_ms / 1000);
    normalizedSubScore = Math.max(0, Math.min(100, Math.round(normalizedSubScore)));
    
    const components: any[] = [];
    const normalizedGameId = (rawTelemetry.game_id || '').toLowerCase().replace(/[\s_-]+/g, '');
    
    if (normalizedGameId === 'smritimandir') {
        components.push({
            code: { coding: [
                { system: "ICF", code: "b1560", display: "Visuospatial/Attention functions" },
                { system: "MoCA", code: "Visuospatial/Clock Draw", display: "Visuospatial" },
                { system: "MMSE", code: "Figure Copy", display: "Visuospatial" }
            ]},
            valueInteger: normalizedSubScore
        });
    } else if (normalizedGameId === 'dainikdinlipi') {
        components.push({
            code: { coding: [
                { system: "ICF", code: "b1440", display: "Memory functions" },
                { system: "MoCA", code: "5-Word Delayed Recall", display: "Memory" },
                { system: "CALS", code: "Serial Tracking", display: "Memory" }
            ]},
            valueInteger: normalizedSubScore
        });
    } else if (normalizedGameId === 'dhyaankendra') {
        components.push({
            code: { coding: [
                { system: "ICF", code: "b1641", display: "Executive Planning / Organization" },
                { system: "MoCA", code: "Trail Making B", display: "Executive" },
                { system: "CALS", code: "Complex Planning", display: "Executive" }
            ]},
            valueInteger: normalizedSubScore
        });
    } else if (normalizedGameId === 'dhwanitarang') {
        components.push({
            code: { coding: [
                { system: "ICF", code: "b1670", display: "Semantic Reception / Language comprehension" },
                { system: "MoCA", code: "Naming", display: "Language" },
                { system: "MINT", code: "Multilingual Naming Test", display: "Language" }
            ]},
            valueInteger: normalizedSubScore
        });
    } else {
        components.push({
            code: { coding: [] },
            valueInteger: normalizedSubScore
        });
    }

    return {
        resourceType: "Observation",
        code: {
            coding: [
                { system: "http://loinc.org", code: "72172-0", display: "Cognitive status" }
            ]
        },
        valueQuantity: {
            value: mEloScore,
            unit: "score"
        },
        component: components
    };
}
