export interface DbConfig {
  host: string;
  port: number;
  dbName: string;
  username: string;
  password: string;
}

export interface SocketClient {
  userId: number;
  username: string;
  clientId: string;
}

export interface DirectMessage {
  toUser: string; // username of the recipient
  content: string;
  attachment?: string; // Base64 encoded image data
  attachmentType?: string; // MIME type of the attachment (e.g., 'image/png', 'image/jpeg')
}

export interface GroupMessage {
  groupId: number; // ID of the group
  content: string;
  attachment?: string; // Base64 encoded image data
  attachmentType?: string; // MIME type of the attachment (e.g., 'image/png', 'image/jpeg')
}

export interface SearchUserQuery {
  username?: string;
  email?: string;
}
