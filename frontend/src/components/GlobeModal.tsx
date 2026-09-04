import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface GlobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImagery: (imageId: string, date: string, name: string) => void;
}

export const GlobeModal = ({ isOpen, onClose, onSelectImagery }: GlobeModalProps) => {
  const [showcases, setShowcases] = useState<any[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      apiClient.getTeeShowcases()
        .then(res => {
          if (res.showcases?.length) {
            setShowcases(res.showcases);
            setSelectedLoc(res.showcases[0]);
            setSelectedDate(res.showcases[0].available_dates[0]);
          }
        })
        .catch(err => setError(err.message));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!selectedLoc || !selectedDate) return;
    setExtracting(true);
    setError(null);
    try {
      const res = await apiClient.extractTeeImagery(
        selectedLoc.bbox,
        selectedDate,
        selectedLoc.id
      );
      onSelectImagery(res.image_id, selectedDate, selectedLoc.name);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal modal--lg"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '90%' }}
      >
        <div className="modal__header">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '20px' }}>🌍</span>
            <h3 className="modal__title">God&apos;s Eye 3D Earth Explorer (TEE)</h3>
            <span className="badge badge--neutral" style={{ fontSize: '10px' }}>NASA GIBS / Open STAC</span>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <div className="modal__body flex-col gap-4">
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>
            Select a verified global showcase sector to retrieve historical satellite imagery across dates from licensed open providers without illegal tile scraping.
          </p>

          {/* Interactive Globe / Map Graphic Card */}
          <div
            style={{
              height: '240px',
              borderRadius: 'var(--radius-md)',
              background: 'radial-gradient(circle at 50% 50%, #152438 0%, #080D14 100%)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Grid coordinate overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(61, 214, 208, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(61, 214, 208, 0.08) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                pointerEvents: 'none'
              }}
            />

            {/* Simulated Globe Sphere */}
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #2a5a7a 0%, #0d223a 60%, #040e1c 100%)',
                boxShadow: '0 0 35px rgba(61, 214, 208, 0.25), inset -10px -10px 25px rgba(0,0,0,0.8)',
                border: '1px solid rgba(61, 214, 208, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent)',
                fontSize: '24px'
              }}
            >
              🌐
            </div>

            <div style={{ position: 'absolute', bottom: '12px', left: '16px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Selected Bounding Box: [{selectedLoc?.bbox.join(', ')}]
            </div>
            <div style={{ position: 'absolute', bottom: '12px', right: '16px', fontSize: '11px', color: 'var(--color-accent)' }}>
              License: Public Domain (RULE 013 Compliant)
            </div>
          </div>

          {/* Showcase Sector Picker */}
          <div className="flex-col gap-2">
            <label style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              CHOOSE GLOBAL SHOWCASE LOCATION:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
              {showcases.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    setSelectedLoc(loc);
                    setSelectedDate(loc.available_dates[0]);
                  }}
                  className={`btn ${selectedLoc?.id === loc.id ? 'btn--primary' : 'btn--secondary'}`}
                  style={{ textAlign: 'left', fontSize: '11px', padding: '8px 10px', height: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}
                >
                  <span style={{ fontWeight: '600' }}>{loc.name}</span>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>{loc.available_dates.length} temporal snapshots</span>
                </button>
              ))}
            </div>
          </div>

          {/* Temporal Date Selection */}
          {selectedLoc && (
            <div className="flex-col gap-2">
              <label style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                SELECT HISTORICAL ACQUISITION DATE:
              </label>
              <div className="flex gap-2">
                {selectedLoc.available_dates.map((d: string) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`btn ${selectedDate === d ? 'btn--secondary' : 'btn--ghost'} btn--sm`}
                    style={selectedDate === d ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent)' } : {}}
                  >
                    📅 {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-caption)' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="modal__footer flex justify-between items-center">
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Stores directly into SatQuery image pipeline
          </span>
          <div className="flex gap-2">
            <button className="btn btn--secondary btn--sm" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn--primary btn--sm"
              onClick={handleExtract}
              disabled={extracting || !selectedLoc}
            >
              {extracting ? 'Extracting Satellite Tiles…' : '📥 Extract & Load Scene'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
