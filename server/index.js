require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const SessionManager = require('./services/session-manager');
const sessionsRoute = require('./routes/sessions');
const setupWebSocket = require('./ws');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const TTYD_PORT_START = parseInt(process.env.TTYD_PORT_RANGE_START || '7681', 10);
const TTYD_PORT_END = parseInt(process.env.TTYD_PORT_RANGE_END || '7780', 10);

const app = express();
const server = http.createServer(app);

app.use(express.json());

const sessionManager = new SessionManager(TTYD_PORT_START, TTYD_PORT_END);

function resolveRunningSession(name) {
  if (!name) return null;
  try {
    const session = sessionManager.getSession(name);
    if (session.status !== 'running') return null;
    return session;
  } catch (err) {
    return null;
  }
}

function getSessionNameFromUrl(url) {
  if (!url) return null;
  const match = /^\/terminal\/([^/?#]+)(?:[/?#]|$)/.exec(url);
  return match ? match[1] : null;
}

const proxyScript =
  '(function(){var c=setInterval(function(){if(window.term&&window.term.attachCustomKeyEventHandler){clearInterval(c);window.term.attachCustomKeyEventHandler(function(e){if(e.ctrlKey&&!e.shiftKey&&!e.altKey&&!e.metaKey&&e.key==="c"&&window.term.hasSelection()){var t=window.term.getSelection();if(t){navigator.clipboard.writeText(t).catch(function(){})}return false}return true})}},50)})();';

const ttydProxy = createProxyMiddleware({
  target: 'http://127.0.0.1',
  changeOrigin: true,
  router: (req) => `http://127.0.0.1:${req.ttydSession.port}`,
  pathRewrite: (path, req) => req.originalUrl || req.url,
  on: {
    proxyReq: (proxyReq, req, res) => {
      proxyReq.removeHeader('accept-encoding');
    },
    proxyRes: (proxyRes, req, res) => {
      if (proxyRes.headers['content-type']?.includes('text/html')) {
        delete proxyRes.headers['content-length'];
        const _write = res.write;
        const _end = res.end;
        const chunks = [];
        res.write = function(chunk, encoding, callback) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk || ''));
          return true;
        };
        res.end = function(chunk, encoding, callback) {
          try {
            if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            let body = Buffer.concat(chunks).toString('utf-8');
            body = body.replace('</body>', '<script>' + proxyScript + '</script></body>');
            res.setHeader('Content-Length', Buffer.byteLength(body));
            res.write = _write;
            res.end = _end;
            _write.call(res, body);
            _end.call(res);
          } catch (err) {
            console.error('Script injection error:', err);
            _end.call(res);
          }
        };
      }
    },
    error: (err, req, res) => {
      console.error('Proxy error:', err);
      if (res && typeof res.status === 'function' && !res.headersSent) {
        res.status(502).json({ error: 'Proxy error' });
      }
    },
  },
});

// Proxy /terminal/:name to corresponding ttyd instance
app.use('/terminal/:name', (req, res, next) => {
  const session = resolveRunningSession(req.params.name);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or not running' });
  }
  req.ttydSession = session;
  next();
});
app.use('/terminal', (req, res, next) => {
  if (!req.ttydSession) {
    return res.status(404).json({ error: 'Session not found or not running' });
  }
  next();
});
app.use('/terminal', ttydProxy);

// API routes
app.use('/api/sessions', sessionsRoute(sessionManager));

// Serve frontend static files in production
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// WebSocket
setupWebSocket(server, sessionManager);

server.on('upgrade', (req, socket, head) => {
  const sessionName = getSessionNameFromUrl(req.url);
  if (!sessionName) return;
  const session = resolveRunningSession(sessionName);
  if (!session) {
    socket.destroy();
    return;
  }
  req.ttydSession = session;
  ttydProxy.upgrade(req, socket, head);
});

server.listen(PORT, HOST, () => {
  console.log(`Web TTYd Hub running at http://${HOST}:${PORT}`);
});

// Cleanup on exit
function cleanup() {
  console.log('\nCleaning up ttyd processes...');
  sessionManager.cleanup();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
