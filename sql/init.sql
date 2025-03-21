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


