// Starts (or tests) the Spring Boot backend with env vars loaded from backend.env
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const backendDir = path.join(root, 'carbontrack-backend');
const goal = process.argv[2] === 'test' ? ['clean', 'test'] : ['spring-boot:run'];

if (!fs.existsSync(path.join(backendDir, 'pom.xml'))) {
  console.error(
    '\n[backend] carbontrack-backend/pom.xml not found.\n' +
      'Copy your Spring Boot project folder into this repo as "carbontrack-backend/" ' +
      '(the folder that contains pom.xml), then run again.\n'
  );
  process.exit(1);
}

const env = { ...process.env };
const envFile = path.join(root, 'backend.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} else {
  console.warn('[backend] backend.env not found - using your shell environment variables.');
}
for (const k of ['DB_PASSWORD', 'JWT_SECRET']) {
  if (!env[k]) console.warn(`[backend] WARNING: ${k} is not set; the app will probably fail to start.`);
}

const win = process.platform === 'win32';
const wrapper = path.join(backendDir, win ? 'mvnw.cmd' : 'mvnw');
const cmd = fs.existsSync(wrapper) ? (win ? 'mvnw.cmd' : './mvnw') : 'mvn';

const child = spawn(cmd, goal, { cwd: backendDir, env, stdio: 'inherit', shell: win });
child.on('exit', (code) => process.exit(code ?? 0));
