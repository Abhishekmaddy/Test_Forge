export enum PromptType {
  TEST_PLAN = 'TEST_PLAN',
  TEST_CASES = 'TEST_CASES',
  BOTH = 'BOTH',
}

export class PromptBuilder {
  static build(type: PromptType, userStory: string, context?: string | null): string {
    const ctx: string =
      context && context.length > 0
        ? `CONTEXT FROM PAST TESTING:\n${context}\n\n`
        : '';

    switch (type) {
      case PromptType.TEST_PLAN:
        return PromptBuilder.buildTestPlanPrompt(userStory, ctx);
      case PromptType.TEST_CASES:
        return PromptBuilder.buildTestCasesPrompt(userStory, ctx);
      case PromptType.BOTH:
        return PromptBuilder.buildBothPrompt(userStory, ctx);
      default:
        return PromptBuilder.buildTestPlanPrompt(userStory, ctx);
    }
  }

  // ── PROMPT 1: Full 14-Section Test Plan ──────────────────────────
  private static buildTestPlanPrompt(story: string, ctx: string): string {
    return (
      'You are a senior QA Engineer with 10+ years of experience.\n' +
      'Generate a comprehensive professional QA Test Plan based on:\n\n' +
      'USER STORY:\n' + story + '\n\n' + ctx +
      'Generate a FULL professional test plan with ALL 14 sections:\n\n' +
      '1.  TEST PLAN IDENTIFIER  - Unique ID, Version, Date, Author\n' +
      '2.  INTRODUCTION          - Purpose, feature being tested\n' +
      '3.  OBJECTIVES            - List all testing objectives\n' +
      '4.  SCOPE                 - In Scope and Out of Scope\n' +
      '5.  TEST STRATEGY         - Types and levels of testing\n' +
      '6.  TEST ITEMS            - Test cases with ID, Steps, Expected Results\n' +
      '7.  TEST ENVIRONMENT      - Hardware, Software, Browser requirements\n' +
      '8.  ENTRY & EXIT CRITERIA - Conditions to start and stop testing\n' +
      '9.  TEST DELIVERABLES     - All documents to be produced\n' +
      '10. ROLES & RESPONSIBILITIES - QA Lead, Engineers, Developers, PO\n' +
      '11. TEST SCHEDULE         - Phases and estimated timelines\n' +
      '12. RISK & MITIGATION     - Risks with Probability, Impact, Mitigation\n' +
      '13. DEFECT MANAGEMENT     - Lifecycle, Severity, Jira process\n' +
      '14. APPROVALS             - Sign-off table: Name, Role, Signature, Date\n\n' +
      'Be detailed, specific, and professional. Use clear section headers.'
    );
  }

  // ── PROMPT 2: Test Cases Only (Playwright-ready) ──────────────────
  private static buildTestCasesPrompt(story: string, ctx: string): string {
    return (
      'You are a senior QA Engineer specializing in Playwright automation.\n' +
      'Generate detailed test cases for:\n\n' +
      'USER STORY:\n' + story + '\n\n' + ctx +
      'Use this format for EACH test case:\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      'TEST CASE ID   : TC-XXX\n' +
      'TITLE          : Short descriptive title\n' +
      'TYPE           : Positive / Negative / Edge Case\n' +
      'PRIORITY       : High / Medium / Low\n' +
      'PRECONDITIONS  : What must be true before this test\n' +
      'TEST STEPS     :\n' +
      '  Step 1: ...\n' +
      '  Step 2: ...\n' +
      'TEST DATA      : Specific data to use\n' +
      'EXPECTED RESULT: What should happen\n' +
      'ACTUAL RESULT  : (To be filled during execution)\n' +
      'STATUS         : (Pass/Fail/Blocked)\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      'Generate ALL these types:\n' +
      'POSITIVE TEST CASES    (happy path — at least 5)\n' +
      'NEGATIVE TEST CASES    (invalid inputs — at least 5)\n' +
      'EDGE CASES             (boundaries — at least 3)\n' +
      'SECURITY TEST CASES    (auth, access — at least 2)\n' +
      'UI/UX TEST CASES       (layout, responsive — at least 2)\n\n' +
      'Number all test cases sequentially (TC-001, TC-002 ...).'
    );
  }

  // ── PROMPT 3: Both Test Plan + Test Cases ─────────────────────────
  private static buildBothPrompt(story: string, ctx: string): string {
    return (
      'You are a senior QA Engineer.\n' +
      'Generate BOTH a Test Plan AND detailed Test Cases for:\n\n' +
      'USER STORY:\n' + story + '\n\n' + ctx +
      '═══ PART 1 — TEST PLAN (all 14 sections) ═══\n' +
      '1.TEST PLAN IDENTIFIER  2.INTRODUCTION  3.OBJECTIVES\n' +
      '4.SCOPE  5.STRATEGY  6.TEST ITEMS  7.ENVIRONMENT\n' +
      '8.ENTRY & EXIT CRITERIA  9.DELIVERABLES  10.ROLES\n' +
      '11.SCHEDULE  12.RISKS  13.DEFECT MANAGEMENT  14.APPROVALS\n\n' +
      '═══ PART 2 — DETAILED TEST CASES ═══\n' +
      'For each test case: TC ID | Title | Type | Priority | Steps | Expected Result\n' +
      'Include: Positive(5+), Negative(5+), Edge(3+), Security(2+), UI/UX(2+)'
    );
  }
}
