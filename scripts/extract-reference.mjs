import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const sourceUrl = process.argv[2] ?? 'http://127.0.0.1:3001/';
const outputDir = new URL('../docs/research/', import.meta.url);

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });

try {
  const report = {};
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 1100 },
    tablet: { width: 768, height: 1000 },
    mobile: { width: 390, height: 844 },
  })) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(sourceUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const initial = await page.evaluate(() => {
      const props = [
        'display',
        'position',
        'width',
        'height',
        'maxWidth',
        'minHeight',
        'padding',
        'margin',
        'gap',
        'fontFamily',
        'fontSize',
        'fontWeight',
        'lineHeight',
        'letterSpacing',
        'color',
        'background',
        'backgroundColor',
        'border',
        'borderRadius',
        'boxShadow',
        'opacity',
        'transform',
        'transition',
        'overflow',
        'zIndex',
        'gridTemplateColumns',
      ];
      const styles = (element) => {
        const computed = getComputedStyle(element);
        return Object.fromEntries(props.map((prop) => [prop, computed[prop]]));
      };
      const describe = (element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          tag: element.tagName.toLowerCase(),
          id: element.id || undefined,
          classes:
            typeof element.className === 'string'
              ? element.className
              : undefined,
          text: (element.innerText || '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 420),
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
          styles: styles(element),
        };
      };
      const interest = [
        ...document.querySelectorAll(
          'header, main > *, main section, main > div > *, footer'
        ),
      ];
      const unique = [...new Set(interest)];
      return {
        document: {
          title: document.title,
          height: document.documentElement.scrollHeight,
          body: styles(document.body),
          html: styles(document.documentElement),
          fontLinks: [
            ...document.querySelectorAll('link[rel="stylesheet"]'),
          ].map((item) => item.href),
        },
        sections: unique.map(describe),
        headings: [...document.querySelectorAll('h1, h2, h3')].map(describe),
        buttons: [...document.querySelectorAll('button, a')].map(
          (item, index) => ({
            ...describe(item, index),
            href: item instanceof HTMLAnchorElement ? item.href : undefined,
            ariaLabel: item.getAttribute('aria-label') || undefined,
          })
        ),
        images: [...document.querySelectorAll('img')].map((image) => ({
          src: image.currentSrc || image.src,
          alt: image.alt,
          width: image.naturalWidth,
          height: image.naturalHeight,
          classes: image.className,
          position: getComputedStyle(image).position,
        })),
        svgs: document.querySelectorAll('svg').length,
      };
    });
    await page.evaluate(() =>
      window.scrollTo(0, Math.min(160, document.documentElement.scrollHeight))
    );
    await page.waitForTimeout(250);
    const scrolledHeader = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return null;
      const style = getComputedStyle(header);
      return {
        scrollY: window.scrollY,
        className: header.className,
        background: style.background,
        backgroundColor: style.backgroundColor,
        border: style.border,
        boxShadow: style.boxShadow,
        height: style.height,
        position: style.position,
        transform: style.transform,
      };
    });
    report[name] = { initial, scrolledHeader };
    await context.close();
  }
  await writeFile(
    new URL('reference-dom.json', outputDir),
    `${JSON.stringify(report, null, 2)}\n`
  );
} finally {
  await browser.close();
}
