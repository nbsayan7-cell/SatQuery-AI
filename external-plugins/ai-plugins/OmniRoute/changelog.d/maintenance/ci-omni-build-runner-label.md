- Every CI job that runs a `next build` (`build`, the npm `publish`, both release-green
  validations) now targets the `omni-build` runner label, which only two of the eight
  self-hosted runners carry. The box holds one build comfortably and two at the edge; a
  third now queues on GitHub instead of being OOM-killed by the kernel.
