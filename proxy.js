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
  routes.push({
    source: config.routes.frontend.source,
    target: frontendTarget,
    options: config.routes.frontend.options
  });
}

// Backend routes
if (isServiceEnabled('backend')) {
  const backendTarget = buildTargetUrl('backend');
  
  Object.keys(config.routes.backend).forEach(routeKey => {
    const route = config.routes.backend[routeKey];
    routes.push({
      source: route.source,
      target: backendTarget,
      options: route.options
    });
  });
}

// Fetch data routes
if (isServiceEnabled('fetchData')) {
  const fetchDataTarget = buildTargetUrl('fetchData');
  routes.push({
    source: config.routes.fetchData.source,
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

// Health check for the proxy itself
proxy.app.get('/proxy-health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Redbird Proxy',
    version: '1.0.0',
    config: {
      port: config.server.port,
      ssl: config.server.ssl.enabled,
      services: Object.keys(config.services).filter(service => isServiceEnabled(service))
    },
    routes: routes.map(r => ({ source: r.source, target: r.target }))
  });
});

// Service health check endpoint
proxy.app.get('/services-health', async (req, res) => {
  const healthChecks = {};
  
  // Check each service health
  for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
    if (!serviceConfig.enabled) {
      healthChecks[serviceName] = { status: 'disabled' };
      continue;
    }
    
    try {
      const targetUrl = buildTargetUrl(serviceName);
      const healthUrl = `${targetUrl}${serviceConfig.healthCheck}`;
      
      // Simple health check (you might want to use a proper HTTP client)
      healthChecks[serviceName] = {
        status: 'checking',
        target: targetUrl,
        healthCheck: healthUrl
      };
    } catch (error) {
      healthChecks[serviceName] = {
        status: 'error',
        error: error.message
      };
    }
  }
  
  res.json({
    timestamp: new Date().toISOString(),
    services: healthChecks
  });
});

// Error handling
proxy.on('error', (err, req, res) => {
  console.error('🚨 Proxy error:', err);
  if (res && !res.headersSent) {
    res.status(500).json({
      error: 'Proxy error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Request logging (if enabled)
if (config.logging.enabled) {
  proxy.on('request', (req, res) => {
    const logLevel = config.logging.level;
    if (logLevel === 'debug' || logLevel === 'info') {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url} -> ${req.headers.host}`);
    }
  });
}

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

console.log('\n🔍 Health Checks:');
console.log(`   Proxy: http://localhost:${config.server.port}/proxy-health`);
console.log(`   Services: http://localhost:${config.server.port}/services-health`);
console.log('\n✨ Proxy is ready!'); 