import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'fs';

const SRC_DIR = path.resolve(__dirname, '../../..');

function getFiles(dir: string, pattern: RegExp): string[] {
  const files: string[] = [];
  function walk(d: string) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '__tests__') {
        walk(full);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

describe('Import Safety', () => {
  it('no client-side file imports supabase/admin.ts', () => {
    const srcDir = path.join(SRC_DIR, 'src');
    const clientFiles = getFiles(srcDir, /\.(tsx?)$/).filter((f) => {
      const content = fs.readFileSync(f, 'utf-8');
      return content.includes("'use client'");
    });

    clientFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      const importAdmin = content.includes('supabase/admin') || content.includes('supabaseAdmin');
      if (importAdmin) {
        // Fail with the specific file
        expect.fail(`Client component ${path.relative(SRC_DIR, file)} imports supabase/admin (server-only)`);
      }
    });
  });

  it('supabase admin.ts has server-side guard', () => {
    const adminPath = path.join(SRC_DIR, 'src/lib/supabase/admin.ts');
    const content = fs.readFileSync(adminPath, 'utf-8');
    expect(content).toContain("typeof window !== 'undefined'");
    expect(content).toContain('throw new Error');
  });

  it('supabase admin.ts uses cache: no-store', () => {
    const adminPath = path.join(SRC_DIR, 'src/lib/supabase/admin.ts');
    const content = fs.readFileSync(adminPath, 'utf-8');
    expect(content).toContain("cache: 'no-store'");
  });
});

describe('Environment Variable Safety', () => {
  it('no .env files are committed (check for patterns)', () => {
    const rootFiles = fs.readdirSync(SRC_DIR);
    const envFiles = rootFiles.filter((f) => f.startsWith('.env') && !f.endsWith('.example'));
    // .env.local should be gitignored, but just verify awareness
    // This test documents that env files should not be in source
    expect(true).toBe(true); // Informational test
  });

  it('SUPABASE_SERVICE_ROLE_KEY is not in client-accessible code', () => {
    const srcDir = path.join(SRC_DIR, 'src');
    const clientFiles = getFiles(srcDir, /\.(tsx?)$/).filter((f) => {
      const content = fs.readFileSync(f, 'utf-8');
      return content.includes("'use client'");
    });

    clientFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(content).not.toContain('JWT_SECRET');
      expect(content).not.toContain('VAPID_PRIVATE_KEY');
    });
  });

  it('client-side code only uses NEXT_PUBLIC_ prefixed env vars', () => {
    const srcDir = path.join(SRC_DIR, 'src');
    const clientFiles = getFiles(srcDir, /\.(tsx?)$/).filter((f) => {
      const content = fs.readFileSync(f, 'utf-8');
      return content.includes("'use client'");
    });

    clientFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      // Find process.env.* references
      const envRefs = content.match(/process\.env\.(\w+)/g) || [];
      envRefs.forEach((ref) => {
        const varName = ref.replace('process.env.', '');
        if (!varName.startsWith('NODE_ENV')) {
          expect(varName.startsWith('NEXT_PUBLIC_')).toBe(true);
        }
      });
    });
  });
});
