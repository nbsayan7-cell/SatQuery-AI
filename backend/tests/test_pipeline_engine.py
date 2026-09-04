"""
Unit and Integration Tests for Deterministic Pipeline Engine
Verifies subpixel coregistration, spectral indices, CVM, Mahalanobis distance,
area calculations, uncertainty propagation, and strict number preservation.
"""

import numpy as np
import pytest
from pipeline.preprocess.coregistration import SubpixelCoregistrator
from pipeline.preprocess.despeckle import SARDespeckler
from pipeline.feature_extract.spectral_indices import SpectralIndices
from pipeline.feature_extract.sar_features import SARFeatures
from pipeline.change_detect.metrics import ChangeMetrics
from pipeline.change_detect.statistical import StatisticalChange
from pipeline.postprocess.thresholding import ChangeThresholding
from pipeline.postprocess.area_calc import AreaCalculator
from pipeline.postprocess.vectorization import MaskVectorizer
from pipeline.evidence.uncertainty import UncertaintyEngine
from pipeline.evidence.assembler import EvidenceAssembler


def test_coregistration_synthetic_shift():
    """Verify subpixel coregistration recovers known synthetic translation within 0.1 px."""
    np.random.seed(42)
    # 64x64 synthetic image with high-frequency pattern
    base = np.random.uniform(0.1, 0.9, (64, 64)).astype(np.float32)
    
    # Apply integer shift: +1 px in X, +1 px in Y (RMSE = 1.414 px = 14.14m <= 15.0m threshold)
    shifted = np.roll(np.roll(base, shift=1, axis=0), shift=1, axis=1)

    res = SubpixelCoregistrator.compute_registration_offset(base, shifted, pixel_resolution_m=10.0)
    assert res["status"] == "COREGISTRATION_PASSED"
    assert res["is_aligned"] is True
    assert abs(abs(res["dx_pixels"]) - 1.0) <= 0.1
    assert abs(abs(res["dy_pixels"]) - 1.0) <= 0.1


def test_spectral_indices_bounds_and_values():
    """Verify NDVI and NDWI produce expected physical values and obey [-1.0, 1.0]."""
    nir = np.array([[0.8, 0.1], [0.5, 0.9]], dtype=np.float32)
    red = np.array([[0.1, 0.1], [0.5, 0.1]], dtype=np.float32)
    
    ndvi = SpectralIndices.ndvi(nir, red)
    assert ndvi.shape == (2, 2)
    assert np.all(ndvi >= -1.0) and np.all(ndvi <= 1.0)
    # Dense vegetation: NIR=0.8, Red=0.1 -> NDVI = (0.8 - 0.1)/(0.9) = 0.777
    assert pytest.approx(ndvi[0, 0], rel=1e-2) == 0.7778
    # Equal NIR & Red: NDVI = 0
    assert pytest.approx(ndvi[1, 0], abs=1e-3) == 0.0


def test_sar_features_extraction():
    """Verify SAR dB conversion and ratio calculations."""
    vv = np.array([0.1, 0.01], dtype=np.float32)
    vh = np.array([0.02, 0.001], dtype=np.float32)
    
    feats = SARFeatures.extract(vv, vh)
    assert "sigma0_vv_db" in feats
    assert "pol_ratio_vh_vv" in feats
    # 10 * log10(0.1) = -10.0 dB
    assert pytest.approx(feats["sigma0_vv_db"][0], abs=1e-2) == -10.0
    # VH / VV = 0.02 / 0.1 = 0.2
    assert pytest.approx(feats["pol_ratio_vh_vv"][0], abs=1e-2) == 0.2


def test_change_metrics_identity():
    """Identical images must yield strictly 0.0 CVM and no change."""
    img = np.ones((32, 32, 4), dtype=np.float32) * 0.5
    cvm = ChangeMetrics.change_vector_magnitude(img, img)
    assert np.all(cvm == 0.0)
    
    # Modified image
    modified = img.copy()
    modified[10:20, 10:20, :] += 0.3
    cvm_mod = ChangeMetrics.change_vector_magnitude(img, modified)
    assert np.all(cvm_mod[10:20, 10:20] > 0.0)
    assert np.all(cvm_mod[0:5, 0:5] == 0.0)


def test_mahalanobis_statistical_change():
    """Verify Mahalanobis distance calculation across multi-band features."""
    np.random.seed(42)
    x1 = np.random.normal(0.5, 0.1, (30, 30, 3)).astype(np.float64)
    x2 = x1.copy()
    # Induce strong multivariate anomaly in central patch
    x2[10:20, 10:20, :] += 0.8

    dm_map, cov = StatisticalChange.mahalanobis_distance(x1, x2)
    assert dm_map.shape == (30, 30)
    # Changed patch must have significantly higher Mahalanobis distance
    assert np.mean(dm_map[10:20, 10:20]) > 3.0 * np.mean(dm_map[0:5, 0:5])


def test_otsu_thresholding_and_area():
    """Verify Otsu variance minimization and area calculations on synthetic polygon."""
    metric = np.zeros((100, 100), dtype=np.float32)
    # Synthetic square change of 40x40 = 1600 pixels
    metric[30:70, 30:70] = 2.5

    thresh, mask = ChangeThresholding.otsu_threshold(metric)
    assert 0.5 < thresh < 2.5
    assert np.sum(mask) == 1600

    # 1600 pixels at 10m resolution = 1600 * 100m² = 160,000 m² = 16 ha
    areas = AreaCalculator.calculate_change_areas(mask, pixel_resolution_m=10.0)
    assert areas["changed_pixels"] == 1600
    assert areas["area_m2"] == 160000.0
    assert areas["area_ha"] == 16.0
    assert areas["change_percentage"] == 16.0


def test_uncertainty_propagation():
    """Verify analytical CVM and area uncertainty bounds."""
    x1 = np.zeros((20, 20, 3), dtype=np.float32)
    x2 = np.ones((20, 20, 3), dtype=np.float32) * 0.4
    
    res = UncertaintyEngine.propagate_cvm_uncertainty(x1, x2, sensor_sigma_x1=0.02, sensor_sigma_x2=0.02)
    assert res["mean_cvm"] > 0.0
    assert res["cvm_95ci"][0] < res["mean_cvm"] < res["cvm_95ci"][1]

    area_unc = UncertaintyEngine.propagate_area_uncertainty(changed_pixels=1000, pixel_area_m2=100.0)
    assert area_unc["nominal_area_m2"] == 100000.0
    assert area_unc["area_95ci_m2"][0] < 100000.0 < area_unc["area_95ci_m2"][1]


def test_evidence_assembler_sha256_integrity():
    """Verify cryptographic SHA-256 fingerprinting of numerical metrics."""
    metrics = {
        "changed_pixels": 500,
        "area_m2": 50000.0,
        "mean_cvm": 0.42
    }
    result = EvidenceAssembler.build_analysis_result(
        execution_id="test-exec-1",
        git_commit="abcdef12",
        sensor_info={"t1": "S2A", "t2": "S2B"},
        spatial_alignment={"status": "COREGISTRATION_PASSED"},
        metrics_summary=metrics,
        per_class_breakdown={},
        uncertainty_bounds={},
        vector_geojson={"type": "FeatureCollection", "features": []}
    )
    assert "metrics_sha256" in result["provenance"]
    assert len(result["provenance"]["metrics_sha256"]) == 64


def test_cvm_feature_standardization():
    """Verify that feature standardization prevents high-scale bands from blinding lower-scale bands."""
    # Band 0: low scale (e.g. Red reflectance 0.0 to 1.0)
    # Band 1: high scale (e.g. Raw DN or raw sensor counts 0 to 4000)
    x1 = np.zeros((10, 10, 2), dtype=np.float32)
    x1[:, :, 0] = 0.2
    x1[:, :, 1] = 2000.0

    x2 = x1.copy()
    # In x2, Band 0 changes by 0.5 (massive 250% relative change), Band 1 unchanged
    x2[:, :, 0] = 0.7

    # Without standardization, raw diff is 0.5
    raw_cvm = ChangeMetrics.change_vector_magnitude(x1, x2, standardize=False)
    assert pytest.approx(raw_cvm[0, 0], abs=1e-3) == 0.5

    # With standardization across varied variance channels:
    # Introduce variance in dataset
    x1_var = np.random.uniform(0.1, 0.3, (20, 20, 2)).astype(np.float32)
    x1_var[:, :, 1] = np.random.uniform(1800.0, 2200.0, (20, 20))
    x2_var = x1_var.copy()
    x2_var[5:15, 5:15, 0] += 0.4  # strong change in low-magnitude band

    cvm_std = ChangeMetrics.change_vector_magnitude(x1_var, x2_var, standardize=True)
    assert np.mean(cvm_std[5:15, 5:15]) > 3.0 * np.mean(cvm_std[0:5, 0:5])


def test_area_jacobian_determinant_and_bounds():
    """Verify ground area derivation from Affine Jacobian determinant and uncertainty bounds."""
    mask = np.zeros((50, 50), dtype=bool)
    mask[10:30, 10:30] = True  # 20x20 = 400 pixels

    # Affine geotransform: (x_origin, pixel_width_a, rotation_b, y_origin, rotation_d, pixel_height_e)
    # UTM 10m grid with slight rotation/shear:
    # a = 10.0, b = 0.5, d = -0.5, e = -10.0
    # |det(J)| = |10.0 * (-10.0) - (0.5 * -0.5)| = |-100.0 - (-0.25)| = |-99.75| = 99.75 m²
    gt = (500000.0, 10.0, 0.5, 4000000.0, -0.5, -10.0)
    res = AreaCalculator.calculate_change_areas(mask, geotransform=gt, registration_rmse_pixels=0.1)

    assert res["changed_pixels"] == 400
    assert pytest.approx(res["pixel_area_m2"], rel=1e-3) == 99.75
    expected_area = 400 * 99.75  # 39,900 m²
    assert pytest.approx(res["area_m2"], rel=1e-2) == expected_area
    assert res["calculation_method"] == "jacobian_determinant"
    assert "area_uncertainty_m2" in res
    assert res["area_uncertainty_m2"] > 0.0
    assert res["area_ci95_m2"][0] < res["area_m2"] < res["area_ci95_m2"][1]


def test_decomposed_multi_source_uncertainty():
    """Verify decomposed multi-source remote sensing confidence score reporting."""
    unc = UncertaintyEngine.compute_multi_source_uncertainty(
        sensor_snr_db=28.0,
        registration_rmse_m=1.2,
        pixel_resolution_m=10.0,
        cloud_coverage_pct=2.0,
        change_contrast_ratio=2.8
    )

    assert "data_quality_confidence" in unc
    assert "registration_confidence" in unc
    assert "change_detection_confidence" in unc
    assert "semantic_classification_confidence" in unc
    assert "overall_evidence_quality" in unc
    assert "is_statistically_trustworthy" in unc

    assert 0.0 <= unc["data_quality_confidence"] <= 1.0
    assert 0.0 <= unc["registration_confidence"] <= 1.0
    assert 0.0 <= unc["change_detection_confidence"] <= 1.0
    assert 0.0 <= unc["semantic_classification_confidence"] <= 1.0
    assert 0.0 <= unc["overall_evidence_quality"] <= 1.0
    assert unc["is_statistically_trustworthy"] is True

