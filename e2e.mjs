import { chromium } from 'playwright';

const APP = 'http://127.0.0.1:4174';

async function run() {
  const browser = await chromium.launch({ headless: true });
  let pass = 0, fail = 0;

  async function test(label, fn) {
    const page = await browser.newPage();
    try {
      await page.goto(APP, { waitUntil: 'networkidle', timeout: 10000 });
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

  console.log('\n=== MUN Prep E2E ===\n');

  await test('Login page renders', async (p) => {
    const title = await p.textContent('h1');
    if (!title?.includes('MUN Prep')) throw new Error('title missing');
    const signIn = await p.textContent('h2');
    if (!signIn?.includes('Sign in')) throw new Error('sign in heading missing');
    const emailInput = p.locator('input[type="email"]');
    if (!(await emailInput.isVisible())) throw new Error('email input missing');
  });

  await test('Signup page renders', async (p) => {
    await p.locator('a:has-text("Sign up")').click();
    await p.waitForTimeout(500);
    const heading = await p.textContent('h2');
    if (!heading?.includes('Create account')) throw new Error('signup heading missing');
    const pwInput = p.locator('input[type="password"]');
    if (!(await pwInput.isVisible())) throw new Error('password input missing');
  });

  await test('Login link on signup page', async (p) => {
    const link = p.locator('a:has-text("Sign in")');
    if (!(await link.isVisible())) throw new Error('sign in link missing');
  });

  await test('Unauthenticated redirect to /login', async (p) => {
    await p.goto(`${APP}/settings`, { waitUntil: 'networkidle' });
    await p.waitForURL('**/login', { timeout: 5000 });
    const url = p.url();
    if (!url.includes('/login')) throw new Error('not redirected: ' + url);
  });

  await test('Design system — cream canvas', async (p) => {
    const bg = await p.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
    if (bg !== 'rgb(250, 249, 245)') throw new Error(`expected cream, got ${bg}`);
  });

  await test('Design system — coral button', async (p) => {
    const btn = p.locator('button[type="submit"]').first();
    const bg = await btn.evaluate(el => getComputedStyle(el).backgroundColor);
    if (bg !== 'rgb(204, 120, 92)') throw new Error(`expected coral, got ${bg}`);
  });

  await test('Signup form validates email', async (p) => {
    await p.locator('a:has-text("Sign up")').click();
    await p.waitForTimeout(400);
    const emailInput = p.locator('input[type="email"]');
    await emailInput.fill('not-an-email');
    const validity = await emailInput.evaluate(el => (el as HTMLInputElement).validity.valid);
    if (validity) throw new Error('email should be invalid');
  });

  await test('Signup form requires 6 char password', async (p) => {
    await p.locator('a:has-text("Sign up")').click();
    await p.waitForTimeout(400);
    const pwInput = p.locator('input[type="password"]');
    const minLen = await pwInput.evaluate(el => (el as HTMLInputElement).minLength);
    if (minLen < 6) throw new Error(`expected minlength >= 6, got ${minLen}`);
  });

  await test('Terms / links between pages', async (p) => {
    // Login → Signup → Login — can navigate back and forth
    const loginLink = p.locator('a:has-text("Sign up")');
    if (!(await loginLink.isVisible())) throw new Error('sign up link on login');
    await loginLink.click();
    await p.waitForURL('**/signup', { timeout: 3000 });
    const signupLink = p.locator('a:has-text("Sign in")');
    if (!(await signupLink.isVisible())) throw new Error('sign in link on signup');
    await signupLink.click();
    await p.waitForURL('**/login', { timeout: 3000 });
    const h1 = await p.textContent('h1');
    if (!h1?.includes('MUN Prep')) throw new Error('back on login');
  });

  console.log(`\n=== ${pass}/${pass + fail} passed ===\n`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

run();
