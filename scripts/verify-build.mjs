import assert from 'node:assert/strict';
import { readFile, readdir, lstat } from 'node:fs/promises';

const root = new URL('../dist/', import.meta.url);
const files = [];
async function walk(directory = '') {
  for (const name of await readdir(new URL(directory, root))) {
    const relative = directory + name;
    const stat = await lstat(new URL(relative, root));
    assert.ok(!stat.isSymbolicLink(), `Deployment cannot contain symlinks: ${relative}`);
    if (stat.isDirectory()) await walk(relative + '/');
    else {
      assert.ok(stat.isFile() && stat.nlink === 1, `Expected an ordinary file: ${relative}`);
      assert.ok(['index.html', 'styles.css'].includes(relative) || /^(src\/[^/]+\.js|public\/assets\/[^/]+\.png)$/.test(relative), `Unexpected deployment file: ${relative}`);
      files.push(relative);
    }
  }
}
await walk();
assert.ok(files.includes('index.html') && files.includes('public/assets/arena.png'));
const html = await readFile(new URL('index.html', root), 'utf8');
const references = [];
for (const [, reference] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (!reference.startsWith('data:')) references.push({ from: 'index.html', reference });
}
for (const file of files.filter(name => name.endsWith('.js'))) {
  const source = await readFile(new URL(file, root), 'utf8');
  for (const [, reference] of source.matchAll(/(?:from\s+|new URL\()'([^']+)'/g)) references.push({ from: file, reference });
}
// Check both a user site and a project site without hardcoding the repository name.
for (const base of ['https://example.github.io/', 'https://example.github.io/any-repository/']) {
  for (const { from, reference } of references) {
    assert.ok(reference.startsWith('./') || reference.startsWith('../'), `Asset must be relative: ${reference}`);
    const resolved = new URL(reference, new URL(from, base)).href;
    assert.ok(resolved.startsWith(base), `Asset escapes the site base: ${reference}`);
    const target = resolved.slice(base.length) || 'index.html';
    assert.ok(files.includes(target), `Missing asset: ${target}, referenced from ${from}`);
  }
}
console.log(`Verified ${files.length} public files and ${references.length} references at root and repository subpaths. No server, documents, credentials, or QA artifacts are deployed.`);
