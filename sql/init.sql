CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE,
  username VARCHAR(100) UNIQUE,
  password VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE friend_requests (
  id SERIAL PRIMARY KEY,
  from_user int REFERENCES users(id),
  to_user int REFERENCES users(id),
  status VARCHAR(100) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
