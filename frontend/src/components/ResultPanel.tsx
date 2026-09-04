interface ResultPanelProps {
  result: any;
}

export const ResultPanel = ({ result }: ResultPanelProps) => {
  const hasResult = Boolean(result?.result?.answer);
  const confidence = result?.result?.confidence ?? 0;
  const isHighConfidence = confidence >= 0.8;
  const changedRegions = result?.result?.changed_regions || [];
  const timeline = result?.result?.multi_temporal_timeline || [];
  const isBlocked = result?.status === 'blocked';
  const validationReport = result?.result?.validation_report || null;

  return (
    <div className="panel result-panel">
      <div className="panel-header">
        <h2 className="panel-title">Findings</h2>
        {hasResult && (
          <span className="badge badge--accent">
            {changedRegions.length > 0 ? `${changedRegions.length} Regions` : 'Verified'}
          </span>
        )}
      </div>

      {!hasResult ? (
        <div className="empty-state">
          <div className="empty-state__icon" aria-hidden="true">🛰️</div>
          <div className="empty-state__text">Awaiting Analysis</div>
          <div className="empty-state__hint">
            Execute a query or select a preset to view AI findings and telemetry.
          </div>
        </div>
      ) : (
        <div className="flex-col gap-3 flex-1 overflow-y-auto">
          <div className="result-answer">
            <p style={{ margin: 0 }}>{result.result.answer}</p>
          </div>

          {/* SQ-039: Blocked Analysis Safety Banner */}
          {isBlocked && validationReport && (
            <div
              style={{
                background: 'rgba(229, 72, 77, 0.12)',
                border: '1px solid var(--color-error, #E5484D)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-3)',
                marginTop: 'var(--space-2)'
              }}
            >
              <div style={{
                fontSize: 'var(--text-caption)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-error, #E5484D)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wide)',
                marginBottom: 'var(--space-2)'
              }}>
                ❌ ANALYSIS BLOCKED — {validationReport.classification?.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>
                {validationReport.reason_codes?.join(' · ')}
              </div>
              {validationReport.confidence_breakdown && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '4px',
                  marginTop: 'var(--space-2)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <span>Geographic: {(validationReport.confidence_breakdown.geographic_confidence * 100).toFixed(0)}%</span>
                  <span>Registration: {(validationReport.confidence_breakdown.registration_confidence * 100).toFixed(0)}%</span>
                  <span>Temporal: {(validationReport.confidence_breakdown.temporal_confidence * 100).toFixed(0)}%</span>
                  <span>Modality: {(validationReport.confidence_breakdown.modality_confidence * 100).toFixed(0)}%</span>
                </div>
              )}
              <div style={{
                marginTop: 'var(--space-2)',
                fontSize: 'var(--text-caption)',
                color: 'var(--color-text-muted)',
                fontStyle: 'italic'
              }}>
                💡 {validationReport.alternative_action}
              </div>
            </div>
          )}

          {/* Spatially-Resolved Change Inventory (SQ-036) */}
          {changedRegions.length > 0 && (
            <div
              style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-3)'
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-caption)',
                  color: 'var(--color-text-muted)',
                  fontWeight: 'var(--weight-semibold)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wide)',
                  marginBottom: 'var(--space-2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Changed Sectors ({changedRegions.length})</span>
                <span>Ranked by Area</span>
              </div>

              <div className="flex-col gap-2">
                {changedRegions.map((region: any, i: number) => (
                  <div
                    key={region.region_id || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-2)',
                      background: 'var(--color-surface-hover)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `3px solid ${region.color || 'var(--color-accent)'}`,
                      fontSize: 'var(--text-caption)'
                    }}
                  >
                    <div className="flex-col" style={{ gap: '2px' }}>
                      <div className="flex items-center gap-1">
                        <span className="text-mono" style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                          {region.region_id}
                        </span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {region.change_type}
                        </span>
                      </div>
                      <span className="text-mono text-muted" style={{ fontSize: '10px' }}>
                        Area: {region.area_px?.toLocaleString()} px² (~{(region.area_m2 / 10000).toFixed(1)} ha)
                      </span>
                    </div>

                    <span
                      className="text-mono"
                      style={{
                        color: region.color || 'var(--color-accent)',
                        fontWeight: '600',
                        fontSize: '11px'
                      }}
                    >
                      {(region.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Temporal Timeline Trajectory */}
          {timeline.length > 0 && (
            <div
              style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-3)'
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-caption)',
                  color: 'var(--color-text-muted)',
                  fontWeight: '600',
                  marginBottom: 'var(--space-2)'
                }}
              >
                Multi-Temporal Trajectory
              </div>
              <div className="flex-col gap-1">
                {timeline.map((step: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 'var(--text-caption)',
                      padding: '4px 0',
                      borderBottom: '1px solid var(--color-border)'
                    }}
                  >
                    <span className="text-mono">{step.interval}</span>
                    <span style={{ color: 'var(--color-accent)' }}>{step.top_change}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="result-confidence">
            <div className="result-confidence__label">Detection Confidence</div>
            <div className="result-confidence__bar">
              <div className="result-confidence__track">
                <div
                  className={`result-confidence__fill ${
                    isHighConfidence
                      ? 'result-confidence__fill--high'
                      : 'result-confidence__fill--medium'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, confidence * 100))}%` }}
                />
              </div>
              <span className="result-confidence__value">
                {(confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="result-model">
            Engine:{' '}
            <span className="result-model__name">
              {result.result.model_used || 'Standard RS Pipeline'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
