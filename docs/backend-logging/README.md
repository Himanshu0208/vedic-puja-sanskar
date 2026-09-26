# Backend request logs

The Go server writes one JSON log entry per HTTP request to `backend/logs/backend.log` when started from the `backend` directory. Entries are appended and also printed to the server terminal.

Each request entry includes method, URL path (without query parameters), status, duration in milliseconds, `user_id`, `client_ip`, and `user_agent`. Requests without a valid authenticated identity use `user_id: "anonymous"`. The user agent can indicate a browser or device class, but it is client supplied and does not uniquely identify a physical device.

The server uses the connection's remote address for `client_ip`; forwarded IP headers are not trusted. Log directory permissions are set to `0700` and the log file to `0600` because logs contain user identifiers and IP addresses. The file currently appends without automatic rotation.
