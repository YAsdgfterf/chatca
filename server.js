const express = require('express');
const WebSocket = require('ws');
const { v4: uuid } = require('uuid');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const port = 3000;
const streams = {}; // { shareCode: { sender: ws, viewers: [ws, ws...] } }

app.use(express.static('public'));

app.get('/share/:code', (req, res) => {
  res.sendFile(__dirname + '/public/viewer.html');
});

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.type === 'start') {
      const code = uuid().slice(0, 6);
      ws.shareCode = code;
      streams[code] = { sender: ws, viewers: [] };
      ws.send(JSON.stringify({ type: 'code', code }));

    } else if (data.type === 'view' && data.code) {
      const stream = streams[data.code];
      if (stream && stream.sender.readyState === WebSocket.OPEN) {
        stream.viewers.push(ws);
        stream.sender.send(JSON.stringify({ type: 'viewer-joined' }));
        ws.shareCode = data.code;
      }
    } else if (data.type === 'offer' || data.type === 'answer' || data.type === 'candidate') {
      const code = ws.shareCode;
      const stream = streams[code];
      if (!stream) return;

      if (data.type === 'offer') {
        stream.viewers.forEach(v => v.send(JSON.stringify(data)));
      } else if (data.type === 'answer') {
        stream.sender.send(JSON.stringify(data));
      } else if (data.type === 'candidate') {
        (ws === stream.sender ? stream.viewers : [stream.sender]).forEach(peer => {
          if (peer.readyState === WebSocket.OPEN) peer.send(JSON.stringify(data));
        });
      }
    }
  });

  ws.on('close', () => {
    const code = ws.shareCode;
    if (code && streams[code]) {
      streams[code].viewers.forEach(v => v.close());
      delete streams[code];
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
