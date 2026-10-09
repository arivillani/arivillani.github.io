// RDD risk assessment: derives the review depth of a change from its files, never
// from a model's judgment. passive → structural readback, medium → one focus lens,
// high → the 4R lenses (Risk, Resilience, Readability, Reliability).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TIERS = ['passive', 'medium', 'high'];
const FOUR_R = ['Risk', 'Resilience', 'Readability', 'Reliability'];

const RULES = [
  { tier: 'high', why: 'workflow / supply chain', test: (f) => f.startsWith('.github/') || /(^|\/)package(-lock)?\.json$/.test(f) },
  { tier: 'high', why: 'site code handles data and builds external URLs', test: (f) => /\/site\/js\//.test(f) },
  { tier: 'high', why: 'tooling that executes locally or in CI', test: (f) => /\/scripts\/.+\.mjs$/.test(f) },
  { tier: 'high', why: 'security gate or lint rules', test: (f) => /\/tests\/security\//.test(f) || /(^|\/)(eslint\.config\.js|\.htmlvalidate\.json)$/.test(f) },
  { tier: 'high', why: 'SVG is active markup when opened directly', test: (f) => f.endsWith('.svg') },
  { tier: 'passive', why: 'documentation, specs or receipts', test: (f) => /\.md$/.test(f) || /\/(sdd|rdd)\//.test(f) },
  { tier: 'passive', why: 'binary asset', test: (f) => /\.(webp|png|jpe?g|ico|woff2|txt)$/.test(f) },
  { tier: 'medium', why: 'markup, styles, data, tests or config', test: () => true },
];

export function assessRisk(files, { diff = '' } = {}) {
  let tier = 'passive';
  const reasons = [];
  for (const file of files) {
    const rule = RULES.find((r) => r.test(file));
    reasons.push(`${rule.tier}: ${file} (${rule.why})`);
    if (TIERS.indexOf(rule.tier) > TIERS.indexOf(tier)) tier = rule.tier;
  }
  if (/Content-Security-Policy/.test(diff) && files.some((f) => f.endsWith('.html'))) {
    reasons.push('high: an HTML change touches the Content-Security-Policy');
    tier = 'high';
  }
  const lenses = tier === 'high' ? FOUR_R : tier === 'medium' ? ['Reliability'] : [];
  return { tier, lenses, reasons };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = process.argv[2] ?? 'HEAD~1';
  const head = process.argv[3] ?? 'HEAD';
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
  const files = git('diff', '--name-only', `${base}...${head}`).split('\n').filter(Boolean);
  const diff = git('diff', `${base}...${head}`, '--', '*.html');
  console.log(JSON.stringify({ base, head, ...assessRisk(files, { diff }) }, null, 2));
}
