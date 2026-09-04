- The `next-build` artefact (1.3 GB) is now written and read under `$RUNNER_TEMP`
  (per-runner, on disk) instead of `/tmp`, which on the self-hosted pool is a
  12 GB tmpfs in RAM. Landing it there took 27–32 of the publish job's 76 minutes,
  and the fixed `/tmp/e2e-build.tar.gz` name let E2E jobs on different runners
  overwrite each other's download.
