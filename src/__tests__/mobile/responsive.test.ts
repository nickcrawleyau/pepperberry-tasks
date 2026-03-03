import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../../..');

describe('Responsive Design Patterns', () => {
  describe('mobile-first approach', () => {
    it('TaskCard uses min-w-0 to prevent overflow', () => {
      const content = fs.readFileSync(path.join(SRC_DIR, 'src/components/tasks/TaskCard.tsx'), 'utf-8');
      expect(content).toContain('min-w-0');
    });

    it('TaskCard uses flex-wrap for metadata', () => {
      const content = fs.readFileSync(path.join(SRC_DIR, 'src/components/tasks/TaskCard.tsx'), 'utf-8');
      expect(content).toContain('flex-wrap');
    });

    it('TaskCard uses flex layout', () => {
      const content = fs.readFileSync(path.join(SRC_DIR, 'src/components/tasks/TaskCard.tsx'), 'utf-8');
      expect(content).toContain('flex');
    });
  });

  describe('ChatView uses dynamic viewport height', () => {
    it('uses dvh for chat container height', () => {
      const content = fs.readFileSync(path.join(SRC_DIR, 'src/components/chat/ChatView.tsx'), 'utf-8');
      // ChatView should use dvh (dynamic viewport height) for mobile browser compatibility
      expect(content).toContain('dvh');
    });

    it('chat input has enterKeyHint for mobile keyboards', () => {
      const content = fs.readFileSync(path.join(SRC_DIR, 'src/components/chat/ChatView.tsx'), 'utf-8');
      expect(content).toContain('enterKeyHint');
    });

    it('chat messages use break-words to prevent overflow', () => {
      const content = fs.readFileSync(path.join(SRC_DIR, 'src/components/chat/ChatView.tsx'), 'utf-8');
      expect(content).toContain('break-words');
    });
  });

  describe('ShoppingList responsive layout', () => {
    it('uses responsive grid for form', () => {
      const content = fs.readFileSync(path.join(SRC_DIR, 'src/components/shopping/ShoppingList.tsx'), 'utf-8');
      // Should have responsive grid or flex layout
      const hasResponsive = content.includes('sm:') || content.includes('md:');
      expect(hasResponsive).toBe(true);
    });

    it('filter tabs have horizontal scroll', () => {
      const content = fs.readFileSync(path.join(SRC_DIR, 'src/components/shopping/ShoppingList.tsx'), 'utf-8');
      expect(content).toContain('overflow-x-auto');
    });
  });

  describe('WeatherDisplay responsive patterns', () => {
    it('rainfall chart is horizontally scrollable', () => {
      const content = fs.readFileSync(path.join(SRC_DIR, 'src/components/weather/WeatherDisplay.tsx'), 'utf-8');
      expect(content).toContain('overflow-x-auto');
    });

    it('handles overflow for chart containers', () => {
      const content = fs.readFileSync(path.join(SRC_DIR, 'src/components/weather/WeatherDisplay.tsx'), 'utf-8');
      expect(content).toContain('overflow');
    });
  });

  describe('PhotoSection mobile optimizations', () => {
    it('delete button is always visible on mobile', () => {
      const content = fs.readFileSync(path.join(SRC_DIR, 'src/components/tasks/PhotoSection.tsx'), 'utf-8');
      // Desktop: hidden until hover; Mobile: always visible
      expect(content).toContain('sm:opacity-0');
    });

    it('uses file input for mobile photo upload', () => {
      const content = fs.readFileSync(path.join(SRC_DIR, 'src/components/tasks/PhotoSection.tsx'), 'utf-8');
      expect(content).toContain('type="file"');
    });

    it('uses grid layout for photo thumbnails', () => {
      const content = fs.readFileSync(path.join(SRC_DIR, 'src/components/tasks/PhotoSection.tsx'), 'utf-8');
      expect(content).toContain('grid');
    });
  });
});

describe('Dark Theme Consistency', () => {
  it('root layout uses antialiased font rendering', () => {
    const content = fs.readFileSync(path.join(SRC_DIR, 'src/app/layout.tsx'), 'utf-8');
    expect(content).toContain('antialiased');
  });

  it('login page uses fw-bg background', () => {
    const content = fs.readFileSync(path.join(SRC_DIR, 'src/app/page.tsx'), 'utf-8');
    expect(content).toContain('bg-fw-bg');
  });

  it('tailwind config defines all theme colors', () => {
    const content = fs.readFileSync(path.join(SRC_DIR, 'tailwind.config.ts'), 'utf-8');
    expect(content).toContain('fw-bg');
    expect(content).toContain('fw-surface');
    expect(content).toContain('fw-text');
    expect(content).toContain('fw-accent');
    expect(content).toContain('fw-hover');
  });
});

describe('Loading States', () => {
  const loadingPages = [
    'src/app/dashboard/loading.tsx',
    'src/app/tasks/loading.tsx',
    'src/app/chat/loading.tsx',
    'src/app/shopping/loading.tsx',
    'src/app/weather/loading.tsx',
    'src/app/report/loading.tsx',
    'src/app/admin/loading.tsx',
  ];

  loadingPages.forEach((loadingPage) => {
    it(`${loadingPage} exists`, () => {
      expect(fs.existsSync(path.join(SRC_DIR, loadingPage))).toBe(true);
    });
  });

  it('all loading pages use LoadingScreen component', () => {
    loadingPages.forEach((loadingPage) => {
      const content = fs.readFileSync(path.join(SRC_DIR, loadingPage), 'utf-8');
      expect(content).toContain('LoadingScreen');
    });
  });
});
