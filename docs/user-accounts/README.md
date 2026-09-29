# User accounts

## Signup and profile

Signup collects `fullName`, `phone`, `gender`, `email`, and `password`. Gender values are `male`, `female`, `other`, and `prefer_not_to_say`. The profile page allows changing the name and phone; email is read-only. Gender is set at signup and becomes read-only after it is saved. Accounts created before these fields existed have blank values from migration defaults; users can fill in their name and phone and set gender once in the profile page.

| Method | Endpoint | Request / response |
| --- | --- | --- |
| POST | `/api/v1/auth/signup` | `{ fullName, phone, gender, email, password }`; returns the normal auth response |
| GET | `/api/v1/auth/profile` | Returns `{ id, fullName, phone, gender, email, role }` |
| PUT | `/api/v1/auth/profile` | `{ fullName, phone, gender? }`; gender is only written when the saved value is blank; returns the updated profile |

## Wishlist

Wishlist product IDs are stored per account in `user_wishlist`; deleting the user or product cascades its entries. Product details are fetched from the catalog when the profile page displays the wishlist.

| Method | Endpoint | Request / response |
| --- | --- | --- |
| GET | `/api/v1/auth/wishlist` | Returns a list of product IDs |
| POST | `/api/v1/auth/wishlist` | `{ productId }`; adds the item idempotently |
| DELETE | `/api/v1/auth/wishlist?productId=ID` | Removes that item; returns 204 |

## Saved addresses

All address operations use the authenticated user's ID from the access token. Update and delete are constrained by both address ID and user ID. Orders retain a shipping address snapshot, so editing or deleting a saved address does not alter existing orders.

| Method | Endpoint | Request / response |
| --- | --- | --- |
| GET | `/api/v1/addresses` | Returns the user's saved address list |
| POST | `/api/v1/addresses` | Shipping address fields; returns the created address |
| PUT | `/api/v1/addresses/{id}` | Shipping address fields; returns the updated address |
| DELETE | `/api/v1/addresses/{id}` | Deletes the user's address; returns 204 |

Address request fields: `fullName`, `phone`, `line1`, `line2`, `city`, `state`, `postalCode`, and two-letter `country` code.
