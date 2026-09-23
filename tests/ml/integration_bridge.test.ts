import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processGameplayTelemetry } from '../../src/ml/bridge';
import { repository } from '../../src/edge/repository';
import { syncWorker } from '../../src/sync/worker';
import { SessionState, RawTelemetryPayload } from '../../src/ml/melo';

describe('ML-to-Edge Integration Bridge', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('processes a normal smriti_mandir session and triggers sync', async () => {
        const saveSpy = vi.spyOn(repository, 'saveTelemetryEvent').mockResolvedValue('test-id');
        const syncSpy = vi.spyOn(syncWorker, 'triggerSync').mockResolvedValue(undefined);

        const patientState: SessionState = {
            rating: 600,
            skill_vector: [1.0, 1.0, 1.0, 1.0],
            task_difficulty: [1.0, 1.0, 1.0, 1.0],
            baseline_latency: { mean: 2000, std: 500 },
            rolling_accuracy: 0.8
        };

        const telemetry: RawTelemetryPayload = {
            session_id: 'session-1',
            game_id: 'Smriti Mandir',
            completion_time_ms: 1800,
            error_count: 0,
            hesitation_pause_ms: 200,
            audio_voice_latency_ms: 0
        };

        const result = await processGameplayTelemetry('patient-1', telemetry, patientState);

        expect(result.handoff.mElo_rating).toBeGreaterThan(600);
        expect(result.handoff.anxiety_relief_triggered).toBe(false);

        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(syncSpy).toHaveBeenCalledTimes(1);

        const savedPayload = saveSpy.mock.calls[0][0] as any;
        expect(savedPayload.patient_id).toBe('patient-1');
        expect(savedPayload.fhir_observation.code.coding[0].code).toBe('72172-0'); // LOINC
        
        const payloadString = JSON.stringify(savedPayload);
        expect(payloadString.length).toBeLessThan(50000); // < 50KB constraint
    });

    it('processes severe hesitation leading to anxiety relief and difficulty step-down', async () => {
        const saveSpy = vi.spyOn(repository, 'saveTelemetryEvent').mockResolvedValue('test-id-2');
        const syncSpy = vi.spyOn(syncWorker, 'triggerSync').mockResolvedValue(undefined);

        const patientState: SessionState = {
            rating: 750,
            skill_vector: [1.0, 1.0, 1.0, 1.0],
            task_difficulty: [1.0, 1.0, 1.0, 1.0],
            baseline_latency: { mean: 2000, std: 500 },
            rolling_accuracy: 0.8
        };

        const telemetry: RawTelemetryPayload = {
            session_id: 'session-2',
            game_id: 'Dhwani Tarang',
            completion_time_ms: 4000, // Very slow (> mean + 2*std)
            error_count: 0,
            hesitation_pause_ms: 2500,
            audio_voice_latency_ms: 100
        };

        const result = await processGameplayTelemetry('patient-2', telemetry, patientState);

        expect(result.handoff.anxiety_relief_triggered).toBe(true);
        expect(result.handoff.tier).toBe('Easy'); // Dropped from Medium
        
        // Vectors should step down while staying >= 0.1 (clamping constraint)
        expect(result.handoff.difficulty_vector[0]).toBeLessThan(1.0);
        expect(result.handoff.difficulty_vector[0]).toBeGreaterThanOrEqual(0.1);

        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(syncSpy).toHaveBeenCalledTimes(1);
    });
});
