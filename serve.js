const { spawn } = require('child_process');
const http = require('http');

console.log('[FishAI] Supervisor starting...');

function startNext() {
  console.log('[FishAI] Spawning Next.js...');
  const child = spawn('npx', ['next', 'start', '-p', '3000', '-H', '0.0.0.0'], {
    cwd: '/home/z/my-project',
    stdio: 'inherit',
    detached: false
  });
  
  child.on('exit', (code, signal) => {
    console.log(`[FishAI] Next.js exited (code=${code}, signal=${signal}), restarting in 3s...`);
    setTimeout(startNext, 3000);
  });
  
  child.on('error', (err) => {
    console.error(`[FishAI] Failed to start Next.js:`, err);
    setTimeout(startNext, 3000);
  });
}

startNext();

// Keep the process alive
process.on('SIGTERM', () => { /* ignore */ });
process.on('SIGINT', () => { /* ignore */ });
