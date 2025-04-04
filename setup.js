const fs = require('fs');
const { execSync } = require('child_process');

// Create package.json
const packageJson = {
  name: "party-chat-screenshare",
  version: "1.0.0",
  main: "server.js",
  dependencies: {
    ws: "^8.0.0"
  },
  scripts: {
    start: "node server.js"
  }
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

// Create server.js
fs.writeFileSync('server.js', `const WebSocket = require('ws');
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

console.log('WebSocket server running on ws://localhost:3000');`);

// Create index.html
fs.writeFileSync('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Party Chat & Screenshare</title>
  <style>
    body { font-family: sans-serif; margin: 0; display: flex; flex-direction: column; height: 100vh; }
    #top { display: flex; padding: 1rem; gap: 2rem; }
    #chat, #screenshare { flex: 1; }
    #messages { height: 300px; overflow-y: scroll; border: 1px solid #ccc; margin-bottom: 0.5rem; padding: 0.5rem; }
    input[type="text"] { padding: 0.5rem; }
    button { padding: 0.5rem; margin-left: 0.5rem; }
    video { width: 100%; max-height: 400px; border: 1px solid #000; margin-top: 1rem; }
  </style>
</head>
<body>

  <div id="top">
    <div id="chat">
      <h2>Join a Party</h2>
      <input type="text" id="partyCode" placeholder="Enter Party Code" />
      <button onclick="joinParty()">Join</button>

      <h3>Chat</h3>
      <div id="messages"></div>
      <input type="text" id="chatInput" placeholder="Type a message..." />
      <button onclick="sendMessage()">Send</button>
    </div>

    <div id="screenshare">
      <h2>Screenshare</h2>
      <button onclick="startScreenShare()">Start Screenshare</button>
      <video id="screenVideo" autoplay playsinline></video>
    </div>
  </div>

  <script>
    let socket;
    let currentParty = "";

    function joinParty() {
      const code = document.getElementById('partyCode').value.trim();
      if (!code) return alert('Enter a party code');
      currentParty = code;

      socket = new WebSocket('ws://localhost:3000');

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'join', room: currentParty }));
      };

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'chat') {
          const div = document.createElement('div');
          div.textContent = msg.text;
          document.getElementById('messages').appendChild(div);
        }
      };
    }

    function sendMessage() {
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (text && socket && currentParty) {
        socket.send(JSON.stringify({ type: 'chat', room: currentParty, text }));
        input.value = '';
      }
    }

    async function startScreenShare() {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        document.getElementById('screenVideo').srcObject = stream;
      } catch (err) {
        alert('Error sharing screen: ' + err.message);
      }
    }
  </script>
</body>
</html>`);

// Install dependencies
console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Start the server
console.log('Starting server...');
execSync('npm start', { stdio: 'inherit' });
