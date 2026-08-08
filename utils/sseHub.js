const jwt = require('jsonwebtoken');

// Store active admin SSE response streams
const sseClients = new Set();

/**
 * Handle incoming SSE connection request from admin client
 * GET /api/admin/events?token=<JWT>
 */
function handleSseConnection(req, res) {
  const token = req.query.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token required for SSE stream.' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'ecell_pitch_comp_secret_key_2026_secure';
    jwt.verify(token, jwtSecret);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token for SSE stream.' });
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable proxy buffering for instant delivery
  });

  // Send initial handshake message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Real-time SSE stream connected', timestamp: new Date().toISOString() })}\n\n`);

  sseClients.add(res);
  console.log(`[SSE Hub] Admin client connected. Total active SSE clients: ${sseClients.size}`);

  // Handle client disconnection
  req.on('close', () => {
    sseClients.delete(res);
    console.log(`[SSE Hub] Admin client disconnected. Remaining SSE clients: ${sseClients.size}`);
  });
}

/**
 * Broadcast an event to all connected admin clients
 * @param {string} eventType - e.g. 'team_registered', 'ticket_verified', 'team_approved', 'team_rejected', 'registration_toggled'
 * @param {object} payload - Relevant event data
 */
function broadcastSseEvent(eventType, payload = {}) {
  if (sseClients.size === 0) return;

  const data = JSON.stringify({
    type: eventType,
    payload,
    timestamp: new Date().toISOString()
  });

  console.log(`[SSE Hub] Broadcasting event "${eventType}" to ${sseClients.size} client(s).`);

  for (const clientRes of sseClients) {
    try {
      clientRes.write(`data: ${data}\n\n`);
    } catch (err) {
      console.warn('[SSE Hub Warning] Error writing to client stream:', err.message);
      sseClients.delete(clientRes);
    }
  }
}

// 25-second Keep-Alive ping interval to prevent proxy timeout disconnects
setInterval(() => {
  if (sseClients.size === 0) return;
  const pingMessage = `: ping\n\n`;
  for (const clientRes of sseClients) {
    try {
      clientRes.write(pingMessage);
    } catch (err) {
      sseClients.delete(clientRes);
    }
  }
}, 25000);

module.exports = {
  handleSseConnection,
  broadcastSseEvent,
  sseClients
};
