#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const DesumasuConverter = require('desumasu-converter');

const converter = new DesumasuConverter();

function usage() {
  console.log(`Usage: node convert-style.js <mode> <file>

Modes:
  to-desumasu    である調 → ですます調 に変換
  to-dearu       ですます調 → である調 に変換

Examples:
  node scripts/convert-style.js to-desumasu articles/example.md
  node scripts/convert-style.js to-dearu articles/example.md
`);
  process.exit(1);
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (match) {
    return {
      frontmatter: match[0],
      body: content.slice(match[0].length)
    };
  }
  return { frontmatter: '', body: content };
}

function protectCodeBlocks(text) {
  const codeBlocks = [];
  let index = 0;

  const protected = text.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `__CODE_BLOCK_${index}__`;
    codeBlocks.push({ placeholder, content: match });
    index++;
    return placeholder;
  });

  return { protected, codeBlocks };
}

function restoreCodeBlocks(text, codeBlocks) {
  let result = text;
  for (const { placeholder, content } of codeBlocks) {
    result = result.replace(placeholder, content);
  }
  return result;
}

function protectInlineCode(text) {
  const inlineCodes = [];
  let index = 0;

  const protected = text.replace(/`[^`]+`/g, (match) => {
    const placeholder = `__INLINE_CODE_${index}__`;
    inlineCodes.push({ placeholder, content: match });
    index++;
    return placeholder;
  });

  return { protected, inlineCodes };
}

function restoreInlineCode(text, inlineCodes) {
  let result = text;
  for (const { placeholder, content } of inlineCodes) {
    result = result.replace(placeholder, content);
  }
  return result;
}

function convertStyle(content, mode) {
  const { frontmatter, body } = extractFrontmatter(content);

  const { protected: protectedCode, codeBlocks } = protectCodeBlocks(body);
  const { protected: protectedInline, inlineCodes } = protectInlineCode(protectedCode);

  let convertedBody;
  if (mode === 'to-desumasu') {
    convertedBody = converter.convert2keitai(protectedInline);
  } else {
    convertedBody = converter.convert2joutai(protectedInline);
  }

  const restoredInline = restoreInlineCode(convertedBody, inlineCodes);
  const restoredCode = restoreCodeBlocks(restoredInline, codeBlocks);

  return frontmatter + restoredCode;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    usage();
  }

  const mode = args[0];
  const filePath = args[1];

  if (!['to-desumasu', 'to-dearu'].includes(mode)) {
    console.error(`Error: Unknown mode "${mode}"`);
    usage();
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const converted = convertStyle(content, mode);

  fs.writeFileSync(filePath, converted);

  const modeLabel = mode === 'to-desumasu' ? 'ですます調' : 'である調';
  console.log(`Converted to ${modeLabel}: ${filePath}`);
}

main();
