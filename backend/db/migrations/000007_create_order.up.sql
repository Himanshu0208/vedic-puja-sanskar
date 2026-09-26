CREATE TYPE order_status AS ENUM ('placed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  status order_status NOT NULL DEFAULT 'placed',
  total_price DECIMAL(10, 2) NOT NULL,
  discount_price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id),
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL, -- purchase-time price, product table ka price change hone se ye affect nahi hoga
  created_at TIMESTAMP DEFAULT NOW()
);
