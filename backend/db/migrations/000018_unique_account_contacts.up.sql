CREATE UNIQUE INDEX idx_users_email_normalized
    ON users (LOWER(BTRIM(email)));

CREATE UNIQUE INDEX idx_users_phone_normalized
    ON users ((CASE
        WHEN LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) = 10
            THEN '91' || REGEXP_REPLACE(phone, '[^0-9]', '', 'g')
        ELSE REGEXP_REPLACE(phone, '[^0-9]', '', 'g')
    END))
    WHERE phone IS NOT NULL AND REGEXP_REPLACE(phone, '[^0-9]', '', 'g') <> '';
