- **fix(combos):** clearing an agent feature in the combos editor now persists — unchecking
  context cache protection, or emptying the system message or tool filter, sends an explicit
  `null` instead of dropping the field from the `PUT` body, which the update merge read as
  "leave unchanged" ([#12177](https://github.com/diegosouzapw/OmniRoute/pull/12177)) — thanks @foreveryh
