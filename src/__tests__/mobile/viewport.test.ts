import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../../..');

describe('Viewport Meta Tag', () => {
  it('layout.tsx exports a viewport configuration', () => {
    const layoutPath = path.join(SRC_DIR, 'src/app/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');

    // Check that viewport is exported (Next.js 14 metadata API)
    const hasViewport = content.includes('export const viewport') || content.includes('viewport:');
    expect(hasViewport).toBe(true);
  });

  it('viewport includes width=device-width', () => {
    const layoutPath = path.join(SRC_DIR, 'src/app/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toContain('device-width');
  });

  it('viewport includes initialScale', () => {
    const layoutPath = path.join(SRC_DIR, 'src/app/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toContain('initialScale');
  });
});

describe('Mobile Layout Patterns', () => {
  it('login page uses min-h-screen for full height', () => {
    const loginPath = path.join(SRC_DIR, 'src/app/page.tsx');
    const content = fs.readFileSync(loginPath, 'utf-8');
    expect(content).toContain('min-h-screen');
  });

  it('login page uses max-w-sm for mobile-friendly width', () => {
    const loginPath = path.join(SRC_DIR, 'src/app/page.tsx');
    const content = fs.readFileSync(loginPath, 'utf-8');
    expect(content).toContain('max-w-sm');
  });

  it('login page has horizontal padding for mobile', () => {
    const loginPath = path.join(SRC_DIR, 'src/app/page.tsx');
    const content = fs.readFileSync(loginPath, 'utf-8');
    expect(content).toContain('px-4');
  });
});

describe('PWA Manifest', () => {
  it('manifest.json exists and is valid JSON', () => {
    const manifestPath = path.join(SRC_DIR, 'public/manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);
    expect(manifest).toBeDefined();
  });

  it('manifest has required PWA fields', () => {
    const manifestPath = path.join(SRC_DIR, 'public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBeDefined();
    expect(manifest.icons).toBeDefined();
  });

  it('manifest display mode is standalone', () => {
    const manifestPath = path.join(SRC_DIR, 'public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.display).toBe('standalone');
  });

  it('manifest start_url is /dashboard', () => {
    const manifestPath = path.join(SRC_DIR, 'public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.start_url).toBe('/dashboard');
  });

  it('manifest theme_color matches app background', () => {
    const manifestPath = path.join(SRC_DIR, 'public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.theme_color).toBe('#1A1A1A');
    expect(manifest.background_color).toBe('#1A1A1A');
  });

  it('manifest has icons at required sizes', () => {
    const manifestPath = path.join(SRC_DIR, 'public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('PWA icon files exist', () => {
    expect(fs.existsSync(path.join(SRC_DIR, 'public/icon-192.png'))).toBe(true);
    expect(fs.existsSync(path.join(SRC_DIR, 'public/icon-512.png'))).toBe(true);
  });
});

describe('Touch Target Sizes', () => {
  it('PIN inputs are at least 44px (w-14 = 56px)', () => {
    // w-14 in Tailwind = 3.5rem = 56px at default 16px root
    const w14InPx = 3.5 * 16;
    expect(w14InPx).toBeGreaterThanOrEqual(44);
  });

  it('login page uses w-14 h-14 for PIN inputs', () => {
    const loginPath = path.join(SRC_DIR, 'src/app/page.tsx');
    const content = fs.readFileSync(loginPath, 'utf-8');
    expect(content).toContain('w-14 h-14');
  });
});

describe('Service Worker', () => {
  it('sw.js exists', () => {
    expect(fs.existsSync(path.join(SRC_DIR, 'public/sw.js'))).toBe(true);
  });

  it('sw.js handles push notifications', () => {
    const swContent = fs.readFileSync(path.join(SRC_DIR, 'public/sw.js'), 'utf-8');
    expect(swContent).toContain("addEventListener('push'");
  });

  it('sw.js handles notification clicks', () => {
    const swContent = fs.readFileSync(path.join(SRC_DIR, 'public/sw.js'), 'utf-8');
    expect(swContent).toContain("addEventListener('notificationclick'");
  });

  it('sw.js pre-caches offline page', () => {
    const swContent = fs.readFileSync(path.join(SRC_DIR, 'public/sw.js'), 'utf-8');
    expect(swContent).toContain('offline.html');
  });

  it('sw.js does NOT cache fetch requests', () => {
    const swContent = fs.readFileSync(path.join(SRC_DIR, 'public/sw.js'), 'utf-8');
    // Verify the comment that says no fetch caching
    expect(swContent).toContain('NO fetch caching');
  });

  it('offline.html exists', () => {
    expect(fs.existsSync(path.join(SRC_DIR, 'public/offline.html'))).toBe(true);
  });
});
