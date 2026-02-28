# Play Store Data Safety Checklist (Baseline)

Use this checklist before any Play Store submission.

- [ ] Inventory all data categories collected/processed by app + backend.
- [ ] Mark whether data is collected, shared, and/or transiently processed.
- [ ] Document purpose mapping for each data category.
- [ ] Confirm encryption in transit and at rest for production data stores.
- [ ] Confirm account deletion/data deletion flow and support contact path.
- [ ] Align privacy policy language with Data Safety declarations.
- [ ] Validate SDK declarations (analytics, crash reporting, ads, auth providers).
- [ ] Record evidence links for each declaration in release notes.

## Current scaffold status
- Local-only profile persistence exists in MVP web flow.
- Production telemetry/auth/data-deletion flows are pending implementation.
