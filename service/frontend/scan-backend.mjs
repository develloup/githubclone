#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const suspiciousFiles = [];
const suspiciousPatterns = [
  /export\s+(?:default\s+)?function\s+handler/,       // typische API route
  /getServerSideProps/,                              // SSR
  /getInitialProps/,                                 // alte SSR Methode
  /middleware\.ts/,                                   // Middleware-Dateien
  /export\s+async\s+function\s+GET/,                 // Route Handlers in App Router
  /export\s+async\s+function\s+POST/,
  /use\s+server/,                                     // Server Actions (Next 13+)
  /headers\(\)/, /cookies\(\)/,                      // serverseitige Request-Funktionen
];

const suspiciousFileNames = [
  'middleware.ts',
  'middleware.js',
  'route.ts',
  'route.js',
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile()) {
      // Check by file name
      if (suspiciousFileNames.includes(entry.name)) {
        suspiciousFiles.push(fullPath);
        continue;
      }

      // Check by content
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          suspiciousFiles.push(fullPath);
          break;
        }
      }
    }
  }
}

walk('./src');

if (suspiciousFiles.length === 0) {
  console.log('✅ Keine potentiellen Backend-Dateien oder Funktionen gefunden.');
} else {
  console.log('⚠️ Verdächtige Backend-Dateien gefunden:\n');
  suspiciousFiles.forEach(file => {
    console.log(`- ${file}`);
  });
}
