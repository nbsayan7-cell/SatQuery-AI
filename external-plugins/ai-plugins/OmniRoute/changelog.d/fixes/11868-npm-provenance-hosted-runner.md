- Split the npm registry upload into its own GitHub-hosted job. npm refuses
  `--provenance` from a self-hosted runner (`422 ... Only "github-hosted" runners
  are supported`), which blocked the v3.8.50 publish; the heavy verification
  cannot move to a hosted runner, so it now hands the proven tarball over instead.
