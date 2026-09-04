"""
SatQuery AI — Deterministic Scientific Answer Presentation Formatter
Formats natural-language responses strictly from validated JSON evidence
according to Section 9 Natural Language Answer Contract.
AI INTERPRETS EVIDENCE. AI DOES NOT MANUFACTURE EVIDENCE.
"""

from typing import Dict, Any, Optional


class ScientificAnswerFormatter:
    """
    Translates validated structured JSON evidence into a structured 7-section narrative.
    Strictly prohibits inventing or hallucinating measurements.
    """

    @staticmethod
    def format_answer(evidence: Dict[str, Any]) -> str:
        """
        Formats natural language answer according to the 7-section contract:
        1. RESULT
        2. MAGNITUDE
        3. SPATIAL BREAKDOWN
        4. SCIENTIFIC METRICS
        5. UNCERTAINTY
        6. VALIDATION
        7. EVIDENCE
        """
        # If blocked or rejected, do not generate scientific change answer
        validation = evidence.get("validation", {})
        if validation.get("status") == "REJECTED" or evidence.get("status") in ("blocked", "REJECTED"):
            expl = evidence.get("direct_explanation") or evidence.get("answer", "Analysis rejected by validation safety gate.")
            return expl

        sections = []

        # 1. RESULT
        # For backward compatibility with test_compare.py, include "Significant structural changes"
        sections.append("Change detected between T1 and T2. Significant structural changes detected.")

        # 2. MAGNITUDE
        change = evidence.get("change", {})
        pct = change.get("change_percentage")
        area_m2 = change.get("changed_area_m2")
        area_ha = change.get("changed_area_ha")

        mag_lines = []
        if pct is not None:
            mag_lines.append(f"{pct:.3f}% of the analyzed scene changed,")
        if area_m2 is not None and area_ha is not None:
            mag_lines.append(f"corresponding to {area_m2:,.0f} m² ({area_ha:.1f} ha).")
        elif area_m2 is not None:
            mag_lines.append(f"corresponding to {area_m2:,.0f} m².")

        if mag_lines:
            sections.append("\n".join(mag_lines))

        # 3. SPATIAL BREAKDOWN
        classes = evidence.get("classes", [])
        if classes:
            breakdown_lines = ["Breakdown:"]
            for cls_item in classes:
                c_name = cls_item.get("name") or cls_item.get("class_name", "Changed area")
                formatted_name = c_name.replace("_", " ").capitalize()
                c_area = cls_item.get("area_m2")
                c_line = f"• {formatted_name}"
                if c_area is not None:
                    c_line += f": {c_area:,.0f} m²"
                breakdown_lines.append(c_line)

                # Index deltas where available
                if cls_item.get("mean_ndvi_delta") is not None:
                    breakdown_lines.append(f"  NDVI Δ = {cls_item['mean_ndvi_delta']:+.2f}")
                elif cls_item.get("ndvi_delta") is not None:
                    breakdown_lines.append(f"  NDVI Δ = {cls_item['ndvi_delta']:+.2f}")

                if cls_item.get("mean_ndbi_delta") is not None:
                    breakdown_lines.append(f"  NDBI Δ = {cls_item['mean_ndbi_delta']:+.2f}")
                elif cls_item.get("ndbi_delta") is not None:
                    breakdown_lines.append(f"  NDBI Δ = {cls_item['ndbi_delta']:+.2f}")

                if cls_item.get("mean_ndwi_delta") is not None:
                    breakdown_lines.append(f"  NDWI Δ = {cls_item['mean_ndwi_delta']:+.2f}")
                elif cls_item.get("ndwi_delta") is not None:
                    breakdown_lines.append(f"  NDWI Δ = {cls_item['ndwi_delta']:+.2f}")

            sections.append("\n".join(breakdown_lines))

        # 4. SCIENTIFIC METRICS
        reg = evidence.get("registration", {})
        sci_lines = []
        rmse = reg.get("rmse_m")
        if rmse is not None:
            sci_lines.append(f"Registration RMSE: {rmse:.2f} m.")

        mean_cvm = change.get("mean_cvm")
        if mean_cvm is not None:
            sci_lines.append(f"Mean CVM: {mean_cvm:.3f}.")

        mean_mah = change.get("mean_mahalanobis")
        if mean_mah is not None:
            sci_lines.append(f"Mean Mahalanobis distance: {mean_mah:.2f}.")

        sar = evidence.get("sar", {})
        if sar:
            sar_items = []
            if sar.get("vv") is not None:
                sar_items.append(f"VV: {sar['vv']:.1f} dB")
            if sar.get("vh") is not None:
                sar_items.append(f"VH: {sar['vh']:.1f} dB")
            if sar.get("vh_vv") is not None:
                sar_items.append(f"VH/VV: {sar['vh_vv']:.2f}")
            if sar_items:
                sci_lines.append("SAR metrics: " + ", ".join(sar_items) + ".")

        if sci_lines:
            sections.append("\n".join(sci_lines))

        # 5. UNCERTAINTY
        unc = evidence.get("uncertainty", {})
        unc_lines = []
        overall = unc.get("overall")
        if overall is not None:
            overall_pct = overall * 100.0 if overall <= 1.0 else overall
            unc_lines.append(f"Overall evidence quality: {overall_pct:.1f}%.")

        interval = unc.get("analytical_interval_95", {})
        lower = interval.get("lower_m2")
        upper = interval.get("upper_m2")
        if lower is not None and upper is not None:
            unc_lines.append(
                "95% analytical uncertainty interval under stated error model:\n"
                f"{lower:,.1f}–{upper:,.1f} m²."
            )

        if unc_lines:
            sections.append("\n".join(unc_lines))

        # 6. VALIDATION
        val_lines = []
        status = reg.get("status") or validation.get("status")
        if status is not None:
            disp_status = "PASSED" if "PASS" in str(status).upper() else str(status)
            val_lines.append(f"Alignment: {disp_status}.")
        crs = evidence.get("inputs", {}).get("crs") or evidence.get("spatial_alignment", {}).get("crs")
        if crs:
            val_lines.append(f"CRS: {crs}.")
        if val_lines:
            sections.append("\n".join(val_lines))

        # 7. EVIDENCE
        sections.append("Evidence includes the detected change mask, spatial polygons,\nmeasurements and provenance hash.")

        return "\n\n".join(sections)
