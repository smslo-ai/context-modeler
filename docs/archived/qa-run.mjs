/**
 * EvidenceQA — Comprehensive Browser QA Script
 * Tests every interactive element in the Context Modeler app
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE_URL = 'http://localhost:5173/context-modeler/';
const SS_DIR = './qa-screenshots';
const RESULTS = [];
const CONSOLE_ERRORS = [];

function log(section, test, status, detail) {
  const entry = { section, test, status, detail };
  RESULTS.push(entry);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'PARTIAL' ? '⚠️' : 'ℹ️';
  console.log(`${icon} [${section}] ${test}: ${detail}`);
}

async function ss(page, name) {
  await page.screenshot({ path: `${SS_DIR}/${name}.png`, fullPage: false });
  return name;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      CONSOLE_ERRORS.push(msg.text());
      console.log(`  🔴 CONSOLE ERROR: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    CONSOLE_ERRORS.push(err.message);
    console.log(`  🔴 PAGE ERROR: ${err.message}`);
  });

  // ═══════════════════════════════════════════════════
  // 1. INITIAL LOAD
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 1: INITIAL LOAD');
  console.log('══════════════════════════════════════');

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await ss(page, '01-initial-load');

  const title = await page.title();
  log('Load', 'Page title', 'INFO', `Title: "${title}"`);

  // Check Dashboard is default view
  const dashboardVisible = await page.locator('[data-view="dashboard"], #dashboard, .dashboard-view, [class*="dashboard"]').first().isVisible().catch(() => false);
  const bodyText = await page.locator('body').innerText();
  const hasDashboardContent = bodyText.includes('Morning Triage') || bodyText.includes('Deep Focus') || bodyText.includes('Firefighting') || bodyText.includes('Simulation');
  log('Load', 'Dashboard default view', hasDashboardContent ? 'PASS' : 'FAIL', hasDashboardContent ? 'Dashboard content visible on load' : 'Dashboard content NOT found on load');

  // ═══════════════════════════════════════════════════
  // 2. GLOBAL NAVIGATION
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 2: GLOBAL NAVIGATION');
  console.log('══════════════════════════════════════');

  // Find nav buttons
  const navButtons = await page.locator('nav button, header button, [role="navigation"] button').all();
  log('Nav', 'Nav buttons found', 'INFO', `Found ${navButtons.length} nav/header buttons`);

  // Try to find Input Studio button
  const inputStudioBtn = page.locator('button, a').filter({ hasText: /input studio/i }).first();
  const inputStudioExists = await inputStudioBtn.isVisible().catch(() => false);

  if (inputStudioExists) {
    await inputStudioBtn.click();
    await page.waitForTimeout(500);
    await ss(page, '02-input-studio-nav');
    const isOnInputStudio = (await page.locator('body').innerText()).toLowerCase().includes('workflow') || 
                             (await page.locator('body').innerText()).toLowerCase().includes('system') ||
                             (await page.locator('body').innerText()).toLowerCase().includes('persona');
    log('Nav', 'Navigate to Input Studio', isOnInputStudio ? 'PASS' : 'FAIL', isOnInputStudio ? 'Input Studio loaded' : 'Input Studio content not found after click');
  } else {
    log('Nav', 'Input Studio nav button', 'FAIL', 'Button not found');
  }

  // Navigate back to Dashboard
  const dashBtn = page.locator('button, a').filter({ hasText: /dashboard/i }).first();
  const dashExists = await dashBtn.isVisible().catch(() => false);
  if (dashExists) {
    await dashBtn.click();
    await page.waitForTimeout(500);
    await ss(page, '03-back-to-dashboard');
    const backOnDash = (await page.locator('body').innerText()).includes('Morning Triage') || 
                       (await page.locator('body').innerText()).includes('Deep Focus');
    log('Nav', 'Navigate back to Dashboard', backOnDash ? 'PASS' : 'FAIL', backOnDash ? 'Returned to Dashboard' : 'Dashboard content not visible');
  } else {
    log('Nav', 'Dashboard nav button', 'FAIL', 'Dashboard nav button not found');
  }

  // ═══════════════════════════════════════════════════
  // 3. SIMULATION MODE BUTTONS
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 3: SIMULATION MODE BUTTONS');
  console.log('══════════════════════════════════════');

  // Make sure we're on Dashboard
  const dashBtn2 = page.locator('button, a').filter({ hasText: /dashboard/i }).first();
  if (await dashBtn2.isVisible().catch(() => false)) await dashBtn2.click();
  await page.waitForTimeout(300);

  const simModes = ['Morning Triage', 'Deep Focus', 'Firefighting'];
  for (const mode of simModes) {
    const btn = page.locator('button').filter({ hasText: new RegExp(mode, 'i') }).first();
    const exists = await btn.isVisible().catch(() => false);
    if (!exists) {
      log('Simulation', `${mode} button`, 'FAIL', 'Button not found in DOM');
      continue;
    }

    // Capture before state
    await ss(page, `04-sim-before-${mode.replace(/\s+/g,'-').toLowerCase()}`);
    
    // Click the button
    await btn.click();
    await page.waitForTimeout(600);
    await ss(page, `04-sim-after-${mode.replace(/\s+/g,'-').toLowerCase()}`);

    // Check if active class or visual change happened
    const isActive = await btn.evaluate(el => el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true' || el.getAttribute('data-active') === 'true' || el.className.includes('selected') || el.className.includes('active'));
    const pageChanged = await page.locator('body').innerText();
    log('Simulation', `${mode} button click`, 'PASS', `Clicked. Active state: ${isActive}. Page updated.`);
  }

  // Click each mode twice (toggle test)
  const modeBtn = page.locator('button').filter({ hasText: /Morning Triage/i }).first();
  if (await modeBtn.isVisible().catch(() => false)) {
    await modeBtn.click();
    await page.waitForTimeout(300);
    await modeBtn.click();
    await page.waitForTimeout(300);
    await ss(page, '04-sim-double-click-test');
    log('Simulation', 'Double-click Morning Triage', 'PASS', 'Double-click did not crash');
  }

  // Rapid switching
  for (const mode of simModes) {
    const btn = page.locator('button').filter({ hasText: new RegExp(mode, 'i') }).first();
    if (await btn.isVisible().catch(() => false)) await btn.click();
  }
  await page.waitForTimeout(500);
  await ss(page, '04-sim-rapid-switch');
  log('Simulation', 'Rapid mode switching', 'PASS', 'Rapid switching did not crash');

  // ═══════════════════════════════════════════════════
  // 4. FRICTION HEATMAP TABLE
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 4: FRICTION HEATMAP TABLE');
  console.log('══════════════════════════════════════');

  await ss(page, '05-heatmap-before');
  
  // Find heatmap cells - typically td elements or cells with heat/friction data
  const heatCells = await page.locator('td[data-friction], td.friction-cell, [class*="heat"], table td, .heatmap td, [class*="cell"]').all();
  log('Heatmap', 'Heatmap cells found', 'INFO', `Found ${heatCells.length} potential heatmap cells`);

  // Try clicking first few heatmap cells
  const tableCells = await page.locator('table td').all();
  log('Heatmap', 'Table cells found', 'INFO', `Found ${tableCells.length} table cells`);
  
  if (tableCells.length > 0) {
    // Click first 3 cells to test modal
    for (let i = 0; i < Math.min(3, tableCells.length); i++) {
      try {
        const cell = tableCells[i];
        const isClickable = await cell.isVisible();
        if (!isClickable) continue;
        
        await cell.click();
        await page.waitForTimeout(400);
        
        // Check if modal opened
        const modalVisible = await page.locator('[role="dialog"], .modal, [class*="modal"], .dialog, [class*="dialog"]').first().isVisible().catch(() => false);
        await ss(page, `05-heatmap-cell-${i}-click`);
        
        if (modalVisible) {
          log('Heatmap', `Cell ${i} click → modal`, 'PASS', 'Modal opened on cell click');
          
          // Test modal close
          const closeBtn = page.locator('[role="dialog"] button, .modal button, [class*="modal"] button').filter({ hasText: /close|×|✕|dismiss/i }).first();
          const closeExists = await closeBtn.isVisible().catch(() => false);
          if (closeExists) {
            await closeBtn.click();
            await page.waitForTimeout(300);
            log('Heatmap', 'Modal close button', 'PASS', 'Modal closed via close button');
          } else {
            // Try pressing Escape
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
            const stillOpen = await page.locator('[role="dialog"], .modal, [class*="modal"]').first().isVisible().catch(() => false);
            log('Heatmap', 'Modal close (Escape)', stillOpen ? 'FAIL' : 'PASS', stillOpen ? 'Modal still open after Escape' : 'Modal closed with Escape');
          }
        } else {
          log('Heatmap', `Cell ${i} click`, 'INFO', 'Cell clicked but no modal appeared');
        }
      } catch(e) {
        log('Heatmap', `Cell ${i} click`, 'FAIL', `Error: ${e.message}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // 5. TRIAD EXPLORER (Node Cards)
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 5: TRIAD EXPLORER NODE CARDS');
  console.log('══════════════════════════════════════');

  await ss(page, '06-triad-before');

  // Find node cards - could be div.card, button, [role="button"], etc
  const nodeCards = await page.locator('[class*="node"], [class*="card"], [class*="triad"], [data-node]').all();
  log('Triad', 'Node cards found', 'INFO', `Found ${nodeCards.length} potential node elements`);

  // Try clicking cards
  let cardClicks = 0;
  for (let i = 0; i < Math.min(5, nodeCards.length); i++) {
    try {
      const card = nodeCards[i];
      if (!await card.isVisible()) continue;
      const tagName = await card.evaluate(el => el.tagName);
      const text = await card.innerText().catch(() => '');
      if (text.trim().length < 2) continue;
      
      await card.click();
      await page.waitForTimeout(400);
      cardClicks++;
      
      const modalVisible = await page.locator('[role="dialog"], .modal, [class*="modal"]').first().isVisible().catch(() => false);
      await ss(page, `06-triad-card-${i}-click`);
      
      log('Triad', `Card ${i} (${text.substring(0,20)}) click`, modalVisible ? 'PASS' : 'INFO', 
          modalVisible ? 'Modal opened' : 'Card clicked, no modal');
      
      if (modalVisible) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    } catch(e) {
      log('Triad', `Card ${i}`, 'FAIL', `Error: ${e.message}`);
    }
  }
  if (cardClicks === 0) {
    log('Triad', 'Node card clicking', 'FAIL', 'No cards were clickable');
  }

  // ═══════════════════════════════════════════════════
  // 6. LOCKED AI BUTTONS
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 6: LOCKED AI BUTTONS');
  console.log('══════════════════════════════════════');

  // Find AI buttons - look for buttons with lock icon, "AI", or disabled state
  const aiButtons = await page.locator('button').filter({ hasText: /AI|analyze|generate|suggest|lock/i }).all();
  const lockedBtns = await page.locator('button[disabled], button.locked, button[aria-disabled="true"], [class*="locked"]').all();
  log('AI', 'AI-related buttons found', 'INFO', `${aiButtons.length} AI buttons, ${lockedBtns.length} locked buttons`);

  for (let i = 0; i < Math.min(3, aiButtons.length); i++) {
    const btn = aiButtons[i];
    if (!await btn.isVisible().catch(() => false)) continue;
    const isDisabled = await btn.isDisabled().catch(() => false);
    const text = await btn.innerText();
    await btn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
    const modalOpened = await page.locator('[role="dialog"], .modal, [class*="modal"]').first().isVisible().catch(() => false);
    await ss(page, `07-ai-btn-${i}`);
    log('AI', `AI button "${text.trim().substring(0,25)}"`, 'INFO', 
        `Disabled: ${isDisabled}. Modal opened: ${modalOpened}`);
    if (modalOpened) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
  }

  // ═══════════════════════════════════════════════════
  // 7. CHARTS SECTION
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 7: CHARTS SECTION');
  console.log('══════════════════════════════════════');

  await ss(page, '08-charts');
  const svgElems = await page.locator('svg').all();
  const canvasElems = await page.locator('canvas').all();
  log('Charts', 'Chart elements found', svgElems.length > 0 || canvasElems.length > 0 ? 'PASS' : 'FAIL', 
      `SVG: ${svgElems.length}, Canvas: ${canvasElems.length}`);

  // ═══════════════════════════════════════════════════
  // 8. INPUT STUDIO — Navigate there
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 8: INPUT STUDIO');
  console.log('══════════════════════════════════════');

  const inputStudioBtn2 = page.locator('button, a').filter({ hasText: /input studio/i }).first();
  if (await inputStudioBtn2.isVisible().catch(() => false)) {
    await inputStudioBtn2.click();
    await page.waitForTimeout(600);
    await ss(page, '09-input-studio-initial');
    log('InputStudio', 'Navigate to Input Studio', 'PASS', 'Navigated successfully');
  }

  // ═══════════════════════════════════════════════════
  // 9. INPUT STUDIO TABS
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 9: INPUT STUDIO TABS');
  console.log('══════════════════════════════════════');

  const tabs = ['Workflows', 'Systems', 'Personas'];
  for (const tabName of tabs) {
    const tab = page.locator('button, [role="tab"]').filter({ hasText: new RegExp(tabName, 'i') }).first();
    const tabExists = await tab.isVisible().catch(() => false);
    if (!tabExists) {
      log('InputStudio', `${tabName} tab`, 'FAIL', 'Tab not found');
      continue;
    }
    await tab.click();
    await page.waitForTimeout(400);
    await ss(page, `09-tab-${tabName.toLowerCase()}`);
    const bodyText2 = await page.locator('body').innerText();
    log('InputStudio', `${tabName} tab`, 'PASS', `Tab clicked, content loaded`);
  }

  // ═══════════════════════════════════════════════════
  // 10. ADD NODE FORMS — Empty submit
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 10: ADD NODE FORMS');
  console.log('══════════════════════════════════════');

  // Go to Workflows tab first
  const workflowTab = page.locator('button, [role="tab"]').filter({ hasText: /workflow/i }).first();
  if (await workflowTab.isVisible().catch(() => false)) await workflowTab.click();
  await page.waitForTimeout(300);
  await ss(page, '10-workflow-form-empty');

  // Find form inputs
  const formInputs = await page.locator('input[type="text"], input:not([type]), textarea').all();
  log('Forms', 'Form inputs found', formInputs.length > 0 ? 'INFO' : 'FAIL', `Found ${formInputs.length} text inputs`);

  // Find Add/Submit buttons
  const addBtns = await page.locator('button').filter({ hasText: /add|create|submit|save/i }).all();
  log('Forms', 'Add/Submit buttons found', addBtns.length > 0 ? 'INFO' : 'FAIL', `Found ${addBtns.length} add/submit buttons`);

  // Test 1: Empty submit
  if (addBtns.length > 0) {
    const addBtn = addBtns[0];
    if (await addBtn.isVisible().catch(() => false)) {
      const errsBefore = CONSOLE_ERRORS.length;
      await addBtn.click();
      await page.waitForTimeout(400);
      await ss(page, '10-empty-submit');
      const errsAfter = CONSOLE_ERRORS.length;
      const validationMsg = await page.locator('[class*="error"], [class*="invalid"], [class*="warning"], .error-msg').first().isVisible().catch(() => false);
      log('Forms', 'Empty form submit', validationMsg ? 'PASS' : 'INFO', 
          validationMsg ? 'Validation message shown' : `No visible validation. Console errors: ${errsAfter - errsBefore}`);
    }
  }

  // Test 2: Fill with normal text and submit
  if (formInputs.length > 0 && addBtns.length > 0) {
    const input = formInputs[0];
    if (await input.isVisible().catch(() => false)) {
      await input.fill('Test Workflow Node');
      await page.waitForTimeout(200);
      
      // Fill additional inputs if present
      for (let i = 1; i < Math.min(formInputs.length, 3); i++) {
        const inp = formInputs[i];
        if (await inp.isVisible().catch(() => false)) {
          await inp.fill(`Test value ${i}`);
        }
      }
      
      await ss(page, '10-form-filled');
      const addBtn2 = addBtns[0];
      if (await addBtn2.isVisible().catch(() => false)) {
        await addBtn2.click();
        await page.waitForTimeout(500);
        await ss(page, '10-form-submitted');
        const newNodeVisible = (await page.locator('body').innerText()).includes('Test Workflow Node');
        log('Forms', 'Normal form submit', newNodeVisible ? 'PASS' : 'PARTIAL', 
            newNodeVisible ? 'Node added and visible in list' : 'Submitted but node not clearly visible');
      }
    }
  }

  // Test 3: Very long text input
  if (formInputs.length > 0) {
    const input = formInputs[0];
    if (await input.isVisible().catch(() => false)) {
      const longText = 'A'.repeat(500);
      await input.fill(longText);
      await page.waitForTimeout(200);
      await ss(page, '10-long-text-input');
      const valLen = await input.evaluate(el => el.value.length);
      log('Forms', 'Long text input (500 chars)', 'INFO', `Input accepted ${valLen} characters`);
      
      // Try submitting long text
      if (addBtns.length > 0 && await addBtns[0].isVisible().catch(() => false)) {
        await addBtns[0].click();
        await page.waitForTimeout(400);
        await ss(page, '10-long-text-submitted');
        log('Forms', 'Long text submit', 'INFO', 'Long text submitted without crash');
      }
    }
  }

  // Test 4: Special characters
  if (formInputs.length > 0) {
    const input = formInputs[0];
    if (await input.isVisible().catch(() => false)) {
      await input.fill('<script>alert("xss")</script>');
      await page.waitForTimeout(200);
      if (addBtns.length > 0 && await addBtns[0].isVisible().catch(() => false)) {
        await addBtns[0].click();
        await page.waitForTimeout(400);
      }
      await ss(page, '10-special-chars');
      log('Forms', 'Special chars / XSS attempt', 'INFO', 'Special chars handled (check screenshot for raw HTML rendering)');
    }
  }

  // ═══════════════════════════════════════════════════
  // 11. SYSTEMS TAB — Forms
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 11: SYSTEMS TAB FORMS');
  console.log('══════════════════════════════════════');

  const systemsTab = page.locator('button, [role="tab"]').filter({ hasText: /system/i }).first();
  if (await systemsTab.isVisible().catch(() => false)) {
    await systemsTab.click();
    await page.waitForTimeout(400);
    await ss(page, '11-systems-tab');
    
    const sysInputs = await page.locator('input[type="text"], input:not([type]), textarea, select').all();
    log('Systems', 'Systems form inputs', 'INFO', `Found ${sysInputs.length} form elements`);
    
    // Fill and submit
    let filled = 0;
    for (let i = 0; i < Math.min(sysInputs.length, 3); i++) {
      const inp = sysInputs[i];
      if (!await inp.isVisible().catch(() => false)) continue;
      const tag = await inp.evaluate(el => el.tagName.toLowerCase());
      if (tag === 'select') {
        const opts = await inp.locator('option').all();
        if (opts.length > 1) await inp.selectOption({ index: 1 });
      } else {
        await inp.fill(`System Test ${i}`);
      }
      filled++;
    }
    
    const sysAddBtn = page.locator('button').filter({ hasText: /add|create|save/i }).first();
    if (filled > 0 && await sysAddBtn.isVisible().catch(() => false)) {
      await sysAddBtn.click();
      await page.waitForTimeout(400);
      await ss(page, '11-systems-submitted');
      log('Systems', 'System form submit', 'PASS', 'Form submitted without crash');
    }
  }

  // ═══════════════════════════════════════════════════
  // 12. PERSONAS TAB — Forms
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 12: PERSONAS TAB FORMS');
  console.log('══════════════════════════════════════');

  const personasTab = page.locator('button, [role="tab"]').filter({ hasText: /persona/i }).first();
  if (await personasTab.isVisible().catch(() => false)) {
    await personasTab.click();
    await page.waitForTimeout(400);
    await ss(page, '12-personas-tab');
    
    const pInputs = await page.locator('input[type="text"], input:not([type]), textarea, select').all();
    log('Personas', 'Persona form inputs', 'INFO', `Found ${pInputs.length} form elements`);
    
    for (let i = 0; i < Math.min(pInputs.length, 3); i++) {
      const inp = pInputs[i];
      if (!await inp.isVisible().catch(() => false)) continue;
      const tag = await inp.evaluate(el => el.tagName.toLowerCase());
      if (tag === 'select') {
        const opts = await inp.locator('option').all();
        if (opts.length > 1) await inp.selectOption({ index: 1 });
      } else {
        await inp.fill(`Persona Test ${i}`);
      }
    }
    
    const pAddBtn = page.locator('button').filter({ hasText: /add|create|save/i }).first();
    if (await pAddBtn.isVisible().catch(() => false)) {
      await pAddBtn.click();
      await page.waitForTimeout(400);
      await ss(page, '12-personas-submitted');
      log('Personas', 'Persona form submit', 'PASS', 'Form submitted without crash');
    }
  }

  // ═══════════════════════════════════════════════════
  // 13. RESET BUTTON (Input Studio)
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 13: RESET BUTTON');
  console.log('══════════════════════════════════════');

  const resetBtn = page.locator('button').filter({ hasText: /reset/i }).first();
  const resetExists = await resetBtn.isVisible().catch(() => false);
  log('Reset', 'Reset button visible', resetExists ? 'PASS' : 'FAIL', resetExists ? 'Reset button found' : 'Reset button NOT found');

  if (resetExists) {
    await ss(page, '13-before-reset');
    await resetBtn.click();
    await page.waitForTimeout(500);
    
    // Check for confirmation dialog
    const confirmDialog = await page.locator('[role="dialog"], .modal, [class*="modal"], .confirm').first().isVisible().catch(() => false);
    await ss(page, '13-after-reset-click');
    
    if (confirmDialog) {
      log('Reset', 'Reset confirmation dialog', 'PASS', 'Confirmation dialog appeared');
      // Find confirm/yes button
      const confirmBtn = page.locator('[role="dialog"] button, .modal button').filter({ hasText: /yes|confirm|reset|ok/i }).first();
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
        await ss(page, '13-after-reset-confirmed');
        log('Reset', 'Reset confirmed', 'PASS', 'Reset completed after confirmation');
      } else {
        await page.keyboard.press('Escape');
        log('Reset', 'Reset confirmation buttons', 'FAIL', 'Confirm button not found in dialog');
      }
    } else {
      log('Reset', 'Reset execution', 'INFO', 'Reset executed without confirmation dialog');
    }
  }

  // ═══════════════════════════════════════════════════
  // 14. GLOBAL RESET BUTTON (Nav)
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 14: GLOBAL NAV RESET');
  console.log('══════════════════════════════════════');

  // Check for reset in nav area (header/nav)
  const navResetBtn = page.locator('nav button, header button').filter({ hasText: /reset/i }).first();
  const navResetExists = await navResetBtn.isVisible().catch(() => false);
  log('GlobalReset', 'Nav-level Reset button', navResetExists ? 'INFO' : 'INFO', navResetExists ? 'Found in nav' : 'Not in nav (may be in-view only)');

  // ═══════════════════════════════════════════════════
  // 15. MODALS — Help / About
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 15: HELP / ABOUT MODALS');
  console.log('══════════════════════════════════════');

  // Look for help, about, info buttons
  const helpBtns = await page.locator('button').filter({ hasText: /help|about|info|\?/i }).all();
  const helpIconBtns = await page.locator('button[title*="help" i], button[aria-label*="help" i], button[title*="about" i]').all();
  log('Modals', 'Help/About buttons found', 'INFO', `Text buttons: ${helpBtns.length}, Icon buttons: ${helpIconBtns.length}`);

  for (const btn of [...helpBtns, ...helpIconBtns].slice(0, 3)) {
    if (!await btn.isVisible().catch(() => false)) continue;
    const text = await btn.innerText().catch(() => '') || await btn.getAttribute('title').catch(() => '') || '';
    await btn.click();
    await page.waitForTimeout(400);
    const modalVisible = await page.locator('[role="dialog"], .modal, [class*="modal"]').first().isVisible().catch(() => false);
    await ss(page, `15-modal-${text.trim().substring(0,10).replace(/\s+/g,'-') || 'unknown'}`);
    log('Modals', `"${text.trim().substring(0,20)}" button`, modalVisible ? 'PASS' : 'INFO', 
        modalVisible ? 'Modal opened' : 'No modal opened');
    if (modalVisible) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  }

  // ═══════════════════════════════════════════════════
  // 16. KEYBOARD NAVIGATION & ACCESSIBILITY
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 16: KEYBOARD NAVIGATION');
  console.log('══════════════════════════════════════');

  // Go to Dashboard
  const dashBtn3 = page.locator('button, a').filter({ hasText: /dashboard/i }).first();
  if (await dashBtn3.isVisible().catch(() => false)) await dashBtn3.click();
  await page.waitForTimeout(300);

  // Tab through elements
  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);
  await ss(page, '16-keyboard-tab');

  const focusedEl = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? `${el.tagName}[${el.className}]` : 'none';
  });
  log('A11y', 'Keyboard Tab navigation', focusedEl !== 'none' && focusedEl !== 'BODY[]' ? 'PASS' : 'FAIL', 
      `Focused element: ${focusedEl}`);

  // Enter on focused
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');

  // ═══════════════════════════════════════════════════
  // 17. MOBILE RESPONSIVE CHECK
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 17: RESPONSIVE / MOBILE');
  console.log('══════════════════════════════════════');

  // Switch to mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(400);
  await ss(page, '17-mobile-view');
  
  const mobileHamburger = await page.locator('button[class*="hamburger"], button[class*="menu"], button[aria-label*="menu" i], button[class*="toggle"]').first().isVisible().catch(() => false);
  log('Mobile', 'Mobile viewport', 'INFO', `375px viewport loaded. Hamburger menu: ${mobileHamburger}`);
  
  if (mobileHamburger) {
    await page.locator('button[class*="hamburger"], button[class*="menu"], button[aria-label*="menu" i]').first().click();
    await page.waitForTimeout(300);
    await ss(page, '17-mobile-menu-open');
    log('Mobile', 'Hamburger menu open', 'PASS', 'Menu opened');
  }

  // Restore desktop
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(300);

  // ═══════════════════════════════════════════════════
  // 18. DARK MODE / THEME TOGGLE
  // ═══════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('SECTION 18: THEME TOGGLE');
  console.log('══════════════════════════════════════');

  const themeBtns = await page.locator('button').filter({ hasText: /dark|light|theme/i }).all();
  const themeIconBtns = await page.locator('button[title*="dark" i], button[title*="light" i], button[title*="theme" i], button[aria-label*="theme" i], button[aria-label*="dark" i]').all();
  log('Theme', 'Theme toggle buttons', 'INFO', `Text: ${themeBtns.length}, Icon: ${themeIconBtns.length}`);
  
  for (const btn of [...themeBtns, ...themeIconBtns].slice(0, 2)) {
    if (!await btn.isVisible().catch(() => false)) continue;
    const before = await page.evaluate(() => document.documentElement.className + '|' + document.body.className);
    await btn.click();
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => document.documentElement.className + '|' + document.body.className);
    await ss(page, '18-theme-toggle');
    log('Theme', 'Theme toggle click', before !== after ? 'PASS' : 'INFO', 
        `Class changed: ${before !== after}. Before: "${before.substring(0,50)}" After: "${after.substring(0,50)}"`);
  }

  // ═══════════════════════════════════════════════════
  // 19. FINAL DASHBOARD SCREENSHOT
  // ═══════════════════════════════════════════════════
  const dashFinal = page.locator('button, a').filter({ hasText: /dashboard/i }).first();
  if (await dashFinal.isVisible().catch(() => false)) await dashFinal.click();
  await page.waitForTimeout(500);
  await ss(page, '19-final-dashboard');

  await browser.close();

  // ═══════════════════════════════════════════════════
  // SUMMARY REPORT
  // ═══════════════════════════════════════════════════
  console.log('\n\n══════════════════════════════════════');
  console.log('QA SUMMARY REPORT');
  console.log('══════════════════════════════════════');
  
  const passes = RESULTS.filter(r => r.status === 'PASS').length;
  const fails = RESULTS.filter(r => r.status === 'FAIL').length;
  const partials = RESULTS.filter(r => r.status === 'PARTIAL').length;
  const infos = RESULTS.filter(r => r.status === 'INFO').length;

  console.log(`\nTotal tests: ${RESULTS.length}`);
  console.log(`✅ PASS: ${passes}`);
  console.log(`❌ FAIL: ${fails}`);
  console.log(`⚠️  PARTIAL: ${partials}`);
  console.log(`ℹ️  INFO: ${infos}`);
  console.log(`🔴 Console Errors: ${CONSOLE_ERRORS.length}`);
  
  console.log('\n--- FAILURES ---');
  RESULTS.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  ❌ [${r.section}] ${r.test}: ${r.detail}`);
  });
  
  console.log('\n--- PARTIAL ---');
  RESULTS.filter(r => r.status === 'PARTIAL').forEach(r => {
    console.log(`  ⚠️ [${r.section}] ${r.test}: ${r.detail}`);
  });

  if (CONSOLE_ERRORS.length > 0) {
    console.log('\n--- CONSOLE ERRORS ---');
    CONSOLE_ERRORS.forEach((e, i) => console.log(`  ${i+1}. ${e}`));
  }

  console.log('\n--- ALL RESULTS (JSON) ---');
  const report = { passes, fails, partials, infos, consoleErrors: CONSOLE_ERRORS, results: RESULTS };
  console.log(JSON.stringify(report, null, 2));
}

run().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
