// server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

const rooms = {};

wss.on('connection', (ws) => {
  let joinedRoom = '';

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'join') {
        joinedRoom = data.room;
        if (!rooms[joinedRoom]) rooms[joinedRoom] = [];
        rooms[joinedRoom].push(ws);
      }

      if (data.type === 'chat' && joinedRoom) {
        const msg = JSON.stringify({ type: 'chat', text: data.text });
        rooms[joinedRoom].forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
          }
        });
      }
    } catch (e) {
      console.error('Failed to parse:', message);
    }
  });

  ws.on('close', () => {
    if (joinedRoom && rooms[joinedRoom]) {
      rooms[joinedRoom] = rooms[joinedRoom].filter(client => client !== ws);
    }
  });
});

console.log('WebSocket server running on ws://localhost:3000');
