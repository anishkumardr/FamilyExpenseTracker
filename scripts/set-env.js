// Node script used by Netlify build to create environment.prod.ts
// It reads environment variables set in Netlify UI and writes src/environments/environment.prod.ts

const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');

const content = `export const environment = {
  production: true,
  SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
  SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}',
  PARSE_FUNCTION_URL: '${process.env.PARSE_FUNCTION_URL || ''}'
};
`;

fs.writeFileSync(outPath, content, { encoding: 'utf8' });
console.log('Wrote environment.prod.ts');
