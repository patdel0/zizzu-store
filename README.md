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

### Testing the application with OAuth

CSRF issues were encountered whilst testing POST/PUT/DELETE routes.
Spring boot security automatically requires the token to be provided with the requests by default.

Instead of deactivating it for development, the choice was made to keep it as is, but focus on
writing automated tests instead of manually testing it.

However, given that some scenarios require manual testing, below you'll find the commands you can
run in the terminal to test the routes accordingly.

### Getting the cookie and CSRF tokens

This will create the `cookies.txt` file which captures and saves the JSESSIONID which is typically generated in browser.
```bash
    TOKEN=$(curl -s -c cookies.txt localhost:8080/logout | sed -n 's/.*name="_csrf" type="hidden" value="\([^"]*\)".*/\1/p')
```

### Testing a route

Once the token and cookie is saved, you'll be able to interact with the endpoints by providing the `X-CSRF-TOKEN` header
in the requests.

```bash
curl -i -b cookies.txt -X POST localhost:8080/products -H "X-CSRF-TOKEN: $TOKEN" -H "Content-Type: application/json" -d '{"name": "updated", "details":"qwer"}'
```

## Cookies

The backend sets two cookies. The frontend sets none.

| Cookie | Set by | Purpose | `HttpOnly` | Readable by JS | Lifetime |
| --- | --- | --- | --- | --- | --- |
| `JSESSIONID` | Backend (Tomcat), at login | Identifies the logged-in session | Yes | No | Browser session |
| `XSRF-TOKEN` | Backend (Spring Security `csrf.spa()`), on any response that loads the token, such as `GET /products` | CSRF token. The frontend copies it into the `X-XSRF-TOKEN` header | No | Yes | Browser session |

The frontend sends one custom header, `X-XSRF-TOKEN`, on writes. 
It also uses `credentials: 'include'` so the browser attaches `JSESSIONID`.
