# API Dokumentation

Socket.io användning:
```javascript
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js"></script>
<script>
  const socket = io('https://ec3c1d00.ngrok.io'); //min lokala dator, ska senare vara https://api.dothemath.app
  
  socket.on('connect', () => {
    socket.emit('send_message', 'Message from the web');
  });
</script>
```