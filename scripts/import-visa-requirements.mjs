/**
 * Generates visa_requirements SQL from the CSV matrix and optionally pushes to Supabase.
 * Usage:
 *   node scripts/import-visa-requirements.mjs              # writes supabase/migrations/20260613180001_visa_requirements_data.sql
 *   node scripts/import-visa-requirements.mjs --push       # also upserts via Supabase (needs SUPABASE_SERVICE_ROLE_KEY in .env)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CSV_PATH = path.join(ROOT, 'src/data/visa requirements data.csv');

const COUNTRY_NAME_ALIASES = {
  'cote d ivoire': "Côte d'Ivoire",
  "côte d'ivoire": "Côte d'Ivoire",
  'ivory coast': "Côte d'Ivoire",
  eswatini: 'Eswatini',
  swaziland: 'Eswatini',
  'congo (democratic republic)': 'Congo (Democratic Republic)',
  'dr congo': 'Congo (Democratic Republic)',
  'democratic republic of the congo': 'Congo (Democratic Republic)',
  'cabo verde': 'Cabo Verde',
  'cape verde': 'Cabo Verde',
  'united states of america': 'United States',
  'united kingdom of great britain and northern ireland': 'United Kingdom',
  'north macedonia': 'North Macedonia',
  macau: 'Macau',
  macao: 'Macau',
  'timor leste': 'Timor-Leste',
  'east timor': 'Timor-Leste',
  'saint vincent and the grenadines': 'Saint Vincent and the Grenadines',
  'sao tome and principe': 'Sao Tome and Principe',
  'saint kitts and nevis': 'Saint Kitts and Nevis',
  kosovo: 'Kosovo',
  'vatican': 'Vatican City',
  'holy see': 'Vatican City',
};

function normalizeCountryKey(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function resolveCsvCountryName(name) {
  const key = normalizeCountryKey(name);
  return COUNTRY_NAME_ALIASES[key] ?? name.trim();
}

function loadCountries() {
  const countriesTs = fs.readFileSync(path.join(ROOT, 'src/utils/countries.ts'), 'utf8');
  const countries = [];
  const regex = /\{\s*code:\s*'([^']+)',\s*name:\s*'([^']+)'\s*\}/g;
  let match;
  while ((match = regex.exec(countriesTs)) !== null) {
    countries.push({ code: match[1].toLowerCase(), name: match[2] });
  }
  const nameToCode = new Map();
  for (const c of countries) {
    nameToCode.set(normalizeCountryKey(c.name), c.code);
  }
  // Extra codes not in ALL_COUNTRIES
  nameToCode.set(normalizeCountryKey('Kosovo'), 'xk');
  return { countries, nameToCode };
}

function parseCellValue(rawValue) {
  const value = rawValue.trim().toLowerCase();

  if (!value || value === '-1') {
    return { requirement: 'not-applicable', stay_duration: null, notes: null };
  }
  if (/^\d+$/.test(value)) {
    const days = Number(value);
    return { requirement: 'visa-free', stay_duration: days, notes: `Visa-free for up to ${days} days.` };
  }
  if (value.includes('no admission')) {
    return { requirement: 'visa-required', stay_duration: null, notes: 'Entry may be restricted.' };
  }
  if (value.includes('visa free') || value === 'visa-free') {
    return { requirement: 'visa-free', stay_duration: 90, notes: null };
  }
  if (value.includes('visa on arrival') || value.includes('on arrival')) {
    return { requirement: 'visa-on-arrival', stay_duration: 30, notes: null };
  }
  if (value.includes('e-visa') || value.includes('evisa')) {
    return { requirement: 'evisa', stay_duration: 30, notes: null };
  }
  if (value === 'eta' || value === 'esta') {
    return { requirement: 'eta', stay_duration: 90, notes: null };
  }
  if (value.includes('visa required')) {
    return { requirement: 'visa-required', stay_duration: null, notes: null };
  }
  return { requirement: 'visa-required', stay_duration: null, notes: `Recorded: ${rawValue.trim()}` };
}

function escapeSql(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function parseCsvMatrix() {
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const header = lines[0].split(',');
  const destinations = header.slice(1).map((d) => d.trim());
  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(',');
    const passport = cells[0]?.trim();
    if (!passport) continue;
    rows.push({ passport, cells: cells.slice(1) });
  }
  return { destinations, rows };
}

function countryNameToCode(name, nameToCode) {
  const resolved = resolveCsvCountryName(name);
  const key = normalizeCountryKey(resolved);
  const code = nameToCode.get(key);
  if (code) return code;
  // fuzzy: try partial match
  for (const [k, c] of nameToCode.entries()) {
    if (k === key || k.includes(key) || key.includes(k)) return c;
  }
  return null;
}

function buildRecords() {
  const { nameToCode } = loadCountries();
  const { destinations, rows } = parseCsvMatrix();
  const records = [];
  let skipped = 0;

  for (const row of rows) {
    const nationalityCode = countryNameToCode(row.passport, nameToCode);
    if (!nationalityCode) {
      skipped++;
      continue;
    }

    destinations.forEach((destName, index) => {
      const destinationCode = countryNameToCode(destName, nameToCode);
      if (!destinationCode) return;
      const cell = row.cells[index];
      if (!cell) return;
      const parsed = parseCellValue(cell);
      if (parsed.requirement === 'not-applicable' && nationalityCode === destinationCode) return;
      records.push({
        nationality: nationalityCode,
        destination: destinationCode,
        ...parsed,
      });
    });
  }

  console.log(`Built ${records.length} records (${skipped} passport rows skipped)`);
  return records;
}

function writeSqlMigration(records) {
  const outPath = path.join(ROOT, 'supabase/migrations/20260613180001_visa_requirements_data.sql');
  const batchSize = 400;
  const chunks = [];
  for (let i = 0; i < records.length; i += batchSize) {
    chunks.push(records.slice(i, i + batchSize));
  }

  let sql = `-- Auto-generated visa requirements from CSV (${records.length} rows)\n\n`;
  for (const chunk of chunks) {
    const values = chunk
      .map(
        (r) =>
          `(${escapeSql(r.nationality)}, ${escapeSql(r.destination)}, ${escapeSql(r.requirement)}, ${r.stay_duration ?? 'NULL'}, ${escapeSql(r.notes)})`
      )
      .join(',\n');
    sql += `INSERT INTO public.visa_requirements (nationality, destination, requirement, stay_duration, notes)
VALUES
${values}
ON CONFLICT (nationality, destination) DO UPDATE SET
  requirement = EXCLUDED.requirement,
  stay_duration = EXCLUDED.stay_duration,
  notes = EXCLUDED.notes;

`;
  }

  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`Wrote ${outPath} (${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)} MB)`);
}

async function pushToSupabase(records) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('Skipping Supabase push: set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const supabase = createClient(url, key);
  const batchSize = 500;
  let upserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from('visa_requirements').upsert(batch, {
      onConflict: 'nationality,destination',
    });
    if (error) throw error;
    upserted += batch.length;
    console.log(`Upserted ${upserted}/${records.length}`);
  }
}

const records = buildRecords();
writeSqlMigration(records);

if (process.argv.includes('--push')) {
  await pushToSupabase(records);
}
