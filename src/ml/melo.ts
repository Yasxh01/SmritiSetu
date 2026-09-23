export type PatientSkillVector = [number, number, number, number];
export type TaskDifficultyVector = [number, number, number, number];

export interface RawTelemetryPayload {
    session_id: string;
    game_id: string;
    completion_time_ms: number;
    error_count: number;
    hesitation_pause_ms: number;
    audio_voice_latency_ms: number;
}

export interface MLHandoffPayload {
    mElo_rating: number;
    tier: "Easy" | "Medium" | "Hard";
    difficulty_vector: number[];
    anxiety_relief_triggered: boolean;
}

export interface SessionState {
    rating: number;
    skill_vector: number[];
    task_difficulty?: number[];
    baseline_latency: {
        mean: number;
        std: number;
    };
    rolling_accuracy: number;
}

export function computeExpectedProbability(theta: number[], d: number[]): number {
    let dotProduct = 0;
    for (let i = 0; i < theta.length; i++) {
        dotProduct += theta[i] * d[i];
    }
    // Clamp to avoid overflow/underflow
    dotProduct = Math.max(-35, Math.min(35, dotProduct));
    return 1.0 / (1.0 + Math.exp(-dotProduct));
}

export function updateVectorsNormalized(
    theta: number[], 
    d: number[], 
    success: boolean, 
    eta: number = 0.1
): { newTheta: number[], newD: number[] } {
    const E = computeExpectedProbability(theta, d);
    const S = success ? 1.0 : 0.0;
    const diff = S - E;
    
    let normThetaSq = 0;
    let normDSq = 0;
    for (let i = 0; i < theta.length; i++) {
        normThetaSq += theta[i] * theta[i];
        normDSq += d[i] * d[i];
    }
    const normFactor = (normThetaSq + normDSq) || 1.0;
    
    const applyOmega = (vec: number[]) => {
        return [vec[1], -vec[0], vec[3], -vec[2]];
    };
    
    const omegaTheta = applyOmega(theta);
    const omegaD = applyOmega(d);
    
    const newTheta = [...theta];
    const newD = [...d];
    
    for (let i = 0; i < 4; i++) {
        newTheta[i] += (eta * diff * (d[i] + omegaD[i])) / normFactor;
        newD[i] -= (eta * diff * (theta[i] + omegaTheta[i])) / normFactor;
    }
    
    return { newTheta, newD };
}

export function checkAnxietyReliefTrigger(
    rollingAccuracy: number, 
    responseLatencyMs: number, 
    baselineMeanMs: number, 
    baselineStdMs: number
): boolean {
    if (rollingAccuracy < 0.65) return true;
    if (responseLatencyMs > baselineMeanMs + 2 * baselineStdMs) return true;
    return false;
}

export function getTier(rating: number): "Easy" | "Medium" | "Hard" {
    if (rating < 700) return "Easy";
    if (rating < 900) return "Medium";
    return "Hard";
}

export function dropTier(tier: "Easy" | "Medium" | "Hard"): "Easy" | "Medium" | "Hard" {
    if (tier === "Hard") return "Medium";
    if (tier === "Medium") return "Easy";
    return "Easy";
}

export function evaluateSession(currentState: SessionState, telemetry: RawTelemetryPayload): MLHandoffPayload {
    const d = currentState.task_difficulty || [1.0, 1.0, 1.0, 1.0];
    const isLatencyAcceptable = telemetry.completion_time_ms <= (currentState.baseline_latency.mean + 2 * currentState.baseline_latency.std);
    const success = (telemetry.error_count === 0 && isLatencyAcceptable);
    
    const anxietyTriggered = checkAnxietyReliefTrigger(
        currentState.rolling_accuracy,
        telemetry.completion_time_ms,
        currentState.baseline_latency.mean,
        currentState.baseline_latency.std
    );
    
    let { newTheta, newD } = updateVectorsNormalized(currentState.skill_vector, d, success, 0.1);
    
    let newRating = currentState.rating + (success ? 10 : -10);
    // Boundary protection for rating (NFR-ML-02)
    newRating = Math.max(100, Math.min(1500, newRating));
    let tier = getTier(newRating);
    
    if (anxietyTriggered) {
        tier = dropTier(tier);
        // Force negative difficulty step-down (\lambda_slope < 0) with lower bound clamping (NFR-ML-02)
        newD = newD.map(v => Math.max(0.1, v - Math.abs(v) * 0.1 - 0.1)); 
    } else {
        // Enforce boundary clamping on difficulty
        newD = newD.map(v => Math.max(0.1, Math.min(5.0, v)));
    }
    
    return {
        mElo_rating: newRating,
        tier: tier,
        difficulty_vector: newD,
        anxiety_relief_triggered: anxietyTriggered
    };
}
