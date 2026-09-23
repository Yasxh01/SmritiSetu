import { expect, test, describe } from 'vitest';
import { synthesizeSpeech, transcribeSpeech, REGIONAL_CONFIGS } from '../../src/ml/speech';
import { translateToClinicalTelemetry } from '../../src/ml/clinical_mapping';

describe('Speech Subsystem', () => {
    test('synthesizeSpeech fallback resilience and rates', async () => {
        const result = await synthesizeSpeech("নমস্কাৰ", "as-IN");
        expect(result).toBeDefined();
        
        if ((result as any).fallbackUsed) {
            expect((result as any).pitch).toBe(0.95);
            expect((result as any).rate).toBe(0.85);
            expect((result as any).lang).toBe("as-IN");
        }
    });

    test('transcribeSpeech hesitation and latency extraction', async () => {
        const mockBlob = { size: 5000 } as Blob;
        const res = await transcribeSpeech(mockBlob, "brx-IN");
        expect(res.transcript).toBeDefined();
        expect(res.speechLatencyMs).toBe(500); // 5000 / 10
        expect(res.hesitationPauseMs).toBeGreaterThanOrEqual(0);
    });
    
    test('Regional Voice Configs are present', () => {
        expect(REGIONAL_CONFIGS['as-IN']['Sita'].gender).toBe('Female');
        expect(REGIONAL_CONFIGS['brx-IN']['Bikram'].isPrimary).toBe(true);
    });
});

describe('Clinical Mapping Engine', () => {
    const baseTelemetry = {
        session_id: "s1",
        game_id: "unknown",
        completion_time_ms: 2000,
        error_count: 1, // -10 points
        hesitation_pause_ms: 1000, // -1 point
        audio_voice_latency_ms: 50
    };

    test('Smriti Mandir Mapping (b1560)', () => {
        const out = translateToClinicalTelemetry({ ...baseTelemetry, game_id: "Smriti Mandir" }, 750);
        expect(out.valueQuantity.value).toBe(750);
        expect(out.code.coding[0].code).toBe("72172-0");
        
        const icf = out.component[0].code.coding.find(c => c.system === "ICF");
        expect(icf?.code).toBe("b1560");
        expect(out.component[0].valueInteger).toBe(89); // 100 - (1*10) - (1000/1000)
    });

    test('Dainik Dinlipi Mapping (b1440)', () => {
        const out = translateToClinicalTelemetry({ ...baseTelemetry, game_id: "Dainik Dinlipi" }, 750);
        expect(out.component[0].code.coding.find(c => c.system === "ICF")?.code).toBe("b1440");
    });

    test('Dhyaan Kendra Mapping (b1641)', () => {
        const out = translateToClinicalTelemetry({ ...baseTelemetry, game_id: "Dhyaan Kendra" }, 750);
        expect(out.component[0].code.coding.find(c => c.system === "ICF")?.code).toBe("b1641");
    });

    test('Dhwani Tarang Mapping (b1670)', () => {
        const out = translateToClinicalTelemetry({ ...baseTelemetry, game_id: "Dhwani Tarang" }, 750);
        expect(out.component[0].code.coding.find(c => c.system === "ICF")?.code).toBe("b1670");
    });
});
