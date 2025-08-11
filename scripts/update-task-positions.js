import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250810160422_create_tasks_table.sql');
let content = fs.readFileSync(migrationPath, 'utf8');

// Counter for position values
let position = 10;

// Replace position values with incremental values
content = content.replace(/(\s+'todo',\s+'(?:high|medium|low|urgent)',\s+)0/g, (match, group1) => {
  const newValue = `${group1}${position}`;
  position += 10;
  return newValue;
});

// Write the updated content
fs.writeFileSync(migrationPath, content, 'utf8');
console.log('Updated task positions successfully!');