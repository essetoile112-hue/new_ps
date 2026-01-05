import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { auth } from '../config/firebase.config';

export interface WSMessage {
  type: 'subscribe' | 'unsubscribe' | 'measurement' | 'alert' | 'ping' | 'pong';
  sensorIds?: string[];
  data?: any;
}

interface ClientSession {
  ws: WebSocket;
  uid: string;
  subscribedSensors: Set<string>;
}

const clients: Map<string, ClientSession> = new Map();

export function setupWebSocketServer(httpServer: HTTPServer) {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', async (ws: WebSocket, req: any) => {
    // Extract token from query param or header
    const token = (req.url?.split('?token=')[1] || req.headers.authorization?.split('Bearer ')[1]) as string;
    if (!token || !auth) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    try {
      const decoded = await auth.verifyIdToken(token);
      const uid = decoded.uid;

      const session: ClientSession = {
        ws,
        uid,
        subscribedSensors: new Set(),
      };

      clients.set(uid, session);

      ws.on('message', (data: Buffer) => {
        try {
          const msg: WSMessage = JSON.parse(data.toString());

          if (msg.type === 'subscribe' && msg.sensorIds) {
            msg.sensorIds.forEach((id) => session.subscribedSensors.add(id));
            ws.send(JSON.stringify({ type: 'subscribed', sensorIds: msg.sensorIds }));
          } else if (msg.type === 'unsubscribe' && msg.sensorIds) {
            msg.sensorIds.forEach((id) => session.subscribedSensors.delete(id));
            ws.send(JSON.stringify({ type: 'unsubscribed', sensorIds: msg.sensorIds }));
          } else if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        clients.delete(uid);
      });

      ws.on('error', (err: any) => {
        // eslint-disable-next-line no-console
        console.error(`WebSocket error for ${uid}:`, err);
      });
    } catch (err) {
      ws.close(4001, 'Token verification failed');
    }
  });

  return {
    // Broadcast a measurement to all connected clients subscribed to a sensor
    broadcastMeasurement: (sensorId: string, measurement: any) => {
      const msg: WSMessage = { type: 'measurement', data: { sensorId, ...measurement } };
      clients.forEach((session) => {
        if (session.subscribedSensors.has(sensorId)) {
          session.ws.send(JSON.stringify(msg));
        }
      });
    },

    // Broadcast an alert to all connected clients subscribed to a sensor
    broadcastAlert: (sensorId: string, alert: any) => {
      const msg: WSMessage = { type: 'alert', data: { sensorId, ...alert } };
      clients.forEach((session) => {
        if (session.subscribedSensors.has(sensorId)) {
          session.ws.send(JSON.stringify(msg));
        }
      });
    },
  };
}
