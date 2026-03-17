#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

// Directories to search for console.log statements
const srcDir = path.join(__dirname, '../src');

// Files to exclude
const excludePatterns = [
  /node_modules/,
  /\.next/,
  /dist/,
  /build/,
  /logger\.ts$/,  // Don't modify the logger file itself
];

// Statistics
let filesProcessed = 0;
let totalReplacements = 0;
let fileChanges = [];

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath) {
  return excludePatterns.some(pattern => pattern.test(filePath));
}

/**
 * Get appropriate logger based on file path
 */
function getLoggerForFile(filePath) {
  const relativePath = path.relative(srcDir, filePath).toLowerCase();
  
  if (relativePath.includes('auth')) return 'authLogger';
  if (relativePath.includes('account')) return 'accountLogger';
  if (relativePath.includes('analytics')) return 'analyticsLogger';
  if (relativePath.includes('attendance')) return 'attendanceLogger';
  if (relativePath.includes('dashboard')) return 'dashboardLogger';
  if (relativePath.includes('member')) return 'memberLogger';
  if (relativePath.includes('schedule')) return 'scheduleLogger';
  if (relativePath.includes('organization')) return 'organizationLogger';
  if (relativePath.includes('notification')) return 'notificationLogger';
  
  return 'logger'; // Default logger
}

/**
 * Process a single file
 */
function processFile(filePath) {
  if (shouldExclude(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let replacements = 0;
  
  // Patterns to replace
  const patterns = [
    // console.log variations
    { 
      regex: /console\.log\s*\(/g,
      replacement: 'logger.debug(',
      type: 'debug'
    },
    // console.error variations
    { 
      regex: /console\.error\s*\(/g,
      replacement: 'logger.error(',
      type: 'error'
    },
    // console.warn variations
    { 
      regex: /console\.warn\s*\(/g,
      replacement: 'logger.warn(',
      type: 'warn'
    },
    // console.info variations
    { 
      regex: /console\.info\s*\(/g,
      replacement: 'logger.info(',
      type: 'info'
    },
    // console.debug variations
    { 
      regex: /console\.debug\s*\(/g,
      replacement: 'logger.debug(',
      type: 'debug'
    },
    // console.table variations
    { 
      regex: /console\.table\s*\(/g,
      replacement: 'logger.table(',
      type: 'table'
    },
    // console.time variations
    { 
      regex: /console\.time\s*\(/g,
      replacement: 'logger.time(',
      type: 'time'
    },
    // console.timeEnd variations
    { 
      regex: /console\.timeEnd\s*\(/g,
      replacement: 'logger.timeEnd(',
      type: 'timeEnd'
    },
    // console.group variations
    { 
      regex: /console\.group\s*\(/g,
      replacement: 'logger.group(',
      type: 'group'
    },
    // console.groupEnd variations
    { 
      regex: /console\.groupEnd\s*\(/g,
      replacement: 'logger.groupEnd(',
      type: 'groupEnd'
    },
  ];
  
  // Get appropriate logger for this file
  const loggerName = getLoggerForFile(filePath);
  
  // Replace console statements
  patterns.forEach(pattern => {
    const matches = content.match(pattern.regex);
    if (matches) {
      replacements += matches.length;
      const replacement = pattern.replacement.replace('logger', loggerName);
      content = content.replace(pattern.regex, replacement);
    }
  });
  
  // Add import statement if replacements were made
  if (replacements > 0 && content !== originalContent) {
    // Check if logger is already imported
    const hasLoggerImport = /import\s+.*\s+from\s+['"]@\/lib\/logger['"]/.test(content);
    
    if (!hasLoggerImport) {
      // Determine what needs to be imported
      const imports = new Set();
      if (loggerName === 'logger') {
        imports.add('logger');
      } else {
        imports.add(loggerName);
      }
      
      // Find the right place to insert import (after other imports)
      const importMatch = content.match(/^(import[\s\S]*?from\s+['"].*?['"];?\s*\n)+/m);
      
      if (importMatch) {
        const lastImportEnd = importMatch.index + importMatch[0].length;
        const importStatement = `import { ${Array.from(imports).join(', ')} } from '@/lib/logger';\n`;
        content = content.slice(0, lastImportEnd) + importStatement + content.slice(lastImportEnd);
      } else {
        // No imports found, add at the beginning
        const importStatement = `import { ${Array.from(imports).join(', ')} } from '@/lib/logger';\n\n`;
        content = importStatement + content;
      }
    }
    
    // Write the modified content back
    fs.writeFileSync(filePath, content, 'utf8');
    
    totalReplacements += replacements;
    fileChanges.push({
      file: path.relative(process.cwd(), filePath),
      replacements: replacements,
      logger: loggerName
    });
  }
  
  filesProcessed++;
}

/**
 * Process directory recursively
 */
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      if (!shouldExclude(itemPath)) {
        processDirectory(itemPath);
      }
    } else if (stat.isFile()) {
      // Only process TypeScript and JavaScript files
      if (/\.(ts|tsx|js|jsx)$/.test(itemPath)) {
        processFile(itemPath);
      }
    }
  });
}

// Main execution
console.log('🔍 Searching for console statements in:', srcDir);
console.log('');

processDirectory(srcDir);

console.log('✅ Processing complete!');
console.log('');
console.log('📊 Statistics:');
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Total replacements: ${totalReplacements}`);
console.log(`   Files modified: ${fileChanges.length}`);
console.log('');

if (fileChanges.length > 0) {
  console.log('📝 Modified files:');
  fileChanges.forEach(change => {
    console.log(`   ${change.file} (${change.replacements} replacements, using ${change.logger})`);
  });
  console.log('');
  console.log('⚠️  Please review the changes and run your tests to ensure everything works correctly.');
  console.log('💡 Tip: Use git diff to review all changes before committing.');
} else {
  console.log('✨ No console statements found to replace. Your code is already clean!');
}
