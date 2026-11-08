# Authentication, CSRF and cookies

How a write request (POST, PUT, DELETE) is checked by the backend, and which
cookies the app uses. Rules live in `SecurityConfig.java`.

## What the backend checks

```mermaid
flowchart TD
    A[Request arrives] --> P{Preflight OPTIONS?}
    P -- Yes --> O{Origin in app.cors.origins?}
    O -- Yes --> R1[200 with Allow-Origin, Allow-Credentials, Allow-Headers]
    O -- No --> R2[403 Forbidden]
    P -- No --> G{Public GET route?}
    G -- Yes --> R3[200 and Set-Cookie XSRF-TOKEN]
    G -- No --> C{Header X-XSRF-TOKEN equals XSRF-TOKEN cookie?}
    C -- No --> R4[403 Forbidden - CSRF check failed]
    C -- Yes --> S{Valid JSESSIONID session?}
    S -- No --> R5[302 redirect to Google login]
    S -- Yes --> W{User has write authority?}
    W -- No --> R6[403 Forbidden]
    W -- Yes --> R7[Controller runs - 201 Created]
```

## Why a CSRF token

The browser attaches cookies to every request to the backend, including ones triggered by another site. The session cookie alone therefore cannot tell a
real request from a forged one. A forged request cannot read the `XSRF-TOKEN` cookie, so it cannot copy it into the header, and the backend rejects it with a 403.
