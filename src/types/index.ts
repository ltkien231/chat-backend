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
