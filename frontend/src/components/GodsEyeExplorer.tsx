import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../api/client';

/**
 * Google-Earth-Style 3D Earth Explorer & Temporal Observation Timeline (SQ-041).
 * Enhanced Features:
 * - Live geographic search with instant fly-to, gazetteer autocomplete, and coordinate parsing
 * - Interactive ROI Bounding Box drawing tool on the 3D globe with live Cesium rectangle rendering
 * - Multi-year genuine satellite imagery switching (Sentinel-2 Cloudless 2016-2024 via EOX & NASA GIBS)
 * - Free bitemporal visual comparison (Year A vs Year B toggle + auto-blink) directly on 3D globe
 * - Direct extraction and automated change detection between 2 years for any drawn ROI
 */

interface GodsEyeExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImagery: (imageId: string) => void;
  onCompareImagery?: (imageId1: string, imageId2: string) => void;
}

const SHOWCASE_SECTORS = [
  { id: 'dubai', name: 'Dubai Waterfront', lat: 25.2048, lon: 55.2708, height: 22000, desc: 'Urban development & reclamation' },
  { id: 'kolkata', name: 'Kolkata Metropolitan', lat: 22.5726, lon: 88.3639, height: 28000, desc: 'Urban expansion & delta monitoring' },
  { id: 'delhi', name: 'Delhi NCR', lat: 28.6139, lon: 77.2090, height: 26000, desc: 'Urban density & Yamuna river' },
  { id: 'mumbai', name: 'Mumbai Coastline', lat: 19.0760, lon: 72.8777, height: 25000, desc: 'Coastal port & harbor reclamation' },
  { id: 'hanoi', name: 'Hanoi Red River Delta', lat: 21.0285, lon: 105.8542, height: 25000, desc: 'Agricultural floodplain monitoring' },
  { id: 'joplin', name: 'Joplin Tornado Track', lat: 37.0842, lon: -94.5133, height: 16000, desc: 'Disaster damage assessment' },
  { id: 'amazon', name: 'Amazon Deforestation Front', lat: -3.4653, lon: -58.3800, height: 45000, desc: 'Vegetation loss tracking' },
  { id: 'glacier', name: 'Gangotri Glacier', lat: 30.9300, lon: 79.0800, height: 30000, desc: 'Glacial retreat measurement' },
];

const ESRI_WORLD_IMAGERY_URL = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer';

// Popular quick search suggestions
const QUICK_SUGGESTIONS = [
  { name: 'Kolkata, India', lat: 22.5726, lon: 88.3639 },
  { name: 'Delhi NCR, India', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777 },
  { name: 'Bengaluru, India', lat: 12.9716, lon: 77.5946 },
  { name: 'Dubai Waterfront, UAE', lat: 25.2048, lon: 55.2708 },
  { name: 'Singapore Harbor', lat: 1.3521, lon: 103.8198 },
  { name: 'Tokyo Bay, Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'London, United Kingdom', lat: 51.5074, lon: -0.1278 },
  { name: 'New York City, USA', lat: 40.7128, lon: -74.0060 },
  { name: 'Gangotri Glacier, India', lat: 30.9300, lon: 79.0800 },
  { name: 'Sundarbans Delta, India', lat: 21.9497, lon: 89.1833 },
];

export const GodsEyeExplorer = ({
  isOpen,
  onClose,
  onSelectImagery,
  onCompareImagery,
}: GodsEyeExplorerProps) => {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const temporalLayerRef = useRef<any>(null);

  // Geographic Coordinates State
  const [coords, setCoords] = useState({ lat: 25.2048, lon: 55.2708, alt: 22000 });
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Search & Geocoding State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Multi-Year Imagery State
  const [selectedYear, setSelectedYear] = useState(2024);
  const [globeLayerMode, setGlobeLayerMode] = useState<'sentinel' | 'esri'>('sentinel');
  const [selectedSensor, setSelectedSensor] = useState<'ALL' | 'SENTINEL-2' | 'SENTINEL-1'>('ALL');
  const [observations, setObservations] = useState<any[]>([]);
  const [selectedObservation, setSelectedObservation] = useState<any | null>(null);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);

  // Bitemporal Comparison Mode State
  const [compareMode, setCompareMode] = useState(false);
  const [compareDateA, setCompareDateA] = useState<string>('2018-06-15');
  const [compareDateB, setCompareDateB] = useState<string>('2024-06-15');
  const [activeCompareYear, setActiveCompareYear] = useState<'A' | 'B'>('B');
  const [isAutoBlinking, setIsAutoBlinking] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Drawing ROI Box on 3D Globe State
  const [isDrawingRoi, setIsDrawingRoi] = useState(false);
  const [roiStartPoint, setRoiStartPoint] = useState<{ lon: number; lat: number } | null>(null);
  const [drawnRoi, setDrawnRoi] = useState<{
    minLon: number;
    minLat: number;
    maxLon: number;
    maxLat: number;
    areaHa: number;
    areaKm2: number;
  } | null>(null);

  // Refs to avoid stale closures in Cesium event handlers
  const isDrawingRoiRef = useRef(false);
  const roiStartPointRef = useRef<{ lon: number; lat: number } | null>(null);
  const roiEntitiesRef = useRef<any[]>([]);
  const previewEntityRef = useRef<any>(null);

  isDrawingRoiRef.current = isDrawingRoi;
  roiStartPointRef.current = roiStartPoint;

  // Active Viewport AOI bounding box
  const currentBBox = [
    Number((coords.lon - 0.08).toFixed(4)),
    Number((coords.lat - 0.08).toFixed(4)),
    Number((coords.lon + 0.08).toFixed(4)),
    Number((coords.lat + 0.08).toFixed(4)),
  ];

  // Helper: Switch Globe Imagery Layer dynamically
  const updateGlobeImagery = (year: number, mode: 'sentinel' | 'esri' = globeLayerMode) => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium) return;

    if (temporalLayerRef.current) {
      try {
        viewer.imageryLayers.remove(temporalLayerRef.current);
      } catch {
        // ignore
      }
      temporalLayerRef.current = null;
    }

    if (mode === 'esri') return;

    const clampedYear = Math.max(2016, Math.min(2024, year));
    try {
      const s2Provider = new Cesium.UrlTemplateImageryProvider({
        url: `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-${clampedYear}_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg`,
        credit: `Sentinel-2 Cloudless (${clampedYear}) — Copernicus Sentinel / EOX`,
        maximumLevel: 14,
      });
      const layer = viewer.imageryLayers.addImageryProvider(s2Provider);
      temporalLayerRef.current = layer;
    } catch (err) {
      console.warn('[GodsEye] Sentinel-2 yearly layer switch notice:', err);
    }
  };

  // Helper: Fly camera to target coordinate
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
      setCoords({ lat: Number(lat.toFixed(4)), lon: Number(lon.toFixed(4)), alt: height });
    }
  };

  // Helper: Clear Cesium ROI entities
  const clearRoiEntities = () => {
    const viewer = viewerRef.current;
    if (viewer) {
      roiEntitiesRef.current.forEach((ent) => {
        try {
          viewer.entities.remove(ent);
        } catch {
          // ignore
        }
      });
      if (previewEntityRef.current) {
        try {
          viewer.entities.remove(previewEntityRef.current);
        } catch {
          // ignore
        }
        previewEntityRef.current = null;
      }
    }
    roiEntitiesRef.current = [];
  };

  // Start Drawing ROI Box
  const startDrawingRoi = () => {
    setIsDrawingRoi(true);
    setRoiStartPoint(null);
    clearRoiEntities();
    setDrawnRoi(null);
    const viewer = viewerRef.current;
    if (viewer) {
      viewer.scene.screenSpaceCameraController.enableRotate = false;
      viewer.scene.screenSpaceCameraController.enableTranslate = false;
    }
  };

  // Cancel Drawing ROI Box
  const cancelDrawingRoi = () => {
    setIsDrawingRoi(false);
    setRoiStartPoint(null);
    clearRoiEntities();
    const viewer = viewerRef.current;
    if (viewer) {
      viewer.scene.screenSpaceCameraController.enableRotate = true;
      viewer.scene.screenSpaceCameraController.enableTranslate = true;
    }
  };

  // Finalize Drawn ROI Box
  const finalizeDrawnRoi = (lon1: number, lat1: number, lon2: number, lat2: number) => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium) return;

    let minLon = Math.min(lon1, lon2);
    let maxLon = Math.max(lon1, lon2);
    let minLat = Math.min(lat1, lat2);
    let maxLat = Math.max(lat1, lat2);

    if (maxLon - minLon < 0.005) maxLon = minLon + 0.01;
    if (maxLat - minLat < 0.005) maxLat = minLat + 0.01;

    const midLat = (minLat + maxLat) / 2;
    const dLatKm = Math.abs(maxLat - minLat) * 111.0;
    const dLonKm = Math.abs(maxLon - minLon) * 111.0 * Math.cos((midLat * Math.PI) / 180.0);
    const areaKm2 = Number((dLatKm * dLonKm).toFixed(2));
    const areaHa = Number((areaKm2 * 100).toFixed(1));

    const roiObj = {
      minLon: Number(minLon.toFixed(4)),
      minLat: Number(minLat.toFixed(4)),
      maxLon: Number(maxLon.toFixed(4)),
      maxLat: Number(maxLat.toFixed(4)),
      areaHa,
      areaKm2,
    };

    setDrawnRoi(roiObj);
    clearRoiEntities();

    // Add persistent highlighted rectangle entity
    const rectEntity = viewer.entities.add({
      rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(minLon, minLat, maxLon, maxLat),
        material: Cesium.Color.fromCssColorString('#3DD6D0').withAlpha(0.24),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#3DD6D0'),
        outlineWidth: 3,
      },
      position: Cesium.Cartesian3.fromDegrees((minLon + maxLon) / 2, (minLat + maxLat) / 2),
      label: {
        text: `📐 ROI: ${areaHa} ha (~${areaKm2} km²)`,
        font: 'bold 12px "JetBrains Mono", monospace',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString('#070A12'),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -20),
      },
    });
    roiEntitiesRef.current.push(rectEntity);

    // Reset drawing state & re-enable camera
    setIsDrawingRoi(false);
    setRoiStartPoint(null);
    viewer.scene.screenSpaceCameraController.enableRotate = true;
    viewer.scene.screenSpaceCameraController.enableTranslate = true;
  };

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
          } catch {
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

        // Base 1: Esri High-Resolution Satellite Basemap (Fallback layer)
        try {
          const esriProvider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
            ESRI_WORLD_IMAGERY_URL,
            {
              credit: 'Powered by Esri — Source: Maxar, Earthstar, GIS Community',
              enablePickFeatures: false,
            }
          );
          if (isMounted && viewerRef.current) {
            viewer.imageryLayers.add(new Cesium.ImageryLayer(esriProvider));
          }
        } catch {
          if (isMounted && viewerRef.current) {
            const osmProvider = new Cesium.OpenStreetMapImageryProvider({
              url: 'https://tile.openstreetmap.org/',
              credit: '© OpenStreetMap contributors',
            });
            viewer.imageryLayers.add(new Cesium.ImageryLayer(osmProvider));
          }
        }

        // Base 2: Add Multi-Year Sentinel-2 Cloudless Layer for active selectedYear
        if (globeLayerMode === 'sentinel') {
          const validYear = Math.max(2016, Math.min(2024, selectedYear));
          try {
            const s2Provider = new Cesium.UrlTemplateImageryProvider({
              url: `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-${validYear}_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg`,
              credit: `Sentinel-2 Cloudless (${validYear}) — Copernicus Sentinel / EOX`,
              maximumLevel: 14,
            });
            temporalLayerRef.current = viewer.imageryLayers.addImageryProvider(s2Provider);
          } catch (e) {
            console.warn('Initial Sentinel-2 layer error:', e);
          }
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

        // Event Handler: Mouse Tracking & ROI Drawing
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        handler.setInputAction((movement: any) => {
          if (!isMounted) return;
          const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
          if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const moveLon = Number(Cesium.Math.toDegrees(cartographic.longitude).toFixed(4));
            const moveLat = Number(Cesium.Math.toDegrees(cartographic.latitude).toFixed(4));

            setCoords({
              lat: moveLat,
              lon: moveLon,
              alt: Math.round(viewer.camera.positionCartographic.height),
            });

            // Dynamic ROI Bounding Box Rectangle Preview
            if (isDrawingRoiRef.current && roiStartPointRef.current) {
              const start = roiStartPointRef.current;
              const minLon = Math.min(start.lon, moveLon);
              const maxLon = Math.max(start.lon, moveLon);
              const minLat = Math.min(start.lat, moveLat);
              const maxLat = Math.max(start.lat, moveLat);

              if (previewEntityRef.current) {
                previewEntityRef.current.rectangle.coordinates = Cesium.Rectangle.fromDegrees(minLon, minLat, maxLon, maxLat);
              } else {
                previewEntityRef.current = viewer.entities.add({
                  rectangle: {
                    coordinates: Cesium.Rectangle.fromDegrees(minLon, minLat, maxLon, maxLat),
                    material: Cesium.Color.fromCssColorString('#3DD6D0').withAlpha(0.25),
                    outline: true,
                    outlineColor: Cesium.Color.fromCssColorString('#3DD6D0'),
                    outlineWidth: 2,
                  },
                });
              }
            }
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // Click Handler: Corner 1 and Corner 2 selection for ROI Box
        handler.setInputAction((click: any) => {
          if (!isMounted || !isDrawingRoiRef.current) return;
          const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
          if (!cartesian) return;
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const clickLon = Number(Cesium.Math.toDegrees(cartographic.longitude).toFixed(4));
          const clickLat = Number(Cesium.Math.toDegrees(cartographic.latitude).toFixed(4));

          if (!roiStartPointRef.current) {
            // First Corner Placed
            roiStartPointRef.current = { lon: clickLon, lat: clickLat };
            setRoiStartPoint({ lon: clickLon, lat: clickLat });

            const p1 = viewer.entities.add({
              position: Cesium.Cartesian3.fromDegrees(clickLon, clickLat),
              point: {
                pixelSize: 10,
                color: Cesium.Color.fromCssColorString('#3DD6D0'),
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
              },
              label: {
                text: 'Corner 1 (ROI Start)',
                font: '11px "JetBrains Mono", monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -18),
              },
            });
            roiEntitiesRef.current.push(p1);
          } else {
            // Second Corner Placed - Finalize ROI
            finalizeDrawnRoi(roiStartPointRef.current.lon, roiStartPointRef.current.lat, clickLon, clickLat);
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Fly camera to default Dubai Waterfront
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
        } catch {
          // ignore
        }
        viewerRef.current = null;
      }
      if (creditEl && creditEl.parentNode) {
        creditEl.parentNode.removeChild(creditEl);
      }
    };
  }, [isOpen]);

  // Update Globe Imagery whenever selectedYear or globeLayerMode changes
  useEffect(() => {
    if (!isOpen || !viewerRef.current) return;
    if (!compareMode) {
      updateGlobeImagery(selectedYear, globeLayerMode);
    }
  }, [selectedYear, globeLayerMode, isOpen, compareMode]);

  // Auto-Blink Effect in Compare Mode
  useEffect(() => {
    if (!isOpen || !compareMode || !isAutoBlinking) return;

    const interval = setInterval(() => {
      setActiveCompareYear((prev) => {
        const next = prev === 'A' ? 'B' : 'A';
        const targetYear = next === 'A'
          ? (parseInt(compareDateA.split('-')[0]) || 2018)
          : (parseInt(compareDateB.split('-')[0]) || 2024);
        updateGlobeImagery(targetYear, 'sentinel');
        return next;
      });
    }, 1400);

    return () => clearInterval(interval);
  }, [compareMode, isAutoBlinking, compareDateA, compareDateB, isOpen]);

  // Query Copernicus Catalog when Year, Sensor, or Location changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsSearchingCatalog(true);
    setCatalogMessage(null);

    const startDate = `${selectedYear}-01-01`;
    const endDate = `${selectedYear}-12-31`;

    const queryBBox = drawnRoi
      ? [drawnRoi.minLon, drawnRoi.minLat, drawnRoi.maxLon, drawnRoi.maxLat]
      : currentBBox;

    apiClient
      .searchCatalog({
        bbox: queryBBox,
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
  }, [selectedYear, selectedSensor, coords.lat, coords.lon, drawnRoi, isOpen]);

  // Navigation Controls
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
    flyToLocation(25.2048, 55.2708, 22000);
  };

  // Robust Geocoding Search Submission (Flies Immediately on Match)
  const handleSearchSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || searchQuery).trim();
    if (!query) return;

    setIsSearching(true);
    setSearchFeedback(null);

    try {
      const res = await apiClient.geocodeLocation(query);
      const candidates = res.results || [];
      setSearchResults(candidates);

      if (candidates.length > 0) {
        const topMatch = candidates[0];
        flyToLocation(topMatch.lat, topMatch.lon, 25000);
        setSearchQuery(topMatch.name);
        setShowSearchResults(candidates.length > 1);
        setSearchFeedback(`📍 Flew to ${topMatch.name}`);
      } else {
        setShowSearchResults(false);
        setSearchFeedback(`No matches found for "${query}". Try a city name or coordinates (e.g. 22.57, 88.36).`);
      }
    } catch {
      setSearchResults([]);
      setSearchFeedback('Geocoding service unavailable.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (cand: any) => {
    flyToLocation(cand.lat, cand.lon, 25000);
    setShowSearchResults(false);
    setSearchQuery(cand.name);
    setSearchFeedback(`📍 Flew to ${cand.name}`);
  };

  // Single Scene Extraction
  const handleAnalyzeThisView = async () => {
    setIsExtracting(true);
    try {
      const targetBBox = drawnRoi
        ? [drawnRoi.minLon, drawnRoi.minLat, drawnRoi.maxLon, drawnRoi.maxLat]
        : currentBBox;
      const targetDate = selectedObservation ? selectedObservation.date : `${selectedYear}-06-15`;
      const res = await apiClient.extractTeeImagery(targetBBox, targetDate);
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

  // Multi-Year Bitemporal Comparison Extraction
  const handleExecuteComparison = async () => {
    setIsExtracting(true);
    try {
      const targetBBox = drawnRoi
        ? [drawnRoi.minLon, drawnRoi.minLat, drawnRoi.maxLon, drawnRoi.maxLat]
        : currentBBox;
      const resA = await apiClient.extractTeeImagery(targetBBox, compareDateA);
      const resB = await apiClient.extractTeeImagery(targetBBox, compareDateB);
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

  // View specific year in compare mode
  const handleViewCompareYear = (yr: 'A' | 'B') => {
    setIsAutoBlinking(false);
    setActiveCompareYear(yr);
    const targetYear = yr === 'A'
      ? (parseInt(compareDateA.split('-')[0]) || 2018)
      : (parseInt(compareDateB.split('-')[0]) || 2024);
    updateGlobeImagery(targetYear, 'sentinel');
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
            COPERNICUS STAC · MULTI-YEAR SENTINEL-2
          </span>
        </div>

        {/* Center: Search Box */}
        <div style={{ position: 'relative', flex: '1', maxWidth: '480px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Search location (e.g. Kolkata, Dubai, Tokyo, or 22.57, 88.36)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
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
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isSearching ? '...' : 'FIND ➔'}
            </button>
          </form>

          {/* Search Results / Autocomplete Dropdown */}
          {showSearchResults && (
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
                boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                zIndex: 100,
                maxHeight: '260px',
                overflowY: 'auto',
              }}
            >
              {searchResults.length > 0 ? (
                searchResults.map((cand, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSearchResult(cand)}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: '#E2E8F0',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(61, 214, 208, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontWeight: 600, color: '#3DD6D0' }}>{cand.name}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(180, 210, 255, 0.6)' }}>
                      {cand.display_name} · [{cand.lat.toFixed(3)}°, {cand.lon.toFixed(3)}°]
                    </div>
                  </div>
                ))
              ) : (
                <div>
                  <div style={{ padding: '6px 12px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                    Popular Locations:
                  </div>
                  {QUICK_SUGGESTIONS.slice(0, 6).map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        flyToLocation(item.lat, item.lon, 25000);
                        setShowSearchResults(false);
                        setSearchQuery(item.name);
                        setSearchFeedback(`📍 Flew to ${item.name}`);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        color: '#CBD5E1',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(61, 214, 208, 0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Telemetry & Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {searchFeedback && (
            <span style={{ fontSize: '10px', color: '#3DD6D0', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {searchFeedback}
            </span>
          )}
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: mapStatus === 'ready' ? 'rgba(61, 214, 208, 0.15)' : 'rgba(251, 191, 36, 0.2)',
              color: mapStatus === 'ready' ? '#3DD6D0' : '#FBBF24',
              border: `1px solid ${mapStatus === 'ready' ? 'rgba(61, 214, 208, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`,
              fontWeight: 600,
            }}
          >
            {mapStatus.toUpperCase()}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(61, 214, 208, 0.85)' }}>
            {coords.lat.toFixed(4)}° N · {coords.lon.toFixed(4)}° E
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
            style={{
              width: '100%',
              height: '100%',
              cursor: isDrawingRoi ? 'crosshair' : 'default',
            }}
          />

          {/* Floating Instructions Banner when Drawing ROI */}
          {isDrawingRoi && (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(11, 17, 32, 0.95)',
                border: '2px solid #3DD6D0',
                borderRadius: '8px',
                padding: '10px 20px',
                zIndex: 60,
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
              }}
            >
              <span style={{ fontSize: '13px', color: '#3DD6D0', fontWeight: 600 }}>
                {!roiStartPoint
                  ? '📐 Step 1: Click Corner 1 on the globe to start drawing your ROI'
                  : '📐 Step 2: Click Corner 2 on the globe to finalize the bounding box'}
              </span>
              <button
                onClick={cancelDrawingRoi}
                style={{
                  background: 'rgba(229, 72, 77, 0.2)',
                  border: '1px solid #E5484D',
                  color: '#E5484D',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ✕ Cancel
              </button>
            </div>
          )}

          {/* Floating Navigation & ROI Tool Cluster (Right Side) */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              zIndex: 30,
            }}
          >
            {/* Draw ROI Box Trigger */}
            <button
              title="Draw ROI Bounding Box on 3D Globe"
              onClick={isDrawingRoi ? cancelDrawingRoi : startDrawingRoi}
              style={{
                background: isDrawingRoi ? '#3DD6D0' : 'rgba(11, 17, 32, 0.9)',
                border: '1px solid #3DD6D0',
                borderRadius: '8px',
                color: isDrawingRoi ? '#070A12' : '#3DD6D0',
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(6px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <span>📐</span>
              <span>{isDrawingRoi ? 'CANCEL ROI' : 'DRAW ROI BOX'}</span>
            </button>

            {drawnRoi && (
              <button
                title="Clear Drawn ROI"
                onClick={() => {
                  clearRoiEntities();
                  setDrawnRoi(null);
                }}
                style={{
                  background: 'rgba(229, 72, 77, 0.15)',
                  border: '1px solid rgba(229, 72, 77, 0.4)',
                  borderRadius: '8px',
                  color: '#E5484D',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '10px',
                }}
              >
                ✕ Clear ROI ({drawnRoi.areaHa} ha)
              </button>
            )}

            {/* Standard Camera Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
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
                }}
              >
                🏠
              </button>
            </div>
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
              maxWidth: '680px',
            }}
          >
            {SHOWCASE_SECTORS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  flyToLocation(s.lat, s.lon, s.height);
                  setSearchQuery(s.name);
                }}
                style={{
                  background: 'rgba(11, 17, 32, 0.8)',
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

          {/* Bottom Historical Timeline Bar (Continuous Year Slider + Multi-Year Satellite Mosaics) */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '24px',
              right: '360px',
              background: 'rgba(11, 17, 32, 0.94)',
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
                <span style={{ fontSize: '10px', color: 'rgba(180, 210, 255, 0.7)' }}>
                  Active Globe Layer:{' '}
                  <strong style={{ color: '#FFF' }}>
                    {globeLayerMode === 'sentinel' ? `Sentinel-2 Cloudless (${selectedYear})` : 'Esri High-Res Basemap'}
                  </strong>
                </span>
              </div>

              {/* Layer Toggle & Sensor Filter */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setGlobeLayerMode(globeLayerMode === 'sentinel' ? 'esri' : 'sentinel')}
                  style={{
                    background: globeLayerMode === 'sentinel' ? 'rgba(61, 214, 208, 0.25)' : 'rgba(255,255,255,0.08)',
                    border: globeLayerMode === 'sentinel' ? '1px solid #3DD6D0' : '1px solid rgba(255,255,255,0.2)',
                    color: globeLayerMode === 'sentinel' ? '#3DD6D0' : '#CBD5E1',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {globeLayerMode === 'sentinel' ? '🛰️ Sentinel-2 Mosaic (Active)' : '🗺️ Switch to Sentinel-2'}
                </button>

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

            {/* Continuous Slider with Year Ticks (2016-2024) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>2016</span>
              <input
                type="range"
                min="2016"
                max="2024"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: '#3DD6D0',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>2024</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#3DD6D0',
                  padding: '2px 8px',
                  background: 'rgba(61, 214, 208, 0.15)',
                  borderRadius: '4px',
                  border: '1px solid rgba(61, 214, 208, 0.3)',
                }}
              >
                YEAR: {selectedYear}
              </span>
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
                  ○ {catalogMessage || 'Showing calibrated Sentinel-2 yearly mosaic.'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: ROI Coordinates & Multi-Year Bitemporal Extraction HUD */}
        <div
          style={{
            width: '350px',
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
          {/* Active Area Definition HUD (Drawn ROI vs Viewport) */}
          <div
            style={{
              background: drawnRoi ? 'rgba(61, 214, 208, 0.1)' : 'rgba(15, 23, 42, 0.6)',
              border: drawnRoi ? '1px solid #3DD6D0' : '1px solid rgba(61, 214, 208, 0.25)',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', color: '#3DD6D0', letterSpacing: '1px', fontWeight: 600 }}>
                {drawnRoi ? '📐 DRAWN ROI BOUNDING BOX' : '🌐 VIEWPORT EXTENT'}
              </span>
              <button
                onClick={isDrawingRoi ? cancelDrawingRoi : startDrawingRoi}
                style={{
                  background: isDrawingRoi ? '#3DD6D0' : 'rgba(61, 214, 208, 0.2)',
                  border: '1px solid #3DD6D0',
                  color: isDrawingRoi ? '#070A12' : '#3DD6D0',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '9px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {drawnRoi ? '✎ Redraw Box' : '+ Draw Box'}
              </button>
            </div>

            {drawnRoi ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>BOUNDS:</span>
                  <span style={{ color: '#FFF' }}>
                    {drawnRoi.minLat.toFixed(3)}°N, {drawnRoi.minLon.toFixed(3)}°E to {drawnRoi.maxLat.toFixed(3)}°N, {drawnRoi.maxLon.toFixed(3)}°E
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>AREA:</span>
                  <span style={{ color: '#3DD6D0', fontWeight: 700 }}>
                    {drawnRoi.areaHa.toLocaleString()} ha (~{drawnRoi.areaKm2} km²)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>SAMPLING:</span>
                  <span style={{ color: '#CBD5E1' }}>10m Sentinel-2 GSD</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                Using camera center. Click <strong>"Draw Box"</strong> to select a custom sector on the globe.
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
            {isExtracting
              ? '⏳ EXTRACTING SENTINEL-2 SCENE...'
              : drawnRoi
              ? `🚀 ANALYZE DRAWN ROI (${selectedYear})`
              : `🚀 ANALYZE THIS VIEW (${selectedYear})`}
          </button>

          {/* Temporal Multi-Year Comparison Mode */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: compareMode ? '1px solid #3DD6D0' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#3DD6D0', letterSpacing: '1px' }}>
                ⚖️ BITEMPORAL 2-YEAR COMPARE
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
                {/* Year A / Date A */}
                <div>
                  <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '2px' }}>
                    BASELINE YEAR / DATE (T0):
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

                {/* Year B / Date B */}
                <div>
                  <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '2px' }}>
                    TARGET YEAR / DATE (T1):
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

                {/* Direct Visual Flip Controls on the 3D Globe */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <button
                    onClick={() => handleViewCompareYear('A')}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      background: activeCompareYear === 'A' ? 'rgba(61, 214, 208, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                      border: activeCompareYear === 'A' ? '1px solid #3DD6D0' : '1px solid rgba(255,255,255,0.1)',
                      color: activeCompareYear === 'A' ? '#3DD6D0' : '#CBD5E1',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    View {compareDateA.slice(0, 4)}
                  </button>
                  <button
                    onClick={() => handleViewCompareYear('B')}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      background: activeCompareYear === 'B' ? 'rgba(61, 214, 208, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                      border: activeCompareYear === 'B' ? '1px solid #3DD6D0' : '1px solid rgba(255,255,255,0.1)',
                      color: activeCompareYear === 'B' ? '#3DD6D0' : '#CBD5E1',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    View {compareDateB.slice(0, 4)}
                  </button>
                  <button
                    onClick={() => setIsAutoBlinking(!isAutoBlinking)}
                    style={{
                      padding: '6px 8px',
                      background: isAutoBlinking ? '#FBBF24' : 'rgba(30, 41, 59, 0.6)',
                      border: isAutoBlinking ? '1px solid #FBBF24' : '1px solid rgba(255,255,255,0.1)',
                      color: isAutoBlinking ? '#070A12' : '#CBD5E1',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Automatically alternate views every 1.4 seconds"
                  >
                    {isAutoBlinking ? '⏸ BLINKING' : '🔄 AUTO-BLINK'}
                  </button>
                </div>

                {/* Execute Change Detection Extraction */}
                <button
                  onClick={handleExecuteComparison}
                  disabled={isExtracting}
                  style={{
                    marginTop: '4px',
                    padding: '10px',
                    background: 'linear-gradient(135deg, rgba(61, 214, 208, 0.25), rgba(14, 165, 233, 0.15))',
                    border: '1px solid #3DD6D0',
                    borderRadius: '4px',
                    color: '#3DD6D0',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: isExtracting ? 'wait' : 'pointer',
                    letterSpacing: '0.5px',
                  }}
                >
                  {isExtracting
                    ? '⏳ EXTRACTING BOTH YEARS...'
                    : drawnRoi
                    ? `⚡ COMPARE DRAWN ROI (${compareDateA.slice(0, 4)} vs ${compareDateB.slice(0, 4)})`
                    : `⚡ COMPARE VIEW (${compareDateA.slice(0, 4)} vs ${compareDateB.slice(0, 4)})`}
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
            Data: Copernicus Data Space Ecosystem (Sentinel-1 & 2) · EOX Cloudless Mosaics (2016–2024) · USGS Landsat · OpenStreetMap ODbL.
            Free & open methods calibrated to real satellite passes.
          </div>
        </div>
      </div>
    </div>
  );
};
