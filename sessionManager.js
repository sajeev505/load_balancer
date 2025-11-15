// sessionManager.js - Handles session persistence

import crypto from 'crypto';

class SessionManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> serverUrl
    this.cookieName = 'lb-session-id';
  }

  // Extract session cookie from request
  getSessionId(req) {
    const cookies = req.headers.cookie;
    if (!cookies) return null;

    const cookieArray = cookies.split(';');
    for (let cookie of cookieArray) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.cookieName) {
        return value;
      }
    }
    return null;
  }

  // Generate unique session ID
  generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Get server for session or create new mapping
  getServerForSession(req, server) {
    let sessionId = this.getSessionId(req);

    if (sessionId && this.sessions.has(sessionId)) {
      const serverUrl = this.sessions.get(sessionId);
      return { sessionId, serverUrl, isNew: false };
    }

    // Create new session
    sessionId = this.generateSessionId();
    this.sessions.set(sessionId, server.url);
    return { sessionId, serverUrl: server.url, isNew: true };
  }

  // Set session cookie in response
  setSessionCookie(res, sessionId) {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    res.setHeader(
      'Set-Cookie',
      `${this.cookieName}=${sessionId}; Path=/; HttpOnly; Max-Age=${maxAge}`
    );
  }

  // Clean up expired sessions
  cleanup() {
    // Implement cleanup logic if needed
    // For simplicity, we keep all sessions
  }
}

export default SessionManager;
