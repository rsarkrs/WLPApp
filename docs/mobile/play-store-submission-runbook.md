# Play Store Submission Runbook (Baseline)

Use this checklist to prepare WLPApp for Play Console internal testing and submission.

## A) Technical readiness
- [ ] Mobile quality gate green (`Lighthouse PWA + Performance`).
- [ ] QA gate green (`Dedicated QA Phase`).
- [ ] Compliance docs present and reviewed:
  - `docs/compliance/privacy-policy.md`
  - `docs/compliance/play-store-data-safety-checklist.md`
- [ ] Android release pipeline produces signed AAB.

## B) Play Console setup
- [ ] Create app in Play Console.
- [ ] Configure package name/versioning policy.
- [ ] Upload signed AAB to internal testing track.
- [ ] Add tester emails/groups for internal testing.

## C) Store listing assets
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic
- [ ] Phone screenshots
- [ ] Short/long descriptions

## D) Policy and declarations
- [ ] Privacy Policy URL published and reachable.
- [ ] Data Safety form completed from checklist evidence.
- [ ] Content rating questionnaire completed.
- [ ] App access instructions provided (if auth exists).

## E) Internal test verification
- [ ] Install from internal track on physical Android device.
- [ ] Verify launch, planner generation, and shopping list flow.
- [ ] Capture crash/log evidence for any blockers.
- [ ] Record release go/no-go decision in PR or release notes.
