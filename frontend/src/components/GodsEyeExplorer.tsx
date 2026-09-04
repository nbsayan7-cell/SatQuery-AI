import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../api/client';

/**
 * Google-Earth-Style 3D Earth Explorer & Temporal Observation Timeline (SQ-041).
 * Features:
 * - Intuitive globe navigation (drag, tilt, rotate, zoom in/out, home, compass reset)
 * - Live geographic search (OSM Nominatim & coordinate parsing) with smooth fly-to
 * - Continuous user timeline (2015-2026) with DISCRETE VERIFIED OBSERVATIONS from Copernicus STAC
 * - Honest observation availability: shows exact Sentinel-1 / Sentinel-2 / Landsat scenes with metadata
 * - Direct "ANALYZE THIS VIEW" integration connecting the 3D globe to SatQuery AI
 * - Direct "COMPARE DATES" bitemporal selection respecting SatQuery pair validation
 */

interface GodsEyeExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImagery: (imageId: string) => void;
  onCompareImagery?: (imageId1: string, imageId2: string) => void;
}

const SHOWCASE_SECTORS = [
  { id: 'dubai', name: 'Dubai Waterfront', lat: 25.2048, lon: 55.2708, height: 22000, desc: 'Urban development & reclamation' },
  { id: 'kolkata', name: 'Kolkata Metropolitan Area', lat: 22.5726, lon: 88.3639, height: 28000, desc: 'Urban expansion & delta monitoring' },
  { id: 'hanoi', name: 'Hanoi Red River Delta', lat: 21.0285, lon: 105.8542, height: 25000, desc: 'Agricultural floodplain monitoring' },
  { id: 'joplin', name: 'Joplin Tornado Track', lat: 37.0842, lon: -94.5133, height: 16000, desc: 'Disaster damage assessment' },
  { id: 'amazon', name: 'Amazon Deforestation Front', lat: -3.4653, lon: -58.3800, height: 45000, desc: 'Vegetation loss tracking' },
  { id: 'glacier', name: 'Gangotri Glacier', lat: 30.9300, lon: 79.0800, height: 30000, desc: 'Glacial retreat measurement' },
];

const ESRI_WORLD_IMAGERY_URL = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer';

export const GodsEyeExplorer = ({
  isOpen,
  onClose,
  onSelectImagery,
  onCompareImagery,
}: GodsEyeExplorerProps) => {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  // State
  const [coords, setCoords] = useState({ lat: 25.2048, lon: 55.2708, alt: 22000 });
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Search & Geocoding
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Temporal Timeline
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedSensor, setSelectedSensor] = useState<'ALL' | 'SENTINEL-2' | 'SENTINEL-1'>('ALL');
  const [observations, setObservations] = useState<any[]>([]);
  const [selectedObservation, setSelectedObservation] = useState<any | null>(null);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);

  // Comparison mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareDateA, setCompareDateA] = useState<string>('2020-06-15');
  const [compareDateB, setCompareDateB] = useState<string>('2024-06-15');
  const [isExtracting, setIsExtracting] = useState(false);

  // Active AOI bounding box
  const currentBBox = [
    Number((coords.lon - 0.08).toFixed(4)),
    Number((coords.lat - 0.08).toFixed(4)),
    Number((coords.lon + 0.08).toFixed(4)),
    Number((coords.lat + 0.08).toFixed(4)),
  ];

  // Initialize Cesium 3D Globe
  useEffect(() => {
    if (!isOpen || !cesiumContainerRef.current) return;

    let isMounted = true;
    let creditEl: HTMLDivElement | null = null;

    const initCesium = async () => {
      try {
        const Cesium = (window as any).Cesium;
        if (!Cesium) {
          if (isMounted) setTimeout(initCesium, 300);
          return;
        }

        if (viewerRef.current) {
          try {
            viewerRef.current.destroy();
          } catch (e) {
            // ignore
          }
          viewerRef.current = null;
        }

        creditEl = document.createElement('div');
        creditEl.id = 'satquery-cesium-credits';
        creditEl.style.cssText = 'position:fixed;bottom:-100px;left:0;pointer-events:none;opacity:0;';
        document.body.appendChild(creditEl);

        const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
          timeline: false,
          animation: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          fullscreenButton: false,
          vrButton: false,
          selectionIndicator: false,
          infoBox: false,
          baseLayer: false,
          creditContainer: creditEl,
          msaaSamples: 4,
          contextOptions: { webgl: { preserveDrawingBuffer: true } },
        });

        viewerRef.current = viewer;
        viewer.targetFrameRate = 60;

        viewer.scene.globe.show = true;
        viewer.scene.globe.enableLighting = true;
        viewer.scene.skyAtmosphere.show = true;
        viewer.scene.skyAtmosphere.atmosphereLightIntensity = 18;
        viewer.scene.skyAtmosphere.saturationShift = -0.12;
        viewer.scene.skyAtmosphere.brightnessShift = -0.08;

        // Esri Satellite Basemap with OSM fallback
        try {
          const esriProvider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
            ESRI_WORLD_IMAGERY_URL,
            {
              credit: 'Powered by Esri — Source: Esri, Maxar, Earthstar Geographics, and GIS Community',
              enablePickFeatures: false,
            }
          );
          if (!isMounted || !viewerRef.current) return;
          viewer.imageryLayers.add(new Cesium.ImageryLayer(esriProvider));
        } catch (esriErr) {
          if (!isMounted || !viewerRef.current) return;
          const osmProvider = new Cesium.OpenStreetMapImageryProvider({
            url: 'https://tile.openstreetmap.org/',
            credit: '© OpenStreetMap contributors',
          });
          viewer.imageryLayers.add(new Cesium.ImageryLayer(osmProvider));
        }

        // Add pins for showcase sectors
        SHOWCASE_SECTORS.forEach((sec) => {
          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(sec.lon, sec.lat),
            point: {
              pixelSize: 8,
              color: Cesium.Color.fromCssColorString('#3DD6D0'),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
            },
            label: {
              text: sec.name,
              font: '12px "JetBrains Mono", monospace',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -16),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2000000),
            },
          });
        });

        // Mouse tracking for coordinate HUD
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement: any) => {
          if (!isMounted) return;
          const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
          if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            setCoords({
              lat: Number(Cesium.Math.toDegrees(cartographic.latitude).toFixed(4)),
              lon: Number(Cesium.Math.toDegrees(cartographic.longitude).toFixed(4)),
              alt: Math.round(viewer.camera.positionCartographic.height),
            });
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // Fly camera to default view (Dubai Waterfront)
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(55.2708, 25.2048, 22000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-55),
            roll: 0.0,
          },
          duration: 2.5,
        });

        if (isMounted) setMapStatus('ready');
      } catch (err) {
        console.error('[GodsEye] Cesium initialization error:', err);
        if (isMounted) setMapStatus('error');
      }
    };

    initCesium();

    return () => {
      isMounted = false;
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        viewerRef.current = null;
      }
      if (creditEl && creditEl.parentNode) {
        creditEl.parentNode.removeChild(creditEl);
      }
    };
  }, [isOpen]);

  // Query Copernicus Catalog when Year, Sensor, or Location changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsSearchingCatalog(true);
    setCatalogMessage(null);

    const startDate = `${selectedYear}-01-01`;
    const endDate = `${selectedYear}-12-31`;

    apiClient
      .searchCatalog({
        bbox: currentBBox,
        startDate,
        endDate,
        sensor: selectedSensor,
        cloudMax: 30.0,
        limit: 8,
      })
      .then((res) => {
        if (!isMounted) return;
        const catalog = res.catalog || {};
        const obs = catalog.observations || [];
        setObservations(obs);
        setCatalogMessage(catalog.message || null);
        if (obs.length > 0) {
          setSelectedObservation(obs[0]);
        } else {
          setSelectedObservation(catalog.nearest_available || null);
        }
      })
      .catch((e) => {
        if (!isMounted) return;
        setCatalogMessage(`Catalog discovery notice: ${e.message}`);
      })
      .finally(() => {
        if (isMounted) setIsSearchingCatalog(false);
      });
  }, [selectedYear, selectedSensor, coords.lat, coords.lon, isOpen]);

  // Google-Earth Camera Navigation Controls
  const handleZoomIn = () => {
    const viewer = viewerRef.current;
    if (viewer) viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.35);
  };

  const handleZoomOut = () => {
    const viewer = viewerRef.current;
    if (viewer) viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.45);
  };

  const handleResetNorth = () => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (viewer && Cesium) {
      viewer.camera.flyTo({
        destination: viewer.camera.position,
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: viewer.camera.pitch,
          roll: 0.0,
        },
        duration: 1.0,
      });
    }
  };

  const handleResetHome = () => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (viewer && Cesium) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(55.2708, 25.2048, 22000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-55),
          roll: 0.0,
        },
        duration: 2.0,
      });
    }
  };

  // Fly to target coordinate / location
  const flyToLocation = (lat: number, lon: number, height: number = 22000) => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (viewer && Cesium) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-50),
          roll: 0.0,
        },
        duration: 2.0,
      });
    }
  };

  // Geocoding Search Submission
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const res = await apiClient.geocodeLocation(searchQuery);
      setSearchResults(res.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select Search Candidate
  const handleSelectSearchResult = (cand: any) => {
    flyToLocation(cand.lat, cand.lon, 25000);
    setShowSearchResults(false);
    setSearchQuery(cand.name);
  };

  // Extract Scene & Send to SatQuery Analysis Workspace
  const handleAnalyzeThisView = async () => {
    setIsExtracting(true);
    try {
      const targetDate = selectedObservation ? selectedObservation.date : `${selectedYear}-06-15`;
      const res = await apiClient.extractTeeImagery(currentBBox, targetDate);
      if (res?.image_id) {
        onSelectImagery(res.image_id);
        onClose();
      }
    } catch (e: any) {
      alert(`Could not extract view: ${e.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Temporal Compare Trigger
  const handleExecuteComparison = async () => {
    setIsExtracting(true);
    try {
      const resA = await apiClient.extractTeeImagery(currentBBox, compareDateA);
      const resB = await apiClient.extractTeeImagery(currentBBox, compareDateB);
      if (resA?.image_id && resB?.image_id) {
        if (onCompareImagery) {
          onCompareImagery(resA.image_id, resB.image_id);
        } else {
          onSelectImagery(resB.image_id);
        }
        onClose();
      }
    } catch (e: any) {
      alert(`Comparison preparation failed: ${e.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="gods-eye-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#070A12',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"JetBrains Mono", "Inter", monospace',
      }}
    >
      {/* Top Header Bar: Branding + Search Bar + Telemetry + Close */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 18px',
          borderBottom: '1px solid rgba(61, 214, 208, 0.2)',
          background: 'rgba(7, 10, 18, 0.95)',
          backdropFilter: 'blur(16px)',
          gap: '16px',
        }}
      >
        {/* Left Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <span style={{ color: '#3DD6D0', fontSize: '14px', fontWeight: 700, letterSpacing: '2px' }}>
            🌍 3D EARTH EXPLORER
          </span>
          <span style={{ color: 'rgba(180, 210, 255, 0.6)', fontSize: '11px', letterSpacing: '1px' }}>
            COPERNICUS STAC · SENTINEL & LANDSAT
          </span>
        </div>

        {/* Center: Search Box */}
        <div style={{ position: 'relative', flex: '1', maxWidth: '440px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Search location (e.g. Kolkata, Dubai, or 22.57, 88.36)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchResults(true)}
              style={{
                flex: 1,
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(61, 214, 208, 0.3)',
                borderRadius: '6px',
                padding: '7px 12px',
                color: '#E2E8F0',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isSearching}
              style={{
                background: 'rgba(61, 214, 208, 0.15)',
                border: '1px solid rgba(61, 214, 208, 0.5)',
                color: '#3DD6D0',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isSearching ? '...' : 'FIND'}
            </button>
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: '#0B1120',
                border: '1px solid rgba(61, 214, 208, 0.3)',
                borderRadius: '6px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                zIndex: 100,
                maxHeight: '220px',
                overflowY: 'auto',
              }}
            >
              {searchResults.map((cand, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSearchResult(cand)}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: '#E2E8F0',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(61, 214, 208, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontWeight: 600, color: '#3DD6D0' }}>{cand.name}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(180, 210, 255, 0.6)' }}>
                    {cand.display_name} · [{cand.lat.toFixed(3)}°, {cand.lon.toFixed(3)}°]
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Telemetry & Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: mapStatus === 'ready' ? 'rgba(61, 214, 208, 0.15)' : mapStatus === 'error' ? 'rgba(229, 72, 77, 0.2)' : 'rgba(251, 191, 36, 0.2)',
              color: mapStatus === 'ready' ? '#3DD6D0' : mapStatus === 'error' ? '#E5484D' : '#FBBF24',
              border: `1px solid ${mapStatus === 'ready' ? 'rgba(61, 214, 208, 0.4)' : mapStatus === 'error' ? 'rgba(229, 72, 77, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`,
              fontWeight: 600,
            }}
          >
            {mapStatus.toUpperCase()}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(61, 214, 208, 0.85)' }}>
            {coords.lat.toFixed(4)}° N · {coords.lon.toFixed(4)}° E · ALT: {coords.alt?.toLocaleString()}m
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(229, 72, 77, 0.15)',
              border: '1px solid rgba(229, 72, 77, 0.4)',
              color: '#E5484D',
              padding: '6px 12px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            ✕ CLOSE
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Cesium Globe Canvas */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          <div
            id="cesiumContainer"
            ref={cesiumContainerRef}
            style={{ width: '100%', height: '100%' }}
          />

          {/* Floating Google-Earth-style Navigation Cluster (Right Side) */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              zIndex: 30,
            }}
          >
            <button
              title="Reset to North Orientation"
              onClick={handleResetNorth}
              style={{
                width: '38px',
                height: '38px',
                background: 'rgba(11, 17, 32, 0.85)',
                border: '1px solid rgba(61, 214, 208, 0.4)',
                borderRadius: '8px',
                color: '#3DD6D0',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                backdropFilter: 'blur(6px)',
              }}
            >
              🧭 N
            </button>
            <button
              title="Zoom In"
              onClick={handleZoomIn}
              style={{
                width: '38px',
                height: '38px',
                background: 'rgba(11, 17, 32, 0.85)',
                border: '1px solid rgba(61, 214, 208, 0.4)',
                borderRadius: '8px',
                color: '#E2E8F0',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '16px',
                backdropFilter: 'blur(6px)',
              }}
            >
              +
            </button>
            <button
              title="Zoom Out"
              onClick={handleZoomOut}
              style={{
                width: '38px',
                height: '38px',
                background: 'rgba(11, 17, 32, 0.85)',
                border: '1px solid rgba(61, 214, 208, 0.4)',
                borderRadius: '8px',
                color: '#E2E8F0',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '16px',
                backdropFilter: 'blur(6px)',
              }}
            >
              −
            </button>
            <button
              title="Fly to Home Location"
              onClick={handleResetHome}
              style={{
                width: '38px',
                height: '38px',
                background: 'rgba(11, 17, 32, 0.85)',
                border: '1px solid rgba(61, 214, 208, 0.4)',
                borderRadius: '8px',
                color: '#E2E8F0',
                cursor: 'pointer',
                fontSize: '14px',
                backdropFilter: 'blur(6px)',
              }}
            >
              🏠
            </button>
          </div>

          {/* Quick Showcase Sectors Badge Bar */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              display: 'flex',
              gap: '6px',
              zIndex: 30,
              flexWrap: 'wrap',
              maxWidth: '650px',
            }}
          >
            {SHOWCASE_SECTORS.map((s) => (
              <button
                key={s.id}
                onClick={() => flyToLocation(s.lat, s.lon, s.height)}
                style={{
                  background: 'rgba(11, 17, 32, 0.75)',
                  border: '1px solid rgba(61, 214, 208, 0.3)',
                  color: 'rgba(226, 232, 240, 0.9)',
                  padding: '5px 10px',
                  borderRadius: '16px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                📍 {s.name}
              </button>
            ))}
          </div>

          {/* Bottom Historical Timeline Bar (Continuous Year Slider + Discrete Verified Observations) */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '24px',
              right: '360px',
              background: 'rgba(11, 17, 32, 0.92)',
              border: '1px solid rgba(61, 214, 208, 0.35)',
              borderRadius: '10px',
              padding: '12px 18px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Timeline Controls Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#3DD6D0', letterSpacing: '1px' }}>
                  ⏳ EARTH OBSERVATION TIMELINE
                </span>
                <span style={{ fontSize: '10px', color: 'rgba(180, 210, 255, 0.6)' }}>
                  Selected Year: <strong style={{ color: '#FFF' }}>{selectedYear}</strong>
                </span>
              </div>

              {/* Sensor Filter */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['ALL', 'SENTINEL-2', 'SENTINEL-1'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedSensor(mode)}
                    style={{
                      background: selectedSensor === mode ? 'rgba(61, 214, 208, 0.25)' : 'transparent',
                      border: selectedSensor === mode ? '1px solid #3DD6D0' : '1px solid rgba(255,255,255,0.1)',
                      color: selectedSensor === mode ? '#3DD6D0' : 'rgba(255,255,255,0.6)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      cursor: 'pointer',
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Continuous Slider with Year Ticks */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>2016</span>
              <input
                type="range"
                min="2016"
                max="2026"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: '#3DD6D0',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>2026</span>
            </div>

            {/* Discrete Observations Discovery Strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
              <span style={{ fontSize: '9px', color: 'rgba(180, 210, 255, 0.7)', flexShrink: 0 }}>
                {isSearchingCatalog ? 'DISCOVERING SCENES...' : 'VERIFIED OBSERVATIONS:'}
              </span>

              {observations.length > 0 ? (
                observations.map((obs) => (
                  <button
                    key={obs.scene_id}
                    onClick={() => setSelectedObservation(obs)}
                    style={{
                      background: selectedObservation?.scene_id === obs.scene_id
                        ? 'rgba(61, 214, 208, 0.3)'
                        : 'rgba(30, 41, 59, 0.6)',
                      border: selectedObservation?.scene_id === obs.scene_id
                        ? '1px solid #3DD6D0'
                        : '1px solid rgba(255,255,255,0.1)',
                      color: selectedObservation?.scene_id === obs.scene_id ? '#3DD6D0' : '#CBD5E1',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>●</span>
                    <span>{obs.date}</span>
                    <span style={{ fontSize: '8px', opacity: 0.7 }}>({obs.sensor.split(' ')[0]})</span>
                  </button>
                ))
              ) : (
                <span style={{ fontSize: '9px', color: '#FBBF24' }}>
                  ○ {catalogMessage || 'No exact observation found for this year. Showing nearest available scene.'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Observation Metadata HUD & Analysis Connection */}
        <div
          style={{
            width: '340px',
            background: 'rgba(11, 17, 32, 0.96)',
            borderLeft: '1px solid rgba(61, 214, 208, 0.2)',
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            zIndex: 40,
          }}
        >
          {/* Metadata Card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(61, 214, 208, 0.25)',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '10px', color: '#3DD6D0', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>
              📡 OBSERVATION METADATA (CDSE STAC)
            </div>

            {selectedObservation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>SENSOR:</span>
                  <span style={{ color: '#FFF', fontWeight: 600 }}>{selectedObservation.sensor}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>ACQUIRED:</span>
                  <span style={{ color: '#3DD6D0' }}>{selectedObservation.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>MODALITY:</span>
                  <span style={{ color: '#FFF' }}>{selectedObservation.modality}</span>
                </div>
                {selectedObservation.cloud_cover !== null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>CLOUD COVER:</span>
                    <span style={{ color: '#FFF' }}>{selectedObservation.cloud_cover}%</span>
                  </div>
                )}
                {selectedObservation.polarization && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>POLARIZATION:</span>
                    <span style={{ color: '#FFF' }}>{selectedObservation.polarization.join(', ')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>RESOLUTION:</span>
                  <span style={{ color: '#FFF' }}>{selectedObservation.resolution_m}m ground GSD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>PROVIDER:</span>
                  <span style={{ color: 'rgba(180, 210, 255, 0.8)', fontSize: '10px' }}>
                    {selectedObservation.provider}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                No active observation selected. Select a year from the timeline or search an AOI.
              </div>
            )}
          </div>

          {/* Primary Action: ANALYZE THIS VIEW */}
          <button
            onClick={handleAnalyzeThisView}
            disabled={isExtracting}
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, rgba(61, 214, 208, 0.3), rgba(14, 165, 233, 0.2))',
              border: '1px solid #3DD6D0',
              borderRadius: '6px',
              color: '#3DD6D0',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              cursor: isExtracting ? 'wait' : 'pointer',
              boxShadow: '0 4px 16px rgba(61, 214, 208, 0.2)',
            }}
          >
            {isExtracting ? '⏳ EXTRACTING SCENE...' : '🚀 ANALYZE THIS VIEW IN SATQUERY'}
          </button>

          {/* Temporal Comparison Mode Toggle */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#CBD5E1', letterSpacing: '1px' }}>
                ⚖️ BITEMPORAL COMPARE
              </span>
              <button
                onClick={() => setCompareMode(!compareMode)}
                style={{
                  background: compareMode ? 'rgba(61, 214, 208, 0.2)' : 'transparent',
                  border: compareMode ? '1px solid #3DD6D0' : '1px solid rgba(255,255,255,0.2)',
                  color: compareMode ? '#3DD6D0' : 'rgba(255,255,255,0.6)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '9px',
                  cursor: 'pointer',
                }}
              >
                {compareMode ? 'ACTIVE' : 'ENABLE'}
              </button>
            </div>

            {compareMode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '2px' }}>
                    DATE A (BASELINE):
                  </label>
                  <input
                    type="date"
                    value={compareDateA}
                    onChange={(e) => setCompareDateA(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#070A12',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#FFF',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '2px' }}>
                    DATE B (TARGET):
                  </label>
                  <input
                    type="date"
                    value={compareDateB}
                    onChange={(e) => setCompareDateB(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#070A12',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#FFF',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <button
                  onClick={handleExecuteComparison}
                  disabled={isExtracting}
                  style={{
                    padding: '8px',
                    background: 'rgba(61, 214, 208, 0.2)',
                    border: '1px solid #3DD6D0',
                    borderRadius: '4px',
                    color: '#3DD6D0',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: isExtracting ? 'wait' : 'pointer',
                  }}
                >
                  ⚡ COMPARE IN SATQUERY
                </button>
              </div>
            )}
          </div>

          {/* Legal and Data Source Notice */}
          <div
            style={{
              fontSize: '9px',
              color: 'rgba(180, 210, 255, 0.45)',
              lineHeight: 1.4,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: '10px',
            }}
          >
            Data: Copernicus Data Space Ecosystem (Sentinel-1 & 2) · USGS Landsat · NASA GIBS · OpenStreetMap ODbL.
            Historical imagery reflects genuine satellite observations.
          </div>
        </div>
      </div>
    </div>
  );
};

