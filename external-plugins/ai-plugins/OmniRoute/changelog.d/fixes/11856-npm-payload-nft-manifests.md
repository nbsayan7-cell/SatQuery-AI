- Excluded Next.js Node File Trace manifests (`*.nft.json`) from the published npm
  tarball. They are build-time metadata and are never read while serving, but had
  grown to 668.7 MB — 61% of the package — which pushed the upload past the
  registry limit and made `npm publish` fail with `413 Payload Too Large`.
