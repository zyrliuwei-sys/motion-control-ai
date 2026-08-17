import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = {};

try {
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await desktop.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
  await desktop.getByRole('switch').click();
  results.yearlyPricing = await desktop
    .locator('main')
    .innerText()
    .then((text) => text.includes('$100'));

  const firstFaq = desktop.getByRole('button', { name: /What is Proactic/ });
  await firstFaq.click();
  results.faqOpens = await desktop
    .getByText(
      'Proactic is a social media marketing automation tool designed to help businesses streamline their social media efforts.'
    )
    .isVisible();

  await desktop.getByRole('button', { name: 'Tyler Durden' }).click();
  results.testimonialSwitches = await desktop
    .getByText('I made a soap with the help of AI, it was so easy to use.', {
      exact: false,
    })
    .isVisible();

  await desktop
    .getByRole('button', { name: /Play Proactiv product overview/ })
    .click();
  results.videoDialogOpens = await desktop
    .locator('iframe[src*="youtube.com/embed"]')
    .isVisible();

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await mobile.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
  await mobile.getByRole('button', { name: /Open menu/ }).click();
  results.mobileNavOpens = await mobile
    .getByText('Features', { exact: true })
    .last()
    .isVisible();

  await writeFile(
    'docs/research/interaction-check.json',
    `${JSON.stringify(results, null, 2)}\n`
  );
  if (Object.values(results).some((result) => !result)) process.exitCode = 1;
} finally {
  await browser.close();
}
