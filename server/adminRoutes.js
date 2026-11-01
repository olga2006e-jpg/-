// server/adminRoutes.js
// Express API router for the Administrator Dashboard

import express from 'express';
import { adminState } from './adminState.js';
import {requireHostAdmin} from './adminAccess.js';

export function createAdminRouter(multiplayer) {
  const router = express.Router();
  router.use(requireHostAdmin);
  const startTime = Date.now();

  // 1. Get real-time metrics & player telemetry
  router.get('/metrics', (req, res) => {
    const uptime = (Date.now() - startTime) / 1000;
    const snapshot = adminState.getMetricsSnapshot(uptime);
    res.json({ success: true, ...snapshot });
  });

  // 2. Edit world parameters in real-time
  router.post('/world', (req, res) => {
    const newSettings = adminState.updateWorldSettings(req.body || {});
    // Broadcast to all active clients via WebSocket
    if (multiplayer && multiplayer.broadcastWorldSettings) {
      multiplayer.broadcastWorldSettings(newSettings);
    }
    res.json({ success: true, world: newSettings });
  });

  // 3. Edit agent behavior / prompt / mood
  router.post('/agent', (req, res) => {
    const { agentId, mood, systemPrompt, name } = req.body || {};
    if (!agentId) return res.status(400).json({ error: 'agentId required' });

    const updated = adminState.updateAgentConfig(agentId, { mood, systemPrompt, name });
    if (!updated) return res.status(404).json({ error: 'Agent not found' });

    if (multiplayer && multiplayer.broadcastAgentUpdate) {
      multiplayer.broadcastAgentUpdate(agentId, updated);
    }
    res.json({ success: true, agent: updated });
  });

  // 4. Trigger world mutation (spawn light beam, change room, spawn objects)
  router.post('/mutate-world', (req, res) => {
    const { mutationType, targetX, targetY, targetZ, author, message, params } = req.body || {};
    const mutation = adminState.recordMutation({
      mutationType: mutationType || 'SPAWN_LIGHT_BEAM',
      x: Number(targetX) || 0,
      y: Number(targetY) || 0,
      z: Number(targetZ) || 0,
      author: author || 'Администратор',
      message: message || 'Окружение изменено администратором!',
      params: params || {}
    });

    if (multiplayer && multiplayer.broadcastMutation) {
      multiplayer.broadcastMutation(mutation);
    }
    res.json({ success: true, mutation });
  });

  // 5. Broadcast global banner notification
  router.post('/broadcast', (req, res) => {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message required' });

    if (multiplayer && multiplayer.broadcastNotification) {
      multiplayer.broadcastNotification(`📢 [АДМИНИСТРАТОР]: ${message}`);
    }
    res.json({ success: true, message });
  });

  return router;
}
