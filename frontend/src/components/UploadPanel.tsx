import { useState, useRef } from 'react';
import { apiClient } from '../api/client';

interface UploadPanelProps {
  image1Id: string | null;
  image2Id: string | null;
  onUpload1: (imageId: string) => void;
  onUpload2: (imageId: string) => void;
}

export const UploadPanel = ({ image1Id, image2Id, onUpload1, onUpload2 }: UploadPanelProps) => {
  const [uploading1, setUploading1] = useState(false);
  const [uploading2, setUploading2] = useState(false);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, isImage1: boolean) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isImage1) setUploading1(true);
    else setUploading2(true);

    try {
      const response = await apiClient.uploadImage(file);
      if (isImage1) {
        onUpload1(response.image_id);
      } else {
        onUpload2(response.image_id);
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      if (isImage1) setUploading1(false);
      else setUploading2(false);

      if (isImage1 && fileInputRef1.current) fileInputRef1.current.value = '';
      if (!isImage1 && fileInputRef2.current) fileInputRef2.current.value = '';
    }
  };

  const loadPreset = (t0Id: string, t1Id?: string | null) => {
    onUpload1(t0Id);
    if (t1Id !== undefined) {
      if (t1Id) onUpload2(t1Id);
    }
  };

  const isPresetActive = (t0: string, t1?: string) => {
    if (t1) return image1Id === t0 && image2Id === t1;
    return image1Id === t0 && !image2Id;
  };

  return (
    <div className="panel upload-panel">
      <div className="panel-header">
        <h2 className="panel-title">Input</h2>
        <span className="badge badge--success">Ready</span>
      </div>

      {/* Preset Demo Selection */}
      <div className="preset-section">
        <div className="preset-label">Demo Presets</div>
        <div className="preset-grid">
          <button
            id="preset-optical"
            className={`preset-btn ${isPresetActive('demo-optical') ? 'is-active' : ''}`}
            onClick={() => loadPreset('demo-optical')}
          >
            Optical
          </button>
          <button
            id="preset-sar"
            className={`preset-btn ${isPresetActive('demo-sar') ? 'is-active' : ''}`}
            onClick={() => loadPreset('demo-sar')}
          >
            SAR Radar
          </button>
          <button
            id="preset-change"
            className={`preset-btn ${isPresetActive('demo-change-2020', 'demo-change-2024') ? 'is-active' : ''}`}
            onClick={() => loadPreset('demo-change-2020', 'demo-change-2024')}
          >
            Change (T0+T1)
          </button>
          <button
            id="preset-fusion"
            className={`preset-btn ${isPresetActive('demo-optical', 'demo-sar') ? 'is-active' : ''}`}
            onClick={() => loadPreset('demo-optical', 'demo-sar')}
          >
            Fusion
          </button>
          <button
            id="preset-disaster"
            className={`preset-btn ${isPresetActive('demo-disaster-pre', 'demo-disaster-post') ? 'is-active' : ''}`}
            onClick={() => loadPreset('demo-disaster-pre', 'demo-disaster-post')}
          >
            xView2 Disaster
          </button>
          <button
            id="preset-diff"
            className={`preset-btn ${isPresetActive('demo-diff-a', 'demo-diff-b') ? 'is-active' : ''}`}
            onClick={() => loadPreset('demo-diff-a', 'demo-diff-b')}
          >
            Different Place
          </button>
        </div>
      </div>

      {/* Upload Zone 1 (Baseline) */}
      <div className="upload-zone">
        <div className="upload-zone__header">
          <h3 className="upload-zone__title">Baseline (T0)</h3>
          {image1Id && <span className="badge badge--accent">Active</span>}
        </div>
        {image1Id ? (
          <div className="upload-zone__status">✓ {image1Id}</div>
        ) : (
          <div className="upload-zone__placeholder">
            {uploading1 ? 'Uploading…' : 'Select preset or upload file'}
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef1}
          onChange={(e) => handleFileChange(e, true)}
          accept="image/png, image/jpeg, image/tiff"
          className="hidden"
          aria-label="Upload baseline image"
        />
        <button
          className="btn btn--ghost btn--full btn--sm"
          onClick={() => fileInputRef1.current?.click()}
          disabled={uploading1}
          style={{ marginTop: 'var(--space-2)' }}
        >
          {image1Id ? 'Replace T0' : 'Upload File'}
        </button>
      </div>

      {/* Upload Zone 2 (Current) */}
      <div className="upload-zone">
        <div className="upload-zone__header">
          <h3 className="upload-zone__title">Current (T1)</h3>
          {image2Id && <span className="badge badge--accent">Active</span>}
        </div>
        {image2Id ? (
          <div className="upload-zone__status">✓ {image2Id}</div>
        ) : (
          <div className="upload-zone__placeholder">
            {uploading2 ? 'Uploading…' : 'For Change / Fusion analysis'}
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef2}
          onChange={(e) => handleFileChange(e, false)}
          accept="image/png, image/jpeg, image/tiff"
          className="hidden"
          aria-label="Upload current image"
        />
        <button
          className="btn btn--ghost btn--full btn--sm"
          onClick={() => fileInputRef2.current?.click()}
          disabled={uploading2}
          style={{ marginTop: 'var(--space-2)' }}
        >
          {image2Id ? 'Replace T1' : 'Upload File'}
        </button>
      </div>
    </div>
  );
};
