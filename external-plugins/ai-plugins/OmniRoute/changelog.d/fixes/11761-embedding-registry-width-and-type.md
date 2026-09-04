- Keep the embedding registry's vector width and `embedding` type on models when a synced model exists
  for the same id, so `/v1/models` no longer reports registry-described embedding models widthless or
  untyped (#11761)
- Correct `google/gemini-embedding-001` on the OpenRouter route to 3072 dimensions, the width it
  returns when `dimensions` is not sent (#11761)
