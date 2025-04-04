const socket = new WebSocket(`ws://${location.host}`);
let pc;

socket.onmessage = async (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'code') {
    const link = `${location.origin}/share/${data.code}`;
    document.getElementById('link').innerHTML = `Share this link: <a href="${link}" target="_blank">${link}</a>`;
  } else if (data.type === 'viewer-joined') {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.send(JSON.stringify({ type: 'offer', offer }));
  } else if (data.type === 'answer') {
    await pc.setRemoteDescription(data.answer);
  } else if (data.type === 'candidate') {
    pc.addIceCandidate(data.candidate);
  }
};

async function startShare() {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  pc = new RTCPeerConnection();

  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socket.send(JSON.stringify({ type: 'candidate', candidate: e.candidate }));
    }
  };

  socket.send(JSON.stringify({ type: 'start' }));
}
