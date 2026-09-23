import { repository, InboundTelemetryPayload } from '../edge/repository';
import { syncWorker } from '../sync/worker';
import {
    RawTelemetryPayload,
    MLHandoffPayload,
    SessionState as PatientMLState,
    evaluateSession
} from './melo';
import {
    translateToClinicalTelemetry,
    ClinicalTelemetryOutput
} from './clinical_mapping';

export type FHIRObservationPayload = ClinicalTelemetryOutput;

function normalizeGameId(gameId: string): 'smriti_mandir' | 'dhwani_tarang' | 'dhyaan_kendra' | 'dainik_dinlipi' {
    const clean = gameId.toLowerCase().replace(/[\s_-]+/g, '');
    if (clean.includes('dhwani')) return 'dhwani_tarang';
    if (clean.includes('dhyaan')) return 'dhyaan_kendra';
    if (clean.includes('dinlipi')) return 'dainik_dinlipi';
    return 'smriti_mandir';
}

export async function processGameplayTelemetry(
    patientId: string,
    telemetry: RawTelemetryPayload & { task_identifier?: string },
    patientState: PatientMLState
): Promise<{
    handoff: MLHandoffPayload;
    clinicalOutput: ClinicalTelemetryOutput;
    fhirObservation: FHIRObservationPayload;
}> {
    // 1. Evaluate session to get mElo rating and tier
    const handoff = evaluateSession(patientState, telemetry);

    // 2. Translate to clinical metrics using the updated rating
    const clinicalOutput = translateToClinicalTelemetry(telemetry, handoff.mElo_rating);
    const fhirObservation: FHIRObservationPayload = clinicalOutput;

    // 3. Prepare payload for edge repository
    const timestamp = new Date().toISOString();
    const inboundTelemetry: InboundTelemetryPayload = {
        session_id: telemetry.session_id,
        patient_id: patientId,
        game_id: normalizeGameId(telemetry.game_id),
        task_identifier: telemetry.task_identifier || 'default_task',
        completion_time_ms: telemetry.completion_time_ms,
        error_count: telemetry.error_count,
        hesitation_pause_ms: telemetry.hesitation_pause_ms,
        audio_voice_latency_ms: telemetry.audio_voice_latency_ms,
        timestamp: timestamp
    };

    // Merge FHIR observation & mElo handoff into event for encrypted persistence
    const eventToSave = {
        ...inboundTelemetry,
        fhir_observation: fhirObservation,
        ml_handoff: handoff
    } as any;

    // 4. Persist to Edge Database (<15ms)
    await repository.saveTelemetryEvent(eventToSave);

    // 5. Notify CRDT Sync Worker
    await syncWorker.triggerSync();

    return {
        handoff,
        clinicalOutput,
        fhirObservation
    };
}
