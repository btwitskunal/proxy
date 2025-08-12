const { Redbird } = require('redbird');

// Create Redbird proxy instance
const proxy = new Redbird({
  port: 8080,
  xfwd: false,
});

// Register routes
console.log('🚀 Starting Redbird Proxy...');

// Frontend route - use full URL
proxy.register('http://localhost:8080/', 'http://localhost:5173', {
  changeOrigin: true,
  ws: true, // Enable WebSocket support for Vite HMR
});
console.log('✅ Registered route: http://localhost/ -> http://localhost:3000');

// Backend API routes
proxy.register('http://localhost:8080/api', 'http://localhost:4000', {
  changeOrigin: true,
});
console.log('✅ Registered route: http://localhost/api -> http://localhost:4000');

proxy.register('http://localhost:8080/auth', 'http://localhost:4000', {
  changeOrigin: true,
});
console.log('✅ Registered route: http://localhost/auth -> http://localhost:4000');

proxy.register('http://localhost:8080/saml', 'http://localhost:4000', {
  changeOrigin: true,
});
console.log('✅ Registered route: http://localhost/saml -> http://localhost:4000');

proxy.register('http://localhost:8080/upload', 'http://localhost:4000', {
  changeOrigin: true,
});
console.log('✅ Registered route: http://localhost/upload -> http://localhost:4000');

proxy.register('http://localhost:8080/reports', 'http://localhost:4000', {
  changeOrigin: true,
});
console.log('✅ Registered route: http://localhost/reports -> http://localhost:4000');

proxy.register('http://localhost:8080/health', 'http://localhost:4000', {
  changeOrigin: true,
});
console.log('✅ Registered route: http://localhost/health -> http://localhost:4000');

// Fetch data service
proxy.register('http://localhost:8080/fetch', 'http://localhost:2000', {
  changeOrigin: true,
});
console.log('✅ Registered route: http://localhost/fetch -> http://localhost:2000');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received, shutting down proxy gracefully...');
  proxy.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down proxy gracefully...');
  proxy.close();
  process.exit(0);
});

console.log('\n✨ Proxy is ready on port 8080!');
console.log('📋 Available routes:');
console.log('   Frontend: http://localhost/');
console.log('   Backend API: http://localhost/api');
console.log('   Auth: http://localhost/auth');
console.log('   SAML: http://localhost/saml');
console.log('   Upload: http://localhost/upload');
console.log('   Reports: http://localhost/reports');
console.log('   Health: http://localhost/health');
console.log('   Fetch Data: http://localhost/fetch');
console.log('\n🛑 Press Ctrl+C to stop the proxy'); 