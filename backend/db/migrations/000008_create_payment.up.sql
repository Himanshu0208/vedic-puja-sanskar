CREATE TYPE payment_method AS ENUM ('CARD', 'UPI', 'NETBANKING', 'WALLET', 'COD');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');


CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'PENDING',
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  remarks TEXT,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);