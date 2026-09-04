import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dockerGuide = readFileSync(new URL("../../docs/guides/DOCKER_GUIDE.md", import.meta.url), "utf8");
const envDoc = readFileSync(new URL("../../docs/reference/ENVIRONMENT.md", import.meta.url), "utf8");

test("DOCKER_GUIDE documents N independent DATA_DIRs as the large-job scale-out (#11024)", () => {
  assert.match(dockerGuide, /## Scale-out: N independent processes/);
  assert.match(dockerGuide, /DATA_DIR/);
  assert.match(dockerGuide, /replicas > 1/);
  assert.match(dockerGuide, /QUOTA_STORE_DRIVER=redis/);
  assert.match(dockerGuide, /#8075/);
  assert.doesNotMatch(
    dockerGuide,
    /deploy:\s*\n\s*replicas:\s*2/,
    "must not show replicas: 2 as the scale-out recipe"
  );
});

test("ENVIRONMENT.md points CHAT_MAX_HEAVY_IN_FLIGHT at per-process V8, not host RAM (#11024)", () => {
  const row = envDoc.split("\n").find((line) => line.includes("`OMNIROUTE_CHAT_MAX_HEAVY_IN_FLIGHT`"));
  assert.ok(row);
  assert.match(row, /one process|per process|V8/i);
  assert.match(row, /DATA_DIR|#11024/);
});
