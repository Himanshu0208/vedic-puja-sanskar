# Admin dashboard

The admin area is available from the sidebar at `/admin/dashboard`. It includes overview, users, orders, catalog, reports, and feedback sections.

## Sections

- **Dashboard** — paid-revenue and COD/online order-count donut charts, recent orders, customer/product totals, and outstanding COD to collect. Hover a chart segment to see its value and share.
- **Users** — account email, role, join date, and order count. The API never returns password hashes.
- **Orders** — latest 100 orders with customer, amount, payment state, and fulfilment state. This view is read-only; admin delivery-status updates are not implemented.
- **Catalog** — search and filter the product collection, add or edit items, and review selling prices, stock, estimated per-item earnings, gross margin percentage, and customer discount percentage. Earnings use the offer price when set (otherwise selling price) minus product cost; margin is earnings divided by effective selling price, and discount is the reduction from listed selling price. Payment, shipping, and other expenses are excluded. “Catalog” is the admin-facing label; storefront wording remains “Products.”
- **Reports** — captured payment revenue, an order-status donut, paid order average, outstanding COD receivable, and a six-month revenue chart grouped by order creation month.
- **Feedback** — currently an empty-state page. The storefront does not yet collect or store customer feedback, so there is no feedback API or moderation workflow.

## API

All endpoints require authentication and an `admin` role. They use the existing access-token cookie.

| Endpoint | Response |
|---|---|
| `GET /api/v1/admin/users` | Array of `{ id, email, role, createdAt, orderCount }`. |
| `GET /api/v1/admin/orders` | Up to 100 newest `{ orderId, customerEmail, status, paymentStatus, paymentMethod, totalAmount, currency, createdAt }` rows. |
| `GET /api/v1/admin/reports` | `{ customers, products, orders, paidOrders, codOrders, razorpayOrders, cancelledOrders, returnedOrders, otherOrders, pendingOrders, deliveredOrders, revenue, codRevenue, razorpayRevenue, codReceivable, codReceivableOrders, monthlyRevenue, orderStatuses: [{ status, count }] }`. |

Reports are calculated from current database records. `codOrders` and `razorpayOrders` count all orders with those payment methods, including cancelled and returned orders, so the dashboard payment-method donut remains independent from order status. `otherOrders` counts legacy orders without a payment record. `orderStatuses` groups every order into its current fulfilment state; RTO and completed customer returns are shown as `RETURNED`, while requested, approved, or picked returns are shown as `RETURN_IN_PROGRESS`. `revenue` sums successful payment records in INR and is split into `codRevenue` and `razorpayRevenue`. `codReceivable` sums non-cancelled COD orders whose payment is pending, and remains outstanding until a collection is recorded. Taxes and shipping charges are not included.

## Current gaps

Feedback collection and moderation, COD collection recording, order fulfilment controls, user role/account management, and CSV/PDF exports are not implemented. The dashboard presents data that already exists and does not mutate users, orders, or products.
