# 🤖 Prompt for Claude Code Agent: Feature Gap Analysis

Copy and paste this entire prompt into your Claude Code chat:

---

## Feature Gap Analysis - NH Terminal

I'm working on the NH Terminal trading platform based on design mockups. I need you to analyze what features are currently implemented vs what's missing based on the design specifications.

### Project Context:
- **Project Name:** NH Terminal (nh-terminal folder)
- **Framework:** React 18 + Vite + Tailwind CSS
- **Current Status:** Core components built, but many features incomplete

### Design Reference:
I have PNG mockups showing what the final product should look like:
- **dekstop.png** - Main dashboard page
- **dekstop-1.png** - Signals/trading signals page
- **dekstop-2.png** - Signals page continued
- **dekstop-3.png** - Market overview page
- **dekstop-4.png** - Community page (forum)
- **dekstop-5.png** - User profile page
- **dekstop-6.png** - Community live trade chat
- **dekstop-7.png** - Community chat interface
- **dekstop-8.png** - Community announcements/info
- **dekstop-9.png** - Market analysis/outlook
- **dekstop-10.png** - Market research/calendar
- **dekstop-11.png** - Economic calendar detail
- **login.png** - Login page

### What I Need You To Do:

**TASK 1: Audit Current Implementation**
1. Check `src/components/` folder
2. List ALL components that exist:
   - What's in each component?
   - Is it complete or just a stub?
   - What's working vs what's placeholder?

3. Check each main page/section:
   ```
   [ ] Dashboard - How complete? (0-100%)
   [ ] Signals - How complete? (0-100%)
   [ ] Market - How complete? (0-100%)
   [ ] Community - How complete? (0-100%)
   [ ] Profile - How complete? (0-100%)
   [ ] Auth/Login - How complete? (0-100%)
   ```

**TASK 2: Feature-by-Feature Breakdown**

Please create a table showing:

```
FEATURE | EXPECTED (from PNG) | CURRENT STATUS | MISSING PARTS
---------|-------------------|----------------|----------------
Dashboard Price Card | Shows XAU/USD, price, change%, high/low/open | ✅ Done | None
Dashboard Chart | Area chart with red gradient | ✅ Done | None
Economic Calendar | Grid of events with time, impact, name | 🟡 Partial | Missing full event details
... (continue for ALL features)
```

**TASK 3: Missing Features Priority List**

Output a prioritized list like:

```
MISSING FEATURES (By Priority):

🔴 PRIORITY 1 (CRITICAL - Core functionality):
- Feature name
- Feature name
- Feature name

🟡 PRIORITY 2 (IMPORTANT - Should have):
- Feature name
- Feature name

🟢 PRIORITY 3 (NICE TO HAVE - Can add later):
- Feature name
- Feature name
```

**TASK 4: Specific Questions**

Answer these:

1. **Dashboard Page:**
   - [ ] Is the price card fully implemented?
   - [ ] Does the chart update in real-time?
   - [ ] Are the stat boxes (Active Signals, Win Rate, Net Pips) displaying?
   - [ ] Is the economic calendar showing?
   - [ ] Is the latest signal section showing?
   - [ ] Is market sentiment displaying correctly?

2. **Signals Page:**
   - [ ] Are signal cards displaying in a grid?
   - [ ] Can users filter signals (by session, status, result)?
   - [ ] Can users create new signals?
   - [ ] Is the "TIM EXPERT" vs "AI REAL-TIME" toggle working?
   - [ ] Do signal cards show: type, pair, session, entry, SL, TP1, TP2, pips, chart?
   - [ ] Can users see signal history?

3. **Market Page:**
   - [ ] Are all tabs working (Chart, Outlook, Research, Calendar)?
   - [ ] Is the market chart rendering?
   - [ ] Is daily outlook showing?
   - [ ] Is session overview showing (Asia, London, New York)?
   - [ ] Are key market drivers displaying?
   - [ ] Is economic calendar complete?

4. **Community Page:**
   - [ ] Are forum posts displaying?
   - [ ] Can users create new posts?
   - [ ] Is live trade chat working?
   - [ ] Is general chat working?
   - [ ] Are announcements showing?
   - [ ] Are user tier badges showing?

5. **Profile Page:**
   - [ ] Is user profile card showing?
   - [ ] Are reward tiers displaying?
   - [ ] Is progress bar showing tier progress?
   - [ ] Are educational videos displaying?
   - [ ] Is reward program showing?

3. **Login Page:**
   - [ ] Is login form styled correctly?
   - [ ] Is form validation working?
   - [ ] Does it redirect to dashboard after login?

**TASK 5: Create Detailed Gap Report**

Please generate a report with this structure:

```markdown
# NH Terminal - Feature Gap Analysis Report

## Summary
- Total Features Needed: X
- Features Implemented: X
- Features Missing/Incomplete: X
- Overall Completion: X%

## By Page

### 1. Dashboard - X% Complete
**Currently Works:**
- List of working features

**Missing/Broken:**
- List of issues

**Components Involved:**
- List components

### 2. Signals - X% Complete
**Currently Works:**
- List of working features

**Missing/Broken:**
- List of issues

**Components Involved:**
- List components

[Continue for all pages...]

## Missing Components (Need to Create)
- ComponentName - Used on X page
- ComponentName - Used on X page

## Incomplete Stubs (Need to Finish)
- ComponentName - Missing: X, Y, Z

## Priority Order to Build
1. [Feature] - Estimated time: X hours
2. [Feature] - Estimated time: X hours
3. [Feature] - Estimated time: X hours

## Recommendations
- [What should be built first]
- [What's dependent on what]
- [Any architectural changes needed]
```

---

## Important Notes:

1. **Be thorough** - Check actual component code, not just folder structure
2. **Be honest** - Mark components as "stub", "partial", or "complete"
3. **Test as you go** - Try to mentally run through user flows
4. **Focus on UX** - Does the feature work from user perspective?
5. **Check props** - Are props being passed correctly?

---

## After You Provide This Report:

Once you've done this analysis, I'll:
1. Get a clear picture of what's done vs what's not
2. See exactly what features need building
3. Know the priority order
4. Be able to build the missing features efficiently

And you can let me know:
- **If I ask "how should this look?"** - Just send the PNG image again, no problem!
- **If the design changes** - Update me with the new mockup
- **If priorities change** - Just tell me and I'll reorder

---

## When You're Ready:

Run this analysis and share the report. Then tell me:
1. ✅ What's the #1 priority feature to build?
2. ✅ What page should I focus on first?
3. ✅ Any specific requirements or changes to the design?

I'm ready to build! 🚀

---

**GO!** Run this analysis and let me know what's missing! ✨
