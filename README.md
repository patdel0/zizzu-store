# Zizzu e-commerce

## Requirements

- Maven (`sudo apt install maven`)
- Docker
- JDK 17

## Getting started

### Set up

``` bash
./script/setup
```

### Running the server

``` bash
./script/server
```

### Lint checks and tests

``` bash
./script/test {backend,frontend}
```

### Format

You will likely want to automatically format your code to satisfy the linter. When that happens, run:

``` bash
./script/format {backend,frontend}
```

### Services 

- Java server: http://localhost:8080
- MySQL: jdbc:mysql://127.0.0.1:3307/mydatabase
- React server: http://localhost:5173

### Creating new routes

If you're creating a new public route/endpoint for the application, make sure to add it to the `PUBLIC_GET_ROUTES` in `SecurityConfig.java`. 

### Testing the Backend

For manual testing: 
1. Open [Swagger UI](http://localhost:8080/swagger-ui.html)
2. Sign in through the existing Google login
3. Choose an endpoint you want to test 
4. Click "Try it now"

## Cookies

The backend sets two cookies. The frontend sets none.

| Cookie | Set by | Purpose | `HttpOnly` | Readable by JS | Lifetime |
| --- | --- | --- | --- | --- | --- |
| `JSESSIONID` | Backend (Tomcat), at login | Identifies the logged-in session | Yes | No | Browser session |
| `XSRF-TOKEN` | Backend (Spring Security `csrf.spa()`), on any response that loads the token, such as `GET /products` | CSRF token. The frontend copies it into the `X-XSRF-TOKEN` header | No | Yes | Browser session |

The frontend sends one custom header, `X-XSRF-TOKEN`, on writes. 
It also uses `credentials: 'include'` so the browser attaches `JSESSIONID`.
