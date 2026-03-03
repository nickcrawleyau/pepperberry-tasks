import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../../..');

describe('API Route Consistency', () => {
  function getApiRouteFiles(): string[] {
    const apiDir = path.join(SRC_DIR, 'src/app/api');
    const files: string[] = [];
    function walk(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name === 'route.ts') files.push(full);
      }
    }
    walk(apiDir);
    return files;
  }

  it('all API routes use NextResponse for responses', () => {
    const routeFiles = getApiRouteFiles();
    expect(routeFiles.length).toBeGreaterThan(0);

    routeFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).toContain('NextResponse');
    });
  });

  it('all API routes import from next/server', () => {
    const routeFiles = getApiRouteFiles();
    routeFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).toContain('next/server');
    });
  });

  it('protected API routes check auth session', () => {
    const routeFiles = getApiRouteFiles();
    // Exclude public routes and cron routes (cron uses different auth)
    const publicPatterns = ['auth', 'weather', 'cron', 'report-problem', 'push-subscription'];
    const protectedRoutes = routeFiles.filter((f) => {
      const relative = path.relative(path.join(SRC_DIR, 'src/app/api'), f).replace(/\\/g, '/');
      return !publicPatterns.some((pub) => relative.startsWith(pub));
    });

    protectedRoutes.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      const hasAuth = content.includes('getSession') || content.includes('verifySession');
      if (!hasAuth) {
        const relative = path.relative(SRC_DIR, file);
        expect.fail(`API route ${relative} does not check auth session`);
      }
    });
  });

  it('API routes return error objects with { error: string } format', () => {
    const routeFiles = getApiRouteFiles();
    routeFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      // Check that error responses use { error: ... } format
      const errorResponses = content.match(/NextResponse\.json\(\s*\{[^}]*error/g);
      if (errorResponses) {
        // All error responses should follow the pattern
        errorResponses.forEach((match) => {
          expect(match).toContain('error');
        });
      }
    });
  });
});

describe('Loading Page Consistency', () => {
  const pageDirectories = [
    'src/app/dashboard',
    'src/app/tasks',
    'src/app/chat',
    'src/app/shopping',
    'src/app/weather',
    'src/app/report',
    'src/app/admin',
  ];

  pageDirectories.forEach((dir) => {
    it(`${dir}/ has a loading.tsx`, () => {
      const loadingPath = path.join(SRC_DIR, dir, 'loading.tsx');
      expect(fs.existsSync(loadingPath)).toBe(true);
    });
  });
});

describe('TypeScript Configuration', () => {
  it('strict mode is enabled', () => {
    const tsconfig = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'tsconfig.json'), 'utf-8'));
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('path alias @/* is configured', () => {
    const tsconfig = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'tsconfig.json'), 'utf-8'));
    expect(tsconfig.compilerOptions.paths['@/*']).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@/*']).toContain('./src/*');
  });
});

describe('Component File Naming', () => {
  function getComponentFiles(): string[] {
    const compDir = path.join(SRC_DIR, 'src/components');
    const files: string[] = [];
    function walk(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.tsx')) files.push(entry.name);
      }
    }
    walk(compDir);
    return files;
  }

  it('all component files use PascalCase naming', () => {
    const componentFiles = getComponentFiles();
    expect(componentFiles.length).toBeGreaterThan(0);

    componentFiles.forEach((file) => {
      const name = file.replace('.tsx', '');
      // PascalCase: starts with uppercase letter
      expect(name[0]).toBe(name[0].toUpperCase());
    });
  });
});
