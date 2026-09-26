# Product detail page

Every storefront product links to `/products/{id}`. The page presents the product image, category, full description and benefits, current price, offer savings, stock availability, cart controls, and wishlist action. Wishlist IDs are stored in the current browser's local storage. Guests can browse details; cart and Buy now actions prompt them to sign in.

**Buy now** opens checkout for only that product and does not change the existing cart. Checkout reuses the saved-address selector and Razorpay/COD options. Addresses entered at checkout continue to be saved for later orders.

## API

- `GET /api/v1/products` — product list used by the storefront.
- `GET /api/v1/products/get?id={id}` — product detail. Missing or invalid IDs return an error.
- `POST /api/v1/orders` accepts optional `productId` to order that one product directly; without it, checkout uses the user's cart.
- Both read responses include `quantity` for availability display. Cost `price` is only returned to admins.
- Product mutations remain under the authenticated API routes.

Availability is based on the saved catalog quantity. The products schema defaults quantity to `0`, so older or manually inserted products with no inventory value must have stock entered from **Admin → Catalog → Edit** before checkout will accept them.

The detail page uses the existing product and cart APIs; it does not add a separate product model or duplicate product data.
