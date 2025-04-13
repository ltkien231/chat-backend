# Chat backend for Software Architecture course

login flow:

- local.strategy:validate() -> authService:validateUser() - attach user info to req -> auth.controller:login() -> auth.service:login(): return jwt


## Use cases

### 1. Make friend
![Chat Flow Diagram](/docs/images/chat-flow.png)

The chat functionality uses WebSockets for real-time communication between users. The flow works as follows:

1. Users authenticate with JWT tokens when establishing WebSocket connections
2. Only friends can exchange direct messages
3. Messages are delivered in real-time if the recipient is online
4. The system handles error cases such as when users are not friends or when recipients are offline

For detailed WebSocket API documentation, see [WebSocket Documentation](/docs/websocket.md).


### 2. Chat

![Make Friend Flow Diagram](/docs/images/make-friend-flow.png)

The friend request functionality allows users to connect with each other. The flow works as follows:

1. Users can send friend requests to other users via the API
2. Recipients receive real-time notifications through WebSockets when they're online
3. Recipients can accept or reject friend requests
4. Once accepted, users become friends and can exchange direct messages

For detailed API documentation on friend requests, see the WebSocket documentation.
