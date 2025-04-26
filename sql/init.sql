CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  email NVARCHAR(50) NOT NULL UNIQUE,
  first_name NVARCHAR(50),
  last_name NVARCHAR(50),
  username NVARCHAR(50) NOT NULL UNIQUE,
  password NVARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) ENGINE = InnoDB;
CREATE TABLE friend_requests (
  id INT NOT NULL AUTO_INCREMENT,
  from_user int REFERENCES users(id),
  to_user int REFERENCES users(id),
  status VARCHAR(100) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) ENGINE = InnoDB;
CREATE TABLE chat_groups (
  id INT NOT NULL AUTO_INCREMENT,
  name NVARCHAR(200) NOT NULL,
  owner int REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) ENGINE = InnoDB;
CREATE TABLE group_users (
  id INT NOT NULL AUTO_INCREMENT,
  group_id INT REFERENCES chat_groups(id),
  user_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) ENGINE = InnoDB;
CREATE TABLE direct_messages (
  id INT NOT NULL AUTO_INCREMENT,
  from_user INT REFERENCES users(id),
  to_user INT REFERENCES users(id),
  content TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  attachment MEDIUMBLOB,
  attachment_type VARCHAR(50),
  attachment_name NVARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) ENGINE = InnoDB;
CREATE TABLE group_messages (
  id INT NOT NULL AUTO_INCREMENT,
  from_user INT REFERENCES users(id),
  group_id INT REFERENCES chat_groups(id),
  content TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  attachment MEDIUMBLOB,
  attachment_type VARCHAR(50),
  attachment_name NVARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
) ENGINE = InnoDB;