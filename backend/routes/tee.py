from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from backend.services.tee_service import TeeService

router = APIRouter()

class ExtractRequest(BaseModel):
    bbox: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat]")
    date: str = Field(..., description="Acquisition date (YYYY-MM-DD)")
    source: Optional[str] = Field("NASA_GIBS", description="Imagery source (e.g. NASA_GIBS, Sentinel-2)")
    location_id: Optional[str] = Field(None, description="Optional showcase location ID")

class SearchCatalogRequest(BaseModel):
    bbox: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat]")
    start_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="End date (YYYY-MM-DD)")
    sensor: Optional[str] = Field("ALL", description="Sensor filter: ALL, SENTINEL-1, SENTINEL-2")
    cloud_max: Optional[float] = Field(30.0, description="Max acceptable cloud percentage for optical")
    limit: Optional[int] = Field(10, description="Max observations to return")

@router.get("/tee/showcases")
def get_showcases():
    """Returns available curated 3D globe showcase locations with temporal coverage."""
    return {"status": "success", "showcases": TeeService.list_showcases()}

@router.get("/tee/geocode")
async def geocode_location(q: str):
    """
    Geocodes a search string (placename, city, landmark, or lat,lon coords) into candidate locations.
    """
    results = await TeeService.geocode(q)
    return {"status": "success", "query": q, "results": results}

@router.post("/tee/search")
async def search_satellite_catalog(payload: SearchCatalogRequest):
    """
    Discovers available Sentinel-1, Sentinel-2, or Landsat open satellite scenes for a given AOI & date range.
    Queries Copernicus Data Space Ecosystem STAC with local showcase fallback.
    """
    try:
        data = await TeeService.search_catalog(
            bbox=payload.bbox,
            start_date=payload.start_date,
            end_date=payload.end_date,
            sensor=payload.sensor or "ALL",
            cloud_max=payload.cloud_max if payload.cloud_max is not None else 30.0,
            limit=payload.limit or 10
        )
        return {"status": "success", "catalog": data}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

@router.post("/tee/extract")
async def extract_imagery(payload: ExtractRequest):
    """
    Extracts imagery for {bbox, date, source} from properly-licensed providers.
    Fulfills Phase 1D (SQ-031 / SQ-038).
    """
    try:
        meta = await TeeService.extract_imagery(
            bbox=payload.bbox,
            date=payload.date,
            source=payload.source or "NASA_GIBS",
            location_id=payload.location_id
        )
        return {"status": "success", "meta": meta, "image_id": meta["image_id"]}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

