# API Dokumentation

Socket.io användning:
```javascript
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js"></script>
<script>
  const socket = io('https://ec3c1d00.ngrok.io'); //min lokala dator, ska senare vara https://api.dothemath.app
  
  socket.on('connect', () => {
    socket.emit('send_message', { text: 'Message from the web!' });
  });
</script>
```

## Metoder

### establish_session 

Name | Type | Required | Description
--- | --- | --- | ---
studentName | string | * |

```javascript
socket.emit('establish_session', { studentName: 'Jonathan' });
```
___

### send_message 

Name | Type | Required | Description
--- | --- | --- | ---
text | string | *

```javascript
socket.emit('send_message', { text: 'Message from the web!' });
```
___

## Events

### message

Name | Type | Description
--- | --- | ---
text | string | 
name | string | Meddelandets avsändare

```javascript
socket.on('message', ({text, name}) => {
  console.log(`${name}: ${text}`);
});
```

### channel_list

Eventet sker efter att socketen connectat. Skickar en array med object av formen:
Name | Type | Description
--- | --- | ---
name | string | 
id | string | 

```javascript
socket.on('channel_list', channels => {
  channels.forEach(channel => {
    console.log(`${channel.id}: ${channel.name}`)
  });
});
```