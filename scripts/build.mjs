import { rm, mkdir, cp } from 'node:fs/promises';
const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const item of ['index.html', 'styles.css', 'src', 'public']) await cp(new URL('../' + item, import.meta.url), new URL(item, output), { recursive: true });
console.log('Static build created in dist/. No dependencies or server bundle required.');
