import url from 'url';

export function apiDevPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) {
          return next();
        }

        const parsedUrl = url.parse(req.url, true);
        const pathParts = parsedUrl.pathname.replace('/api/', '').split('/');
        const endpoint = pathParts[0];

        try {
          // Read request body if POST or PUT
          let body = {};
          if (req.method === 'POST' || req.method === 'PUT') {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const rawBody = Buffer.concat(buffers).toString();
            if (rawBody) {
              try {
                body = JSON.parse(rawBody);
              } catch (e) {
                body = {};
              }
            }
          }

          req.query = parsedUrl.query;
          req.body = body;

          // Polyfill res.status().json()
          res.status = function(code) {
            res.statusCode = code;
            return res;
          };
          res.json = function(data) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };

          let handler;
          if (endpoint === 'health') {
            handler = (await import('./health.js')).default;
          } else if (endpoint === 'products') {
            handler = (await import('./products.js')).default;
          } else if (endpoint === 'clients') {
            handler = (await import('./clients.js')).default;
          } else if (endpoint === 'trips') {
            handler = (await import('./trips.js')).default;
          } else if (endpoint === 'orders') {
            handler = (await import('./orders.js')).default;
          } else if (endpoint === 'dashboard') {
            handler = (await import('./dashboard.js')).default;
          } else {
            return res.status(404).json({ error: 'Endpoint not found' });
          }

          await handler(req, res);
        } catch (err) {
          console.error('API Dev error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: err.message });
          }
        }
      });
    }
  };
}
