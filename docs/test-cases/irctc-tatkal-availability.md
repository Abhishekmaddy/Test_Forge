# Test Cases — IRCTC Tatkal Seat Availability Search

**Automation:** `features/irctc/irctc-tatkal-availability.feature` / `src/steps/irctc/irctc.steps.ts` / `src/pages/irctc/irctc.page.ts`

**Scope:** This suite covers IRCTC's public train-search and seat-availability screens only. It does **not** log in, fill passenger details, enter payment information, or submit a booking. Automating an actual Tatkal ticket purchase violates IRCTC's terms of service and Section 143 of the Railways Act, 1989 (unauthorized software for railway ticket booking), so booking itself is intentionally out of scope.

**Selectors are first-pass and unverified against the live site.** Run headed (`HEADED=true`) on the first execution and adjust the locator fallback chains in `irctc.page.ts` to match the actual rendered DOM, the same way `flipkart.page.ts` accumulated fallback selectors over time.

---

TC-001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-001
TITLE          : Search for trains and check Tatkal-quota availability
TYPE           : Positive
PRIORITY       : High
PRECONDITIONS  : IRCTC train search page is reachable; network is available
TEST STEPS     :
  Step 1: Open the IRCTC train search page
  Step 2: Search trains from "NDLS" to "BCT" on a future date
  Step 3: Switch the first train's first class to TATKAL quota and read the availability status
TEST DATA      : from = "NDLS", to = "BCT", date = "2026-06-25"
EXPECTED RESULT: Train results render; Tatkal availability status matches a known vocabulary (AVAILABLE/WL/RAC/REGRET/NOT AVAIL/TRAIN DEP)
STATUS         : Automated — `Search for trains between two stations and view Tatkal availability` (@smoke @irctc)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TC-002
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-002
TITLE          : Same origin and destination station is rejected
TYPE           : Negative
PRIORITY       : Medium
PRECONDITIONS  : IRCTC train search page is loaded
TEST STEPS     :
  Step 1: Search trains from "NDLS" to "NDLS"
EXPECTED RESULT: A station validation error is shown; no results render
STATUS         : Automated — `Searching with the same origin and destination is rejected` (@negative @irctc)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TC-003
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-003
TITLE          : Past journey date is rejected
TYPE           : Negative
PRIORITY       : Medium
PRECONDITIONS  : IRCTC train search page is loaded
TEST STEPS     :
  Step 1: Search trains from "NDLS" to "BCT" on a past date
TEST DATA      : date = "2020-01-01"
EXPECTED RESULT: A journey-date validation error is shown; no results render
STATUS         : Automated — `Searching with a past journey date is rejected` (@negative @irctc)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TC-004
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-004
TITLE          : Unrecognized destination station yields no results
TYPE           : Edge Case
PRIORITY       : Low
PRECONDITIONS  : IRCTC train search page is loaded
TEST STEPS     :
  Step 1: Search trains from "NDLS" to an unrecognized code ("ZZZZ")
EXPECTED RESULT: No train cards render; a no-trains outcome is shown; no crash
STATUS         : Automated — `Searching with an unrecognized destination station yields no results` (@edge-case @irctc)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TC-005
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-005
TITLE          : Train search form renders all required fields
TYPE           : UI/UX
PRIORITY       : Medium
PRECONDITIONS  : IRCTC train search page is loaded
TEST STEPS     :
  Step 1: Verify origin, destination, journey date, and search button are visible
EXPECTED RESULT: All four elements are visible
STATUS         : Automated — `Train search form renders all required fields` (@ui @irctc)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TC-006
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-006
TITLE          : Origin station field rejects/escapes script injection safely
TYPE           : Security
PRIORITY       : Low
PRECONDITIONS  : IRCTC train search page is loaded
TEST STEPS     :
  Step 1: Enter `<script>alert(1)</script>` into the origin station field and search
EXPECTED RESULT: No JavaScript dialog fires; input is treated as a literal search string
STATUS         : Automated — `Station field does not execute injected script` (@security @irctc). Uses the same `page.on('dialog', ...)` detection approach as the Flipkart XSS test.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Summary

| Type      | Count | Automated |
|-----------|-------|-----------|
| Positive  | 1     | 1         |
| Negative  | 2     | 2         |
| Edge Case | 1     | 1         |
| UI/UX     | 1     | 1         |
| Security  | 1     | 1         |

**6/6 test cases automated.** Scenarios live in `features/irctc/irctc-tatkal-availability.feature` (6 scenarios). Run with `npm run test:irctc`.
