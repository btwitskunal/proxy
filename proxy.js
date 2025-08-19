const { Redbird } = require('redbird');
const config = require('./proxy.config');
const path = require('path');

// Helper function to build target URLs
function buildTargetUrl(service) {
  return `http://${config.services[service].host}:${config.services[service].port}`;
}

// Helper function to check if service is enabled
function isServiceEnabled(service) {
  return config.services[service] && config.services[service].enabled;
}

// Create Redbird proxy instance
const proxyOptions = {
  port: config.server.port,
  host: config.server.host,
  xfwd: config.security.xfwd,
};

// Add SSL configuration if enabled
if (config.server.ssl.enabled && config.server.ssl.key && config.server.ssl.cert) {
  proxyOptions.ssl = {
    port: config.server.ssl.port,
    key: config.server.ssl.key,
    cert: config.server.ssl.cert,
  };
}

const proxy = new Redbird(proxyOptions);

// Build routes dynamically from configuration
const routes = [];

// Frontend routes
if (isServiceEnabled('frontend')) {
  const frontendTarget = buildTargetUrl('frontend');
  const sourceUrl = `http://localhost:${config.server.port}${config.routes.frontend.source}`;
  routes.push({
    source: sourceUrl,
    target: frontendTarget,
    options: config.routes.frontend.options
  });
}

// Backend routes
if (isServiceEnabled('backend')) {
  const backendTarget = buildTargetUrl('backend');
  
  Object.keys(config.routes.backend).forEach(routeKey => {
    const route = config.routes.backend[routeKey];
    const sourceUrl = `http://localhost:${config.server.port}${route.source}`;
    routes.push({
      source: sourceUrl,
      target: backendTarget,
      options: route.options
    });
  });
}

// Fetch data routes
if (isServiceEnabled('fetchData')) {
  const fetchDataTarget = buildTargetUrl('fetchData');
  const sourceUrl = `http://localhost:${config.server.port}${config.routes.fetchData.source}`;
  routes.push({
    source: sourceUrl,
    target: fetchDataTarget,
    options: config.routes.fetchData.options
  });
}

// Register all routes
routes.forEach(route => {
  try {
    proxy.register(route.source, route.target, route.options);
    console.log(`✅ Registered route: ${route.source} -> ${route.target}`);
  } catch (error) {
    console.error(`❌ Failed to register route ${route.source}:`, error.message);
  }
});

// Note: Health check endpoints removed due to Redbird API limitations
// For health checks, you can monitor the proxy by checking if routes are registered
// or create a separate Express server for health endpoints

// Note: Event handlers removed due to Redbird API limitations
// Error handling and logging would need to be implemented differently
// or through the underlying HTTP server if accessible

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\n${signal} received, shutting down proxy gracefully...`);
  
  // Close all proxy connections
  proxy.close(() => {
    console.log('✅ Proxy closed successfully');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('❌ Force shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  gracefulShutdown('Uncaught Exception');
});

// Startup logging
console.log('🚀 Redbird Proxy starting...');
console.log(`📡 Server: ${config.server.host}:${config.server.port}`);
if (config.server.ssl.enabled) {
  console.log(`🔒 SSL: ${config.server.ssl.port}`);
}
console.log('\n📋 Service Configuration:');
Object.entries(config.services).forEach(([service, config]) => {
  const status = config.enabled ? '✅' : '❌';
  console.log(`   ${status} ${service}: ${config.host}:${config.port}`);
});

console.log('\n🛣️  Registered Routes:');
routes.forEach(route => {
  console.log(`   ${route.source} -> ${route.target}`);
});

console.log('\n✨ Proxy is ready!'); 