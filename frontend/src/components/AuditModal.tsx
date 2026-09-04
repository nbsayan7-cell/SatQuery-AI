import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

interface AuditModalProps {
  onClose: () => void;
}

export const AuditModal = ({ onClose }: AuditModalProps) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await apiClient.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error("Failed to load audit logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
    >
      <div className="panel modal-content">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <h2 id="audit-modal-title" className="panel-title" style={{ fontSize: 'var(--text-h2)' }}>
              Execution Audit Trail
            </h2>
            <span className="badge badge--accent">ISRO R7 Traceable</span>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close audit log dialog"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="empty-state">
              <div className="empty-state__icon" aria-hidden="true">⏳</div>
              <div className="empty-state__text">Loading audit logs…</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon" aria-hidden="true">📋</div>
              <div className="empty-state__text">No queries executed yet.</div>
              <div className="empty-state__hint">
                Executed queries, models, and timestamps will appear here in chronological order.
              </div>
            </div>
          ) : (
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Query</th>
                  <th>Model Used</th>
                  <th style={{ textAlign: 'right' }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const conf = log.confidence ?? 0;
                  const isHigh = conf > 0.8;
                  return (
                    <tr key={i}>
                      <td className="text-mono text-muted" style={{ fontSize: 'var(--text-caption)' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ fontWeight: 'var(--weight-medium)' }}>{log.query}</td>
                      <td className="text-mono text-secondary" style={{ fontSize: 'var(--text-caption)' }}>
                        {log.model_used}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span
                          className={`badge ${isHigh ? 'badge--success' : 'badge--warning'}`}
                        >
                          {(conf * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
