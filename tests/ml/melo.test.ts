import { expect, test, describe } from 'vitest';
import { 
    computeExpectedProbability, 
    updateVectorsNormalized, 
    checkAnxietyReliefTrigger, 
    evaluateSession 
} from '../../src/ml/melo';

describe('mElo Math Engine', () => {
    test('Bounded expected probability E_{ij} in (0, 1)', () => {
        const E1 = computeExpectedProbability([0, 0, 0, 0], [0, 0, 0, 0]);
        expect(E1).toBe(0.5);
        
        const E2 = computeExpectedProbability([100, 100, 100, 100], [100, 100, 100, 100]);
        expect(E2).toBeGreaterThan(0.99);
        expect(E2).toBeLessThan(1.0);
        
        const E3 = computeExpectedProbability([-100, -100, -100, -100], [100, 100, 100, 100]);
        expect(E3).toBeGreaterThan(0.0);
        expect(E3).toBeLessThan(0.01);
    });

    test('Normalized vector stability over 100 trials without divergence', () => {
        let theta = [1.0, 1.0, 1.0, 1.0];
        let d = [1.0, 1.0, 1.0, 1.0];
        
        for(let i = 0; i < 100; i++) {
            const res = updateVectorsNormalized(theta, d, i % 2 === 0);
            theta = res.newTheta;
            d = res.newD;
        }
        
        const normTheta = Math.sqrt(theta.reduce((sum, v) => sum + v * v, 0));
        const normD = Math.sqrt(d.reduce((sum, v) => sum + v * v, 0));
        
        expect(normTheta).toBeLessThan(100); 
        expect(normD).toBeLessThan(100);
    });

    test('Anxiety relief trigger sets true and downgrades difficulty', () => {
        expect(checkAnxietyReliefTrigger(0.5, 1000, 1000, 100)).toBe(true); // S_t < 0.65
        expect(checkAnxietyReliefTrigger(0.8, 1500, 1000, 100)).toBe(true); // T_resp > mu + 2*sigma
        expect(checkAnxietyReliefTrigger(0.8, 1000, 1000, 100)).toBe(false); // Normal
    });

    test('Correct tier mapping and anxiety step down', () => {
        const state = {
            rating: 699,
            skill_vector: [1, 1, 1, 1],
            baseline_latency: { mean: 1000, std: 100 },
            rolling_accuracy: 0.8
        };
        const telemetry = {
            session_id: "s1",
            game_id: "g1",
            completion_time_ms: 1000,
            error_count: 0,
            hesitation_pause_ms: 0,
            audio_voice_latency_ms: 0
        };
        
        // Success -> rating increases to 709 -> mapped to Medium
        const res1 = evaluateSession(state, telemetry);
        expect(res1.tier).toBe("Medium");
        expect(res1.mElo_rating).toBe(709);
        expect(res1.anxiety_relief_triggered).toBe(false);
        
        // Fail by anxiety trigger (latency spike) -> rating drops to 689, tier drops to Easy
        telemetry.completion_time_ms = 2000;
        const res2 = evaluateSession(state, telemetry);
        expect(res2.anxiety_relief_triggered).toBe(true);
        expect(res2.tier).toBe("Easy");
        // Verify clamping protection (NFR-ML-02)
        expect(res2.difficulty_vector[0]).toBeGreaterThanOrEqual(0.1);
    });
    
    test('Cross-language determinism check (10^-4 precision)', () => {
        let theta = [1.0, 1.0, 1.0, 1.0];
        let d = [1.0, 1.0, 1.0, 1.0];
        const res = updateVectorsNormalized(theta, d, true, 0.1);
        
        expect(res.newTheta[0]).toBeCloseTo(1.0004496, 4);
        expect(res.newTheta[1]).toBeCloseTo(1.0, 4);
        expect(res.newTheta[2]).toBeCloseTo(1.0004496, 4);
        expect(res.newTheta[3]).toBeCloseTo(1.0, 4);
    });
});
