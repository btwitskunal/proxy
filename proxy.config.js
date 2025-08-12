module.exports = {
  // Proxy server configuration
  server: {
    port: process.env.PROXY_PORT || 80,
    host: process.env.PROXY_HOST || '0.0.0.0',
    ssl: {
      enabled: process.env.SSL_ENABLED === 'true',
      port: process.env.SSL_PORT || 443,
      key: process.env.SSL_KEY_PATH,
      cert: process.env.SSL_CERT_PATH,
    }
  },

  // Service configurations
  services: {
    frontend: {
      port: process.env.FRONTEND_PORT || 3000,
      host: process.env.FRONTEND_HOST || 'localhost',
      healthCheck: '/',
      enabled: process.env.FRONTEND_ENABLED !== 'false'
    },
    backend: {
      port: process.env.BACKEND_PORT || 4000,
      host: process.env.BACKEND_HOST || 'localhost',
      healthCheck: '/health',
      enabled: process.env.BACKEND_ENABLED !== 'false'
    },
    fetchData: {
      port: process.env.FETCH_DATA_PORT || 2000,
      host: process.env.FETCH_DATA_HOST || 'localhost',
      healthCheck: '/',
      enabled: process.env.FETCH_DATA_ENABLED !== 'false'
    }
  },

  // Route configurations
  routes: {
    frontend: {
      source: '/',
      target: null, // Will be constructed from service config
      options: {
        changeOrigin: true,
        ws: true, // Enable WebSocket support for Vite HMR
        timeout: 30000,
        proxyTimeout: 30000
      }
    },
    backend: {
      api: {
        source: '/api',
        target: null,
        options: { changeOrigin: true, timeout: 30000 }
      },
      auth: {
        source: '/auth',
        target: null,
        options: { changeOrigin: true, timeout: 30000 }
      },
      saml: {
        source: '/saml',
        target: null,
        options: { changeOrigin: true, timeout: 30000 }
      },
      upload: {
        source: '/upload',
        target: null,
        options: { changeOrigin: true, timeout: 30000 }
      },
      reports: {
        source: '/reports',
        target: null,
        options: { changeOrigin: true, timeout: 30000 }
      },
      health: {
        source: '/health',
        target: null,
        options: { changeOrigin: true, timeout: 5000 }
      }
    },
    fetchData: {
      source: '/fetch',
      target: null,
      options: { changeOrigin: true, timeout: 30000 }
    }
  },

  // Security configuration
  security: {
    xfwd: false, // Disable X-Forwarded-For headers
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED === 'true',
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enabled: process.env.LOGGING_ENABLED !== 'false'
  }
}; 