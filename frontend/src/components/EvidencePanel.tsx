interface EvidencePanelProps {
  queryResult: any;
}

export const EvidencePanel = ({ queryResult }: EvidencePanelProps) => {
  const evidence = queryResult?.result?.evidence || [];
  const hasEvidence = evidence.length > 0;

  return (
    <div className="panel evidence-panel">
      <div className="panel-header">
        <h2 className="panel-title">Evidence & Traceability</h2>
        {hasEvidence && (
          <span className="badge badge--success">
            {evidence.length} Step{evidence.length > 1 ? 's' : ''} Grounded
          </span>
        )}
      </div>

      {!hasEvidence ? (
        <div className="empty-state">
          <div className="empty-state__icon" aria-hidden="true">🔬</div>
          <div className="empty-state__text">No Trace Available</div>
          <div className="empty-state__hint">
            Step-by-step specialist model verification and confidence bounds will appear here.
          </div>
        </div>
      ) : (
        <div className="evidence-list">
          {evidence.map((ev: any, i: number) => {
            const conf = ev.confidence ?? 0;
            const isHigh = conf > 0.85;

            return (
              <div key={i} className="evidence-card">
                <div className="evidence-card__step">Step {i + 1}</div>
                <div className="evidence-card__desc">{ev.step}</div>

                <div className="flex items-center gap-2" style={{ marginTop: 'auto' }}>
                  <div className="result-confidence__track" style={{ height: '4px' }}>
                    <div
                      className={`result-confidence__fill ${
                        isHigh ? 'result-confidence__fill--high' : 'result-confidence__fill--medium'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, conf * 100))}%` }}
                    />
                  </div>
                  <span className="text-mono text-muted" style={{ fontSize: 'var(--text-micro)' }}>
                    {(conf * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
