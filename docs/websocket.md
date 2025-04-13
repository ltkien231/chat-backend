# WebSocket Documentation

This document outlines the WebSocket endpoints available in the application.

## Authentication

WebSocket connections require authentication using a JWT token. The token should be provided as a query parameter when establishing the connection:

```javascript
const socket = io('http://your-server-url', {
  auth: {
    token: 'your-jwt-token' // from api /login
  }
});
```

The server verifies the token and extracts user information (userId and username) to maintain a list of connected clients.

## Connection Events

| Event | Description |
|-------|-------------|
| `connect` | Triggered when connection is established |
| `disconnect` | Triggered when client disconnects |

## Client-to-server Endpoints

### 1. Direct Message Endpoint

**Purpose**: Send direct messages between users who are friends.

**Event Name**: `directMessage`

**Request**:

```javascript
socket.emit('directMessage', {
  content: 'Hello there!',  // Message content
  toUser: 'username'        // Username of recipient
});
```

**Response (Success)**:
The message is forwarded to the recipient with event name `directMessage`:

```javascript
{
  content: 'Hello there!',     // Message content
  fromUser: 'senderUsername'   // Username of sender
}
```

**Response (Error - User not a friend)**:
If users are not friends, sender receives an error:

```javascript
{
  msg_topic: 'directMessage',
  msg_type: 'error',
  msg: {
    error_type: 'not_friend',
    error_msg: 'You are not friends with this user'
  }
}
```

**Response (Error - User offline)**:
If recipient is offline, the message is not delivered and may be stored for later notification.

## Server-to-client Endpoints

### 1. Direct message Notification

**Response (Success)**:

**Purpose**: Notify users about direct message in real-time.

**Event Name**: `directMessage`

**Event Format**:

```javascript
{
  content: 'Hello there!',     // Message content
  fromUser: 'senderUsername'   // Username of sender
}
```

**Client Implementation**:

```javascript
socket.on('directMessage', (data) => {
  // Handle message
  // - show message on chat box
});
```

### 2. Friend Request Notification

**Purpose**: Notify users about friend requests in real-time.

**Event Name**: `friendRequest`

**Note**: This is not a direct WebSocket endpoint but a server-emitted event when a friend request is sent via HTTP API.

**Event Format**:

```javascript
{
  content: 'username sent you a friend request',
  fromUser: {
    id: 'username',  
    name: 'username'
  }
}
```

**Client Implementation**:

```javascript
socket.on('friendRequest', (data) => {
  // Handle the friend request notification
  // - show friend request
  // - allow user to accept friend request using /friends/requests/accept
  console.log(`New friend request from ${data.fromUser.name}: ${data.content}`);
});
```

## Implementation Notes

- The WebSocket server uses Redis for adapter implementation, enabling horizontal scaling.
- Cross-Origin Resource Sharing (CORS) is enabled for all origins in the WebSocket gateway.
- The application maintains a list of connected clients with their user information and client IDs.
