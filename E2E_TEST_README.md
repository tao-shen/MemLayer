# E2E Stress Test for Immediate UI Feedback

## Purpose
This test verifies that the deployed Tacits Candy Shop site provides **immediate UI feedback** (within 1 second) after sending a message, before the AI response starts streaming.

## Test Coverage

### 1. Navigation & Discovery
- Loads the deployed site
- Finds and enters a skill executor interface
- Locates chat input and send button

### 2. First Message Test
- Sends: "帮我做联邦学习的理论分析，收敛性分析"
- **Measures time to first UI feedback** (target: < 1000ms)
- Looks for: "Thinking...", loading spinners, assistant bubbles, etc.
- Waits for full response completion

### 3. Multi-Turn Test
- Sends second message: "请继续深入分析 FedAvg 的收敛速率上界"
- Verifies immediate feedback still works
- Confirms no page crashes

### 4. Error Detection
- Monitors console for React Error #31
- Captures SSE/OpenCode related logs
- Detects page crashes

## Installation

```bash
# Install Playwright
npm install --save-dev playwright

# Install browsers
npx playwright install chromium
```

## Running the Test

```bash
# Run with visible browser (recommended for first run)
node e2e-stress-test.js

# Or use npm script
npm --prefix . -c "npm install playwright && npm test" -f e2e-test-package.json
```

## Output

### Screenshots
The test captures screenshots at each step:
- `screenshots/01-homepage.png` - Initial page load
- `screenshots/02-before-click.png` - Before entering skill
- `screenshots/03-after-click.png` - After entering skill executor
- `screenshots/04-message-typed.png` - Message typed but not sent
- `screenshots/05-after-send.png` - Immediately after sending
- `screenshots/06-response-complete.png` - First response complete
- `screenshots/07-second-message-sent.png` - Second message sent
- `screenshots/08-second-response.png` - Second response complete
- `screenshots/error.png` - If test crashes

### Results File
`test-results.json` contains:
- Timing for each step
- Feedback detection times
- Console errors and React errors
- Final pass/fail verdict

### Console Output
Real-time logging shows:
- Navigation progress
- Element discovery
- **Immediate feedback timing** (critical metric)
- Console messages from the page
- Final verdict summary

## Success Criteria

✅ **PASS** requires:
1. First message: Immediate feedback appears within 1000ms
2. Second message: Immediate feedback appears within 1000ms
3. No React Error #31 or minified React errors
4. No page crashes
5. Both responses complete successfully

❌ **FAIL** if:
- Feedback takes > 1000ms to appear
- Page crashes or shows React errors
- Cannot find skill executor interface
- Responses fail to complete

## Expected Behavior

After clicking send, you should see **within 1 second**:
- A "Thinking..." indicator, OR
- An empty assistant message bubble, OR
- A loading spinner/animation, OR
- Any visual change indicating message was received

This happens **before** the AI starts streaming the actual response.

## Troubleshooting

### Test can't find skill executor
- Check if site structure changed
- Update selectors in the script
- Manually verify the site is accessible

### Feedback not detected but visually present
- The feedback element might use different selectors
- Add the selector to `feedbackSelectors` array in the script

### Timeout waiting for response
- Increase timeout in Step 4 (currently 90 seconds)
- Check if the AI service is responding

## Key Metrics

The test measures and reports:
- **Feedback Time (1st message)**: Time from send to first UI feedback
- **Feedback Time (2nd message)**: Same for second message
- **Response Time**: Time to complete full AI response
- **Error Count**: React errors and page errors

## Integration with CI/CD

Exit codes:
- `0`: All tests passed
- `1`: Test failed or error occurred

Can be integrated into deployment pipeline:
```bash
npm test || echo "E2E test failed - immediate feedback not working"
```
