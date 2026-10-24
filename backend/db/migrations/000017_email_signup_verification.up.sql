CREATE TABLE pending_signups (
    email VARCHAR(255) PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    gender VARCHAR(32) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    code_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
