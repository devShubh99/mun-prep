import { chromium } from 'playwright';

const APP = 'http://127.0.0.1:4174';

async function run() {
  const browser = await chromium.launch({ headless: true });
  let pass = 0, fail = 0;

  async function test(label, fn) {
    const page = await browser.newPage();
    try {
      await page.goto(APP, { waitUntil: 'load' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'load' });
      await page.waitForLoadState('networkidle');
      await fn(page);
      pass++;
      console.log(`  ✅ ${label}`);
    } catch (e) {
      fail++;
      console.log(`  ❌ ${label}`);
      console.log(`     ${e.message.split('\n')[0].slice(0, 160)}`);
    } finally {
      await page.close();
    }
  }

  async function create(page, name) {
    const btn = page.locator('button').filter({ hasText: /Create Your First|New Conference/ }).first();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    await btn.click();
    await page.waitForTimeout(500);
    // Use the modal's required name input (not the search input)
    await page.locator('input[required]').first().fill(name);
    await page.locator('button:has-text("Save")').click();
    await page.waitForTimeout(600);
  }

  console.log('\n=== MUN Prep Companion E2E ===\n');

  await test('Empty state', async (p) => {
    const t = await p.textContent('body');
    if (!t.includes('No conferences yet')) throw new Error('missing empty state');
  });

  await test('Create modal opens', async (p) => {
    const btn = p.locator('button').filter({ hasText: /Create Your First/ }).first();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    await btn.click();
    await p.waitForTimeout(500);
    const modalVisible = await p.locator('h2:has-text("New Conference")').isVisible();
    if (!modalVisible) throw new Error('modal not visible');
  });

  await test('Cancel keeps empty', async (p) => {
    const btn = p.locator('button').filter({ hasText: /Create Your First/ }).first();
    await btn.waitFor({ state: 'visible' });
    await btn.click();
    await p.waitForTimeout(300);
    await p.locator('button:has-text("Cancel")').click();
    await p.waitForTimeout(500);
    const t = await p.textContent('body');
    if (!t.includes('No conferences yet')) throw new Error('not empty');
  });

  await test('Create one conference', async (p) => {
    await create(p, 'First Conf');
    const t = await p.textContent('body');
    if (!t.includes('First Conf')) throw new Error('name missing');
  });

  await test('Create two conferences', async (p) => {
    await create(p, 'Conf A');
    await create(p, 'Conf B');
    const t = await p.textContent('body');
    const n = (t.match(/Conf A|Conf B/g) || []).length;
    if (n < 2) throw new Error(`expected 2, got ${n}`);
  });

  await test('Edit conference', async (p) => {
    await create(p, 'Old Name');
    await p.locator('button[aria-label="Edit"]').waitFor({ state: 'visible' });
    await p.locator('button[aria-label="Edit"]').click();
    await p.waitForTimeout(400);
    const editVisible = await p.locator('h2:has-text("Edit Conference")').isVisible();
    if (!editVisible) throw new Error('edit modal not visible');
    await p.locator('input[required]').first().fill('New Name');
    await p.locator('button:has-text("Save")').click();
    await p.waitForTimeout(500);
    const t = await p.textContent('body');
    if (!t.includes('New Name')) throw new Error('name not updated');
  });

  await test('Navigate to workspace', async (p) => {
    await create(p, 'Workspace');
    await p.locator('.card').first().waitFor({ state: 'visible' });
    await p.locator('.card').first().click();
    await p.waitForTimeout(700);
    const url = p.url();
    if (!url.includes('/conference/')) throw new Error('not in workspace: ' + url);
    const tabs = await p.locator('nav a').count();
    if (tabs !== 3) throw new Error(`expected 3 tabs, got ${tabs}`);
  });

  await test('Cheat Sheet fields', async (p) => {
    await create(p, 'CS');
    await p.locator('.card').first().click();
    await p.waitForTimeout(500);
    const ok = await p.locator('text="Flag Colors"').isVisible();
    if (!ok) throw new Error('Flag Colors missing');
  });

  await test('Document editor typing works', async (p) => {
    await create(p, 'Editor');
    await p.locator('.card').first().click();
    await p.waitForTimeout(400);
    await p.locator('a:has-text("Document Workshop")').click();
    await p.waitForTimeout(600);

    // Check editor is rendered
    const proseMirror = p.locator('.ProseMirror');
    const pmCount = await proseMirror.count();
    if (pmCount === 0) throw new Error('ProseMirror not found');

    // Focus editor and type
    await proseMirror.click();
    await p.waitForTimeout(200);
    await proseMirror.pressSequentially('Hello MUN world', { delay: 10 });
    await p.waitForTimeout(800);

    // Word count should update
    const t = await p.textContent('body');
    if (!t.includes('words')) throw new Error('word count missing');
    if (!t.includes('Hello')) throw new Error('typed text not in body');

    // Bold button clickable
    const boldBtn = p.locator('button[aria-label="Bold"]');
    if (!(await boldBtn.isVisible())) throw new Error('Bold button not visible');

    // Tab switch preserves content
    await p.locator('button:has-text("Position Paper")').click();
    await p.waitForTimeout(300);
    const ppText = await p.textContent('body');
    if (!ppText.includes('words')) throw new Error('Position Paper word count');
  });

  await test('Debate role selector', async (p) => {
    await create(p, 'Debate');
    await p.locator('.card').first().click();
    await p.waitForTimeout(400);
    await p.locator('a:has-text("Debate Simulator")').click();
    await p.waitForTimeout(500);
    const ok = await p.locator('text="Role:"').isVisible();
    if (!ok) throw new Error('role missing');
  });

  await test('Delete conference', async (p) => {
    await create(p, 'Delete Me');
    p.once('dialog', (d) => d.accept());
    await p.locator('button[aria-label="Delete"]').click();
    await p.waitForTimeout(500);
    const t = await p.textContent('body');
    if (!t.includes('No conferences yet')) throw new Error('not empty after delete');
  });

  await test('Settings buttons', async (p) => {
    await p.locator('a[aria-label="Settings"]').click();
    await p.waitForTimeout(400);
    const btns = await p.locator('button').allTextContents();
    const all = btns.join(' ');
    ['Export', 'Import', 'Load Demo', 'Clear All'].forEach(s => {
      if (!all.includes(s)) throw new Error('missing: ' + s);
    });
  });

  await test('Load demo data', async (p) => {
    await p.locator('a[aria-label="Settings"]').click();
    await p.waitForTimeout(400);
    const loadBtn = p.locator('button:has-text("Load Demo")');
    if (!(await loadBtn.isVisible())) throw new Error('Load Demo button not visible');
    p.once('dialog', (d) => d.accept());
    await loadBtn.click();
    await p.waitForTimeout(1000);
    const data = await p.evaluate(() => localStorage.getItem('mun_prep_app_data'));
    const confs = JSON.parse(data || '{}').conferences || [];
    if (confs.length === 0) throw new Error('no conferences after demo load');
    // Navigate to dashboard
    await p.goto('http://127.0.0.1:4174/', { waitUntil: 'load' });
    await p.waitForTimeout(300);
    const t = await p.textContent('body');
    if (!t.includes('UNHRC')) throw new Error('UNHRC not on dashboard: ' + t.slice(0, 100));
  });

  await test('Search conferences', async (p) => {
    await create(p, 'DISEC AI');
    await create(p, 'UNHRC Refugees');
    const search = p.locator('input[placeholder="Search conferences..."]');
    await search.fill('Refugees');
    await p.waitForTimeout(400);
    let cards = await p.locator('.card').count();
    if (cards !== 1) throw new Error(`expected 1, got ${cards} for "Refugees"`);
    await search.fill('');
    await p.waitForTimeout(400);
    cards = await p.locator('.card').count();
    if (cards !== 2) throw new Error(`expected 2, got ${cards} after clear`);
  });

  console.log(`\n=== ${pass}/${pass + fail} passed ===\n`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

run();
