// Compila la función `arku` (y las reglas de @arku/domain) en un solo archivo para Supabase.
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const require = createRequire(`${root}packages/api/package.json`);
const version = (name) => require(`${name}/package.json`).version;

// Las librerías se cargan desde npm en Deno (con versión fija); solo se empaqueta el código de Arku.
const NPM = { 'zod': version('zod'), '@supabase/supabase-js': version('@supabase/supabase-js') };
const npmSpecifiers = {
  name: 'npm-specifiers',
  setup(b) {
    b.onResolve({ filter: /^(zod|@supabase\/supabase-js)$/ }, (args) => ({ path: `npm:${args.path}@${NPM[args.path]}`, external: true }));
  },
};
await build({
  entryPoints: [`${root}packages/api/src/function.ts`],
  outfile: `${root}supabase/functions/arku/index.ts`,
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  mainFields: ['module', 'main'],
  conditions: ['import', 'module', 'default'],
  minify: false,
  plugins: [npmSpecifiers],
  legalComments: 'none',
  banner: {
    js: '// ARCHIVO GENERADO. No editar: cambia packages/api/src/function.ts y corre `pnpm --filter @arku/api build:function`.\n// deno-lint-ignore-file\n// @ts-nocheck',
  },
});
console.log('Listo: supabase/functions/arku/index.ts');
