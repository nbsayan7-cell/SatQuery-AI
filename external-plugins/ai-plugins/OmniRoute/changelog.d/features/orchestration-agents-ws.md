- **feat(dashboard):** the `/dashboard/orchestration` snapshot hook now subscribes to the
  `agents` WebSocket channel (`agent.task.updated`) instead of `requests` as its refetch
  trigger, and relaxes its background poll from 5s to 30s while that WS connection is up —
  falling back to the tighter 5s cadence, reprogrammed live on any connect/disconnect
  transition, whenever the socket is down.
