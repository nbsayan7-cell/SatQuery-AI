import { useState } from 'react';
import { apiClient } from '../api/client';

interface QueryPanelProps {
  image1Id: string | null;
  image2Id: string | null;
  onQueryResult: (result: any) => void;
  activeRoi?: any | null;
  onClearRoi?: () => void;
}

export const QueryPanel = ({
  image1Id,
  image2Id,
  onQueryResult,
  activeRoi,
  onClearRoi
}: QueryPanelProps) => {
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    if (!image1Id) return;
    setLoading(true);
    try {
      if (activeRoi) {
        // Execute targeted Region-of-Interest analysis
        const res = await apiClient.analyzeRegion(
          image1Id,
          activeRoi,
          queryText || "Analyze features and land cover in this specific region",
          "vqa"
        );
        onQueryResult(res);
      } else {
        if (!queryText.trim()) return;
        const res = await apiClient.executeQuery(image1Id, queryText);
        onQueryResult(res);
      }
    } catch (e: any) {
      onQueryResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!image1Id) return;
    setLoading(true);
    try {
      const prompt = queryText.trim() || "Perform comprehensive high-precision multi-stage feature extraction and structural analysis";
      const res = await apiClient.analyzeEscalate(image1Id, prompt, image2Id);
      onQueryResult(res);
    } catch (e: any) {
      onQueryResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCaption = async () => {

    if (!image1Id) return;
    setLoading(true);
    try {
      if (activeRoi) {
        const res = await apiClient.analyzeRegion(
          image1Id,
          activeRoi,
          "Describe this sub-region in detail",
          "caption"
        );
        onQueryResult(res);
      } else {
        const res = await apiClient.generateCaption(image1Id);
        onQueryResult(res);
      }
    } catch (e: any) {
      onQueryResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!image1Id || !image2Id) return;
    setLoading(true);
    try {
      const res = await apiClient.compareImages(image1Id, image2Id);
      onQueryResult(res);
    } catch (e: any) {
      onQueryResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFusion = async () => {
    if (!image1Id || !image2Id) return;
    setLoading(true);
    try {
      const res = await apiClient.fuseImages(image1Id, image2Id);
      onQueryResult(res);
    } catch (e: any) {
      onQueryResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  return (
    <div className="panel query-panel">
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
        <h2 className="panel-title">Analysis</h2>
        {activeRoi && (
          <span className="badge badge--warning">
            ROI Precision Mode
          </span>
        )}
      </div>

      {activeRoi && (
        <div
          style={{
            background: 'var(--color-warning-dim)',
            border: '1px solid var(--color-warning)',
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'var(--text-caption)'
          }}
        >
          <span style={{ color: 'var(--color-warning)' }}>
            🎯 Target: {activeRoi.coordinates[2]}% × {activeRoi.coordinates[3]}% box
          </span>
          {onClearRoi && (
            <button
              onClick={onClearRoi}
              className="btn btn--ghost btn--sm"
              style={{ padding: '0 4px', fontSize: '10px' }}
            >
              Reset
            </button>
          )}
        </div>
      )}

      <textarea
        className="textarea query-input"
        placeholder={
          activeRoi
            ? "Ask about this selected region…\ne.g. 'Are there buildings or roads here?'"
            : image1Id
            ? "Ask a question about the image…\ne.g. 'Are there any ships visible?'"
            : "Upload an image to begin analysis."
        }
        value={queryText}
        onChange={(e) => setQueryText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!image1Id || loading}
        aria-label="Analysis query"
      />

      <div className="query-actions">
        <button
          className={`btn ${activeRoi ? 'btn--secondary' : 'btn--primary'} btn--full`}
          onClick={handleQuery}
          disabled={!image1Id || (!activeRoi && !queryText.trim()) || loading}
          style={activeRoi ? { borderColor: 'var(--color-warning)', color: 'var(--color-warning)' } : {}}
        >
          {loading
            ? 'Analyzing…'
            : activeRoi
            ? '🎯 Analyze Selected ROI'
            : 'Run Query'}
        </button>

        <button
          className="btn btn--secondary btn--full"
          onClick={handleEscalate}
          disabled={!image1Id || loading}
          style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
        >
          ⚡ High-Precision Escalation (TTA + Tiling)
        </button>

        <button
          className="btn btn--secondary btn--full"
          onClick={handleCaption}
          disabled={!image1Id || loading}
        >
          {activeRoi ? 'Describe Selected ROI' : 'Scene Description'}
        </button>


        <button
          className="btn btn--secondary btn--full"
          onClick={handleCompare}
          disabled={!image1Id || !image2Id || loading}
        >
          Change Detection (T0 → T1)
        </button>

        <button
          className="btn btn--secondary btn--full"
          onClick={handleFusion}
          disabled={!image1Id || !image2Id || loading}
        >
          Optical + SAR Fusion
        </button>
      </div>
    </div>
  );
};
