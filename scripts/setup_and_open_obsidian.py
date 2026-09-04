"""
Configure Obsidian workspace and register + launch vault automatically.
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path

VAULT_PATH = Path(r"C:\Users\Sayan Saha\Downloads\sih\SatQuery-AI\obsidian_vault")
OBSIDIAN_JSON_PATH = Path(os.environ["APPDATA"]) / "obsidian" / "obsidian.json"

# 1. Setup workspace.json in vault so Graph View opens by default
workspace_config = {
    "main": {
        "id": "main-split",
        "type": "split",
        "children": [
            {
                "id": "main-tabs",
                "type": "tabs",
                "children": [
                    {
                        "id": "graph-tab",
                        "type": "leaf",
                        "state": {
                            "type": "graph",
                            "state": {}
                        }
                    },
                    {
                        "id": "doc-tab",
                        "type": "leaf",
                        "state": {
                            "type": "markdown",
                            "state": {
                                "file": "00 - Maps of Content/🧭 SatQuery Master MOC.md",
                                "mode": "preview"
                            }
                        }
                    }
                ],
                "currentTab": 0
            }
        ],
        "direction": "vertical"
    },
    "active": "graph-tab"
}

workspace_file = VAULT_PATH / ".obsidian" / "workspace.json"
workspace_file.parent.mkdir(parents=True, exist_ok=True)
with open(workspace_file, "w", encoding="utf-8") as f:
    json.dump(workspace_config, f, indent=2)
print(f"Created {workspace_file} with default Graph View layout.")

# 2. Register vault in Obsidian global config
if OBSIDIAN_JSON_PATH.exists():
    try:
        with open(OBSIDIAN_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        data = {"vaults": {}}
else:
    OBSIDIAN_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    data = {"vaults": {}}

vaults = data.setdefault("vaults", {})
# Check if path already registered
vault_id = None
vault_path_str = str(VAULT_PATH.resolve())
for vid, vinfo in vaults.items():
    if vinfo.get("path") == vault_path_str:
        vault_id = vid
        break

if not vault_id:
    vault_id = "satquery" + hex(int(time.time()))[2:]
    print(f"Assigning new vault ID: {vault_id}")

vaults[vault_id] = {
    "path": vault_path_str,
    "ts": int(time.time() * 1000),
    "open": True
}

with open(OBSIDIAN_JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
print(f"Registered '{vault_path_str}' in {OBSIDIAN_JSON_PATH}.")

# 3. Launch/Open in Obsidian via URI protocol
uri = f"obsidian://open?path={subprocess.list2cmdline([vault_path_str]).strip('\"')}"
print(f"Invoking Obsidian URI: {uri}")

powershell_cmd = f'Start-Process "obsidian://open?path={vault_path_str.replace(" ", "%20").replace(":", "%3A").replace("\\\\", "%2F")}"'
res = subprocess.run(["powershell", "-Command", powershell_cmd], capture_output=True, text=True)
print("Obsidian command executed:", res.returncode)
if res.stdout:
    print(res.stdout)
if res.stderr:
    print(res.stderr)
