CREATE TABLE IF NOT EXISTS cart (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     SERIAL NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  SERIAL NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INT NOT NULL,
    price       DECIMAL(10, 2) NOT NULL,
    offer_price DECIMAL(10, 2) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product_id ON cart(product_id);