interface ResultPanelProps {
  result: any;
}

export const ResultPanel = ({ result }: ResultPanelProps) => {
  const hasResult = Boolean(result?.result?.answer);
  const changedRegions = result?.result?.changed_regions || [];
  const timeline = result?.result?.multi_temporal_timeline || [];
  const isBlocked = result?.status === 'blocked' || result?.result?.decision === 'BLOCK' || result?.result?.status === 'REJECTED';
  const validationReport = result?.result?.validation_report || (isBlocked ? result?.result : null);

  // Mathematical Land Cover & Objects Inventory
  const landCover = result?.result?.land_cover;
  const landCoverClasses = landCover?.classes || [];
  const detectedObjects = landCover?.detected_objects || [];
  const landCoverComparison = result?.result?.land_cover_comparison || [];

  return (
    <div className="panel result-panel">
      <div className="panel-header">
        <h2 className="panel-title">Findings</h2>
        {hasResult && (
          isBlocked ? (
            <span className="badge" style={{ background: 'rgba(229, 72, 77, 0.2)', color: '#FF6B6B', border: '1px solid #E5484D' }}>
              Blocked
            </span>
          ) : (
            <span className="badge badge--accent">
              {changedRegions.length > 0 ? `${changedRegions.length} Regions` : 'Verified'}
            </span>
          )
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
          <div className={`result-answer ${isBlocked ? 'result-answer--blocked' : ''}`} style={isBlocked ? { borderLeft: '3px solid #E5484D', background: 'rgba(229, 72, 77, 0.08)' } : {}}>
            <p style={{ margin: 0, color: isBlocked ? '#FF8787' : 'inherit' }}>{result.result.answer}</p>
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
                ❌ ANALYSIS BLOCKED — {validationReport.classification?.replace(/_/g, ' ') || 'LOCATION MISMATCH'}
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
                {validationReport.reason_codes?.join(' · ') || 'GEOGRAPHIC_MISMATCH · ZERO_SPATIAL_OVERLAP'}
              </div>
              {validationReport.distance && (
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-warning)', marginBottom: 'var(--space-1)' }}>
                  📍 Separation Distance: {validationReport.distance} (Spatial Overlap: {(validationReport.spatial_overlap ?? 0) * 100}%)
                </div>
              )}
              {validationReport.confidence_breakdown && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '4px',
                  marginTop: 'var(--space-2)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <span>Geographic: {((validationReport.confidence_breakdown.geographic_confidence ?? 0) * 100).toFixed(0)}%</span>
                  <span>Registration: {((validationReport.confidence_breakdown.registration_confidence ?? 0) * 100).toFixed(0)}%</span>
                  <span>Temporal: {((validationReport.confidence_breakdown.temporal_confidence ?? 0) * 100).toFixed(0)}%</span>
                  <span>Modality: {((validationReport.confidence_breakdown.modality_confidence ?? 0) * 100).toFixed(0)}%</span>
                </div>
              )}
              <div style={{
                marginTop: 'var(--space-2)',
                fontSize: 'var(--text-caption)',
                color: 'var(--color-text-muted)',
                fontStyle: 'italic'
              }}>
                💡 {validationReport.alternative_action || 'Run independent single-image VQA on each scene separately.'}
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
                      {region.mean_delta ? `Δ ${region.mean_delta}` : `~${((region.area_m2 || 0) / 10000).toFixed(1)} ha`}
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

          {/* Mathematical Surface Classification & Object Inventory */}
          {landCover && landCoverClasses.length > 0 && !isBlocked && (
            <div className="math-inventory-panel">
              <div className="math-inventory-header">
                <div className="math-inventory-title-group">
                  <span className="math-inventory-icon">📐</span>
                  <div>
                    <div className="math-inventory-title">Surface Classification & Object Inventory</div>
                    <div className="math-inventory-subtitle">
                      Calculated at {landCover.resolution_m_per_px || 10.0}m GSD · {landCover.total_area_ha?.toLocaleString() || (landCover.total_pixels ? (landCover.total_pixels * 0.01).toFixed(1) : 0)} ha Total Area
                    </div>
                  </div>
                </div>
                <span className="badge badge--accent text-mono" style={{ fontSize: '10px' }}>
                  {landCover.sensor_modality?.includes('SAR') ? 'Radar Backscatter' : 'Pixel-Level Indices'}
                </span>
              </div>

              {/* Multi-segment 100% Surface Coverage Bar */}
              <div className="math-composition-bar" title="100% Surface Coverage Breakdown">
                {landCoverClasses.map((cls: any) => (
                  <div
                    key={cls.id}
                    className="math-composition-segment"
                    style={{
                      width: `${Math.max(0, cls.percentage)}%`,
                      backgroundColor: cls.color
                    }}
                    title={`${cls.name}: ${cls.percentage}% (~${cls.area_ha} ha)`}
                  />
                ))}
              </div>

              {/* Land Cover Classes Detailed List */}
              <div className="math-classes-list">
                {landCoverClasses.map((cls: any) => (
                  <div key={cls.id} className="math-class-item">
                    <div className="math-class-header">
                      <div className="flex items-center gap-2">
                        <span className="math-class-icon">{cls.icon}</span>
                        <div className="flex-col">
                          <span className="math-class-name" style={{ color: 'var(--color-text)' }}>{cls.name}</span>
                          <span className="math-class-metric text-mono text-muted">
                            {cls.index_name}: {cls.index_val}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="math-class-pct text-mono" style={{ color: cls.color, fontWeight: '700' }}>
                          {cls.percentage}%
                        </span>
                        <div className="math-class-area text-mono text-muted">
                          {cls.area_ha?.toLocaleString()} ha ({cls.pixel_count?.toLocaleString()} px²)
                        </div>
                      </div>
                    </div>
                    <div className="math-class-progress-track">
                      <div
                        className="math-class-progress-fill"
                        style={{
                          width: `${Math.min(100, Math.max(0, cls.percentage))}%`,
                          backgroundColor: cls.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Discrete Detected Objects & Structural Targets */}
              {detectedObjects.length > 0 && (
                <div className="math-objects-section">
                  <div className="math-objects-header">
                    <span>Detected Discrete Targets & Features</span>
                    <span className="badge text-mono" style={{ fontSize: '10px', background: 'var(--color-surface-hover)' }}>
                      {detectedObjects.length} Categories
                    </span>
                  </div>
                  <div className="math-objects-grid">
                    {detectedObjects.map((obj: any, idx: number) => (
                      <div key={obj.id || idx} className="math-object-card">
                        <div className="math-object-top">
                          <span className="math-object-icon">{obj.icon}</span>
                          <span className="math-object-count text-mono">{obj.count} {obj.count === 1 ? 'Target' : 'Targets'}</span>
                        </div>
                        <div className="math-object-name">{obj.name}</div>
                        <div className="math-object-detail text-muted">{obj.details}</div>
                        {obj.confidence_rating && (
                          <div className="math-object-badge text-mono">{obj.confidence_rating}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bi-Temporal Comparison Dynamics (Change Detection) */}
              {landCoverComparison.length > 0 && (
                <div className="math-comparison-section">
                  <div className="math-comparison-header">
                    <span>Bi-Temporal Surface Dynamics (T0 ➔ T1)</span>
                    <span className="text-mono text-muted" style={{ fontSize: '10px' }}>Net Transition</span>
                  </div>
                  <div className="math-comparison-list">
                    {landCoverComparison.map((comp: any) => {
                      const isIncrease = comp.delta_ha > 0;
                      const isNeutral = comp.delta_ha === 0;
                      const sign = isIncrease ? '+' : '';
                      return (
                        <div key={comp.id} className="math-comparison-row">
                          <div className="flex items-center gap-1">
                            <span>{comp.icon}</span>
                            <span style={{ fontSize: 'var(--text-caption)' }}>{comp.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-mono" style={{ fontSize: '11px' }}>
                            <span className="text-muted">{comp.t0_ha} ha ➔ {comp.t1_ha} ha</span>
                            <span
                              style={{
                                fontWeight: '700',
                                color: isNeutral ? 'var(--color-text-muted)' : (isIncrease ? '#34C759' : '#FF6B6B')
                              }}
                            >
                              {sign}{comp.delta_ha} ha ({sign}{comp.delta_pct}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

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
