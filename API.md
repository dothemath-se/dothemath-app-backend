<!-- markdownlint-disable MD024 -->

# API documentation

Enabling Socket.IO in frontend:

```javascript
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js"></script>

<script>
  const socket = io('https://api.dothemath.app');  // URL to backend
  
  socket.on('connect', () => {
    socket.emit('send_message', { text: 'Message from the web!' });
  });
</script>
```

## Methods

### establish_session

Call once per question/session. Calling it again will result in a new thread on Slack.

#### input

Name | Type | Required | Description
--- | --- | --- | ---
studentName | string | * | Nickname of student
channelId | string | * | Channel ID

#### output

None.

#### example client code

```javascript
socket.emit('establish_session', {
  studentName: 'MyNickName',
  channelId: 'C011ENW7TJQ'
});
```

___

### get_channels

Get the list of all available Slack channels. Takes a callback which receives an array of channel objects:

#### input

None.

#### output

Name | Type | Description
--- | --- | ---
name | string | Channel name
id | string | Channel ID

#### example client code

```javascript
socket.emit('get_channels', channels => {
  channels.forEach(channel => {
    console.log(`${channel.id}: ${channel.name}`)
  });
});
```

___

### send_message

#### input

Name | Type | Required | Description
--- | --- | --- | ---
text | string | * | Message text
image | ArrayBuffer | |

#### output

None.

#### example client code

```javascript
socket.emit('send_message', { text: 'Message from the web!' });
```

___

### reestablish_session

Reestablishes a previous session/conversation by fetching messages from Slack. Takes a callback which receives username and messages.

#### input

Name | Type | Required | Description
--- | --- | --- | ---
threadId | string | * | Slack Thread Id
channelId | string | * | Channel ID

#### output

None.

#### example client code

```javascript
socket.emit('reestablish_session', {
  threadId: '1258750862.012300',
  channelId: 'C011ENW7ABC'
}, { name, messages} => {
  console.log(name);
  messages.forEach(message => {
    console.log(message);
  });
});
```

___

## Events

### message

#### output

Name | Type | Description
--- | --- | ---
text | string | Message text
name | string | Message sender
avatar | string | Message sender profile image URL
image | string | Message attached image URL (if there is one)

#### example client code

```javascript
socket.on('message', ({text, name}) => {
  console.log(`${name}: ${text}`);
});
```
