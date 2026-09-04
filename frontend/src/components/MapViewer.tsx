import { useState, useRef, useCallback } from 'react';

interface MapViewerProps {
  image1Id: string | null;
  image2Id: string | null;
  queryResult: any;
  activeRoi?: any | null;
  onRoiChange?: (roi: any | null) => void;
}

export const MapViewer = ({
  image1Id,
  image2Id,
  queryResult,
  activeRoi,
  onRoiChange
}: MapViewerProps) => {
  const API_BASE_URL = 'http://localhost:8000/api';
  const imageUrl1 = image1Id ? `${API_BASE_URL}/images/${image1Id}` : null;
  const imageUrl2 = image2Id ? `${API_BASE_URL}/images/${image2Id}` : null;

  const [isDrawMode, setIsDrawMode] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [liveBox, setLiveBox] = useState<[number, number, number, number] | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const grounding = queryResult?.result?.grounding || [];

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawMode || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setDragStart({ x: xPct, y: yPct });
    setLiveBox([xPct, yPct, 0, 0]);
  }, [isDrawMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawMode || !dragStart || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const currentY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const left = Math.min(dragStart.x, currentX);
    const top = Math.min(dragStart.y, currentY);
    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);

    setLiveBox([Math.round(left), Math.round(top), Math.round(width), Math.round(height)]);
  }, [isDrawMode, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawMode || !liveBox) return;
    const [x, y, w, h] = liveBox;
    if (w > 2 && h > 2 && onRoiChange) {
      onRoiChange({
        type: 'bbox',
        coordinates: [x, y, w, h],
        is_percentage: true
      });
      setIsDrawMode(false);
    }
    setDragStart(null);
    setLiveBox(null);
  }, [isDrawMode, liveBox, onRoiChange]);

  const renderImagePane = (url: string | null, label: string, isInteractive: boolean) => (
    <div
      className="map-viewer__pane"
      style={{ cursor: isInteractive && isDrawMode ? 'crosshair' : 'default', userSelect: 'none' }}
    >
      <div className="map-viewer__pane-label">{label}</div>
      {!url ? (
        <div className="map-viewer__empty">No image loaded</div>
      ) : (
        <div
          ref={isInteractive ? imageContainerRef : undefined}
          onMouseDown={isInteractive ? handleMouseDown : undefined}
          onMouseMove={isInteractive ? handleMouseMove : undefined}
          onMouseUp={isInteractive ? handleMouseUp : undefined}
          style={{ position: 'relative', width: '100%', height: '100%' }}
        >
          <img
            src={url}
            alt={label}
            className="map-viewer__image"
            draggable={false}
          />

          {/* SVG Overlay: Grounding BBoxes + Active ROI */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: isDrawMode ? 'none' : 'auto'
            }}
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Spatial overlays"
          >
            {/* Grounding overlays from query */}
            {grounding.map((g: any, index: number) => {
              const [x, y, w, h] = g.bbox;
              const isRoiContainer = g.is_roi_container;

              return (
                <g key={`grounding-${index}`}>
                  <rect
                    x={`${x}%`}
                    y={`${y}%`}
                    width={`${w}%`}
                    height={`${h}%`}
                    fill={isRoiContainer ? 'rgba(240, 160, 48, 0.12)' : 'rgba(61, 214, 208, 0.15)'}
                    stroke={isRoiContainer ? 'var(--color-warning)' : 'var(--color-accent)'}
                    strokeWidth={isRoiContainer ? '2' : '2'}
                    strokeDasharray={isRoiContainer ? '4 2' : 'none'}
                  />
                  <text
                    x={`${x}%`}
                    y={`${Math.max(2, y - 2)}%`}
                    fill={isRoiContainer ? 'var(--color-warning)' : 'var(--color-accent)'}
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                    fontWeight="600"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.85)' }}
                  >
                    {g.label}
                  </text>
                </g>
              );
            })}

            {/* Currently Active ROI (Drawn or passed in) */}
            {isInteractive && activeRoi && activeRoi.coordinates && (
              <g key="active-roi">
                <rect
                  x={`${activeRoi.coordinates[0]}%`}
                  y={`${activeRoi.coordinates[1]}%`}
                  width={`${activeRoi.coordinates[2]}%`}
                  height={`${activeRoi.coordinates[3]}%`}
                  fill="rgba(61, 214, 208, 0.08)"
                  stroke="var(--color-accent)"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
                <text
                  x={`${activeRoi.coordinates[0]}%`}
                  y={`${Math.max(2, activeRoi.coordinates[1] - 2)}%`}
                  fill="var(--color-accent)"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fontWeight="600"
                  style={{ textShadow: '1px 1px 2px black' }}
                >
                  📍 Target ROI [{activeRoi.coordinates[2]}%×{activeRoi.coordinates[3]}%]
                </text>
              </g>
            )}

            {/* Live drawing preview */}
            {isInteractive && liveBox && liveBox[2] > 0 && liveBox[3] > 0 && (
              <g key="live-box">
                <rect
                  x={`${liveBox[0]}%`}
                  y={`${liveBox[1]}%`}
                  width={`${liveBox[2]}%`}
                  height={`${liveBox[3]}%`}
                  fill="rgba(240, 160, 48, 0.2)"
                  stroke="var(--color-warning)"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
                <text
                  x={`${liveBox[0]}%`}
                  y={`${Math.max(2, liveBox[1] - 2)}%`}
                  fill="var(--color-warning)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  Drawing ROI [{liveBox[2]}%×{liveBox[3]}%]
                </text>
              </g>
            )}
          </svg>
        </div>
      )}
    </div>
  );

  return (
    <div className="panel map-viewer">
      <div className="map-viewer__header">
        <div className="flex items-center gap-2">
          <h2 className="panel-title">
            Viewer {image2Id && <span className="text-secondary" style={{ fontWeight: 'var(--weight-normal)' }}>Split</span>}
          </h2>
          {activeRoi && (
            <span className="badge badge--warning">
              ROI Selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {image1Id && (
            <button
              className={`btn btn--sm ${isDrawMode ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => {
                setIsDrawMode(!isDrawMode);
                setDragStart(null);
                setLiveBox(null);
              }}
              title="Click and drag on the image to select a sub-region for precision analysis"
            >
              {isDrawMode ? 'Cancel Drawing' : '🎯 Draw ROI Box'}
            </button>
          )}

          {activeRoi && onRoiChange && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => onRoiChange(null)}
              title="Clear selected Region-of-Interest"
            >
              ✕ Clear ROI
            </button>
          )}
        </div>
      </div>

      <div className="map-viewer__body">
        {renderImagePane(imageUrl1, "Baseline (T0)", true)}
        {image2Id && renderImagePane(imageUrl2, "Current (T1)", false)}
      </div>
    </div>
  );
};
