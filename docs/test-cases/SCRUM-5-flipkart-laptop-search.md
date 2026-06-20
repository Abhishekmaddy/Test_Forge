# Test Cases — SCRUM-5: Flipkart Laptop Search

**JIRA:** SCRUM-5 — "Flipkart Test Scraniro" (Status: In Progress, Assignee: Abhishek Sharma)

**User Story (from JIRA description):**
> Open the flipkart and click the cross icon on the login page and search the laptop in range 90000 and open the one laptop and open the laptop and get all the details

**Automation:** `features/flipkart-laptop-search.feature` / `src/steps/flipkart.steps.ts` / `src/pages/flipkart.page.ts`

---

TC-001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-001
TITLE          : Search for a laptop within budget and verify product details
TYPE           : Positive
PRIORITY       : High
PRECONDITIONS  : Flipkart homepage is reachable; network is available
TEST STEPS     :
  Step 1: Open the Flipkart homepage
  Step 2: Close the login popup using the cross ("✕") icon
  Step 3: Search for "laptop"
  Step 4: Open the first result priced within Rs. 90000
TEST DATA      : query = "laptop", maxPrice = 90000
EXPECTED RESULT: Product page opens; product name matches the search-result card; price is <= 90000; details (name, price, rating) are captured in the report
ACTUAL RESULT  : Pass
STATUS         : Automated — `Search for a laptop within a price range and verify its details` (@smoke @flipkart)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TC-002
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-002
TITLE          : Login popup is dismissed successfully before searching
TYPE           : Positive
PRIORITY       : Medium
PRECONDITIONS  : Flipkart homepage is loaded
TEST STEPS     :
  Step 1: Open the Flipkart homepage
  Step 2: Click the cross icon on the login popup
TEST DATA      : N/A
EXPECTED RESULT: Login popup is no longer visible; homepage remains usable
ACTUAL RESULT  : Pass
STATUS         : Automated — covered implicitly by `dismissLoginPopup()` in every scenario; popup absence is tolerated (try/catch) so it also passes when the popup doesn't render
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TC-003
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-003
TITLE          : Searching with an unrealistically low budget returns no laptops
TYPE           : Negative
PRIORITY       : Medium
PRECONDITIONS  : Search results for "laptop" are displayed
TEST STEPS     :
  Step 1: Open the Flipkart homepage, dismiss the popup, search "laptop"
  Step 2: Filter candidates by an unrealistic budget (Rs. 100)
TEST DATA      : maxPrice = 100
EXPECTED RESULT: Zero candidates are returned; no product page is opened; no crash
ACTUAL RESULT  : Pass
STATUS         : Automated — `Searching with an unrealistically low budget returns no laptops` (@negative @flipkart)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TC-004
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-004
TITLE          : Search term with no matching products
TYPE           : Negative
PRIORITY       : Low
PRECONDITIONS  : Flipkart homepage is loaded
TEST STEPS     :
  Step 1: Search for a nonsense term (e.g. "asdkjqwheiqwheproduct")
TEST DATA      : query = "zzxxqqwweerrttnonsenseproduct12345"
EXPECTED RESULT: No product links render for the query; no crash
ACTUAL RESULT  : Pass
STATUS         : Automated — `Searching with a nonsense term returns no products` (@negative @flipkart). Detects "no results" by absence of product-card links rather than matching Flipkart's copy text, since the exact wording isn't ours to control and may vary by query.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TC-005
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-005
TITLE          : Selected laptop price never exceeds the requested budget
TYPE           : Edge Case
PRIORITY       : High
PRECONDITIONS  : At least one laptop exists at/under the budget
TEST STEPS     :
  Step 1: Search "laptop", open a result within Rs. 90000
  Step 2: Read the price on the product detail page
TEST DATA      : maxPrice = 90000
EXPECTED RESULT: Selected product's price <= 90000
ACTUAL RESULT  : Pass
STATUS         : Automated — `the laptop price should not exceed the budget of "90000"` step, asserted in TC-001's scenario
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TC-006
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-006
TITLE          : Budget filter at a very high ceiling still returns the cheapest/first candidate
TYPE           : Edge Case
PRIORITY       : Low
PRECONDITIONS  : Search results for "laptop" are displayed
TEST STEPS     :
  Step 1: Search "laptop", filter by an unrestrictive budget (e.g. Rs. 10,00,000)
TEST DATA      : maxPrice = 1000000
EXPECTED RESULT: Returns the same first candidate as an unfiltered search
ACTUAL RESULT  : Pass
STATUS         : Automated — `A high budget ceiling returns the same first laptop as an unfiltered search` (@edge-case @flipkart). Both the "unfiltered" and "high ceiling" views are derived from the same already-rendered results page (`getAllProducts()` / `getProductsWithinBudget()`, no re-search in between), which removes the original flakiness concern of two separate live searches landing on different ad/inventory states.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TC-007
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-007
TITLE          : Search input rejects/escapes script injection safely
TYPE           : Security
PRIORITY       : Low
PRECONDITIONS  : Flipkart homepage is loaded
TEST STEPS     :
  Step 1: Enter `<script>alert(1)</script>` into the search box and submit
TEST DATA      : query = "<script>alert(1)</script>"
EXPECTED RESULT: No JavaScript dialog fires; input is treated as a literal search string
ACTUAL RESULT  : Pass
STATUS         : Automated — `Search input does not execute injected script` (@security @flipkart). Asserts via a `page.on('dialog', ...)` listener that no alert/confirm/prompt fired during/after the search, rather than asserting on Flipkart's exact rendered markup.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TC-008
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-008
TITLE          : Product detail page renders name, price, and image
TYPE           : UI/UX
PRIORITY       : Medium
PRECONDITIONS  : A laptop product page is open
TEST STEPS     :
  Step 1: Open a laptop's product detail page
  Step 2: Verify name (h1), price, and primary image are visible
TEST DATA      : N/A
EXPECTED RESULT: All three elements are visible and non-empty
ACTUAL RESULT  : Pass
STATUS         : Automated — `verifyProductPageDisplayed()`/`getProductDetails()` cover name + price; `the laptop product image should be visible` step (added to TC-001's scenario) checks for at least one rendered `img[src]` on the page. Uses a generic image-presence check rather than a specific class selector, since Flipkart's PDP image classes rotate across deploys.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TC-009
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CASE ID   : TC-009
TITLE          : Captured laptop details are attached to the test report
TYPE           : Positive
PRIORITY       : Medium
PRECONDITIONS  : A laptop has been opened and its details fetched
TEST STEPS     :
  Step 1: Capture name, price, rating, rating count, URL
  Step 2: Attach a JSON payload and a screenshot to the Allure report
TEST DATA      : N/A
EXPECTED RESULT: Allure report contains the JSON attachment and the screenshot for the scenario
ACTUAL RESULT  : Pass
STATUS         : Automated — `I capture the laptop details in the report` step
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Summary

| Type      | Count | Automated |
|-----------|-------|-----------|
| Positive  | 3     | 3         |
| Negative  | 2     | 2         |
| Edge Case | 2     | 2         |
| Security  | 1     | 1         |
| UI/UX     | 1     | 1         |

**9/9 test cases automated.** Scenarios live in `features/flipkart-laptop-search.feature` (5 scenarios):
- `@smoke @flipkart` Search for a laptop within a price range and verify its details (TC-001, TC-005, TC-008, TC-009)
- `@negative @flipkart` Searching with an unrealistically low budget returns no laptops (TC-003)
- `@negative @flipkart` Searching with a nonsense term returns no products (TC-004)
- `@security @flipkart` Search input does not execute injected script (TC-007)
- `@edge-case @flipkart` A high budget ceiling returns the same first laptop as an unfiltered search (TC-006)

Every case originally marked "recommended, not automated" was closed out using detection strategies that don't depend on Flipkart's exact copy, CSS classes, or repeated live searches: absence-of-results-link detection, dialog-event listening, generic image presence, and deriving comparison views from a single already-rendered page instead of two separate searches.
