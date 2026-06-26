// src/web.js
// Web server untuk PAP Bot - OAuth landing page & dashboard

import http from 'http';

/**
 * Start web server untuk landing page dan OAuth
 * @param {Client} client - Discord client instance
 */
export function startWeb(client) {
  const PORT = process.env.WEB_PORT || 3000;
  const HOST = process.env.WEB_HOST || '0.0.0.0';

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // ===================== ROUTES =====================

    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        uptime: process.uptime(),
        guilds: client.guilds.cache.size,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // API: Stats
    if (url.pathname === '/api/stats') {
      try {
        const stats = await getBotStats(client);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to get stats' }));
      }
      return;
    }

    // OAuth callback (untuk future implementation)
    if (url.pathname === '/oauth/callback') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(generateOAuthCallbackPage());
      return;
    }

    // Invite link
    if (url.pathname === '/invite') {
      const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot%20applications.commands&permissions=2147483648`;
      res.writeHead(302, { 'Location': inviteUrl });
      res.end();
      return;
    }

    // Home / Landing page
    if (url.pathname === '/' || url.pathname === '') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(generateLandingPage(client));
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(generate404Page());
  });

  server.listen(PORT, HOST, () => {
    console.log(`[web] 🌐 Server berjalan di http://${HOST}:${PORT}`);
    console.log(`[web] 📊 Health check: http://localhost:${PORT}/health`);
    console.log(`[web] 📈 Stats API: http://localhost:${PORT}/api/stats`);
  });

  // Error handling
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[web] ❌ Port ${PORT} sudah digunakan!`);
    } else {
      console.error(`[web] ❌ Error:`, err);
    }
  });

  return server;
}

/**
 * Get bot statistics
 */
async function getBotStats(client) {
  const guildCount = client.guilds.cache.size;
  const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
  const channelCount = client.channels.cache.size;

  return {
    guilds: guildCount,
    users: userCount,
    channels: channelCount,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate landing page HTML
 */
function generateLandingPage(client) {
  const guildCount = client.guilds?.cache?.size || 0;
  const clientId = process.env.CLIENT_ID || 'YOUR_CLIENT_ID';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📸 PAP Bot - Discord Photo Sharing Bot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 800px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
    }
    .logo { font-size: 80px; margin-bottom: 20px; }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 1.2em;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin: 30px 0;
      flex-wrap: wrap;
    }
    .stat-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 15px;
      min-width: 120px;
    }
    .stat-number {
      font-size: 2em;
      font-weight: bold;
    }
    .stat-label {
      font-size: 0.9em;
      opacity: 0.9;
    }
    .features {
      text-align: left;
      margin: 30px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 15px;
    }
    .feature {
      display: flex;
      align-items: center;
      margin: 10px 0;
    }
    .feature-icon { font-size: 24px; margin-right: 10px; }
    .feature-text { color: #333; }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #5865F2 0%, #764ba2 100%);
      color: white;
      padding: 15px 40px;
      border-radius: 50px;
      text-decoration: none;
      font-size: 1.2em;
      font-weight: bold;
      margin: 10px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(88, 101, 242, 0.4);
    }
    .btn-secondary {
      background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
    }
    .footer {
      margin-top: 30px;
      color: #999;
      font-size: 0.9em;
    }
    .modes {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .mode-box {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 15px;
      border-radius: 10px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">📸</div>
    <h1>PAP Bot</h1>
    <p class="subtitle">Discord Photo Sharing Bot dengan 4 Mode Unik!</p>

    <div class="stats">
      <div class="stat-box">
        <div class="stat-number">${guildCount}</div>
        <div class="stat-label">Server Aktif</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">4</div>
        <div class="stat-label">Mode</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">100%</div>
        <div class="stat-label">Private</div>
      </div>
    </div>

    <div class="modes">
      <div class="mode-box">🔄 ROUND</div>
      <div class="mode-box">🔀 SWAP</div>
      <div class="mode-box">⛓️ CHAIN</div>
      <div class="mode-box">📊 QUOTA</div>
    </div>

    <div class="features">
      <div class="feature">
        <span class="feature-icon">🔒</span>
        <span class="feature-text"><strong>Private & Secure</strong> - Foto hanya terlihat oleh peserta</span>
      </div>
      <div class="feature">
        <span class="feature-icon">⚡</span>
        <span class="feature-text"><strong>Easy to Use</strong> - Slash commands dengan autocomplete</span>
      </div>
      <div class="feature">
        <span class="feature-icon">🎭</span>
        <span class="feature-text"><strong>4 Mode Unik</strong> - ROUND, SWAP, CHAIN, QUOTA</span>
      </div>
      <div class="feature">
        <span class="feature-icon">📊</span>
        <span class="feature-text"><strong>Statistics</strong> - Track submissions dan aktivitas</span>
      </div>
      <div class="feature">
        <span class="feature-icon">💾</span>
        <span class="feature-text"><strong>Persistent</strong> - Data tersimpan di database</span>
      </div>
    </div>

    <div>
      <a href="/invite" class="btn">🤖 Invite Bot</a>
      <a href="https://github.com" class="btn btn-secondary">📖 Documentation</a>
    </div>

    <div class="footer">
      <p>PAP Bot v1.4.0 | Made with ❤️ | Node.js ${process.version}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate OAuth callback page
 */
function generateOAuthCallbackPage() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>OAuth Success - PAP Bot</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .box {
      background: white;
      padding: 40px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #4CAF50; }
    p { color: #666; margin: 10px 0; }
    .icon { font-size: 60px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">✅</div>
    <h1>OAuth Success!</h1>
    <p>You can close this window now.</p>
    <p>Return to Discord to continue.</p>
  </div>
  <script>
    setTimeout(() => window.close(), 2000);
  </script>
</body>
</html>`;
}

/**
 * Generate 404 page
 */
function generate404Page() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>404 - PAP Bot</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .box {
      background: white;
      padding: 40px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #f44336; font-size: 4em; margin: 0; }
    p { color: #666; }
    a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="box">
    <h1>404</h1>
    <p>Page not found</p>
    <p><a href="/">Go back to home</a></p>
  </div>
</body>
</html>`;
}

export default { startWeb };