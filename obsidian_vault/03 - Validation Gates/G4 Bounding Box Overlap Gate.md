---
title: G4 Bounding Box Overlap Gate
tags: [satquery, gate, safety]
type: validation-gate
status: verified
---

# G4 Bounding Box Overlap Gate

Validates that two scenes share positive geographic spatial overlap:

$$\mathrm{IoU}(\text{BBox}_A, \text{BBox}_B) = \frac{\text{Area}(\text{BBox}_A \cap \text{BBox}_B)}{\text{Area}(\text{BBox}_A \cup \text{BBox}_B)} > 0.0$$

If $\mathrm{IoU} = 0.0$, the pipeline immediately terminates with `400 INCOMPATIBLE_SPATIAL_EXTENT`.\n