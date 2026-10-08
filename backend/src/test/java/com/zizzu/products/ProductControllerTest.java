package com.zizzu.products;

import com.zizzu.products.dto.Request;
import com.zizzu.products.dto.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.client.EntityExchangeResult;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;


import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public class ProductControllerTest {

    @LocalServerPort
    private int port;

    private RestTestClient client;
    @Autowired
    private ProductRepository productRepository;

    public EntityExchangeResult<Response> createProduct (String name, String details) {
        return client.post()
                .uri("/products")
                .header("Content-Type", "application/json")
                .body(new Request(name,details))
                .exchange()
                .returnResult(Response.class);
    }

    @ServiceConnection
    static MySQLContainer mySQLContainer = new MySQLContainer("mysql:latest");

    @BeforeEach
    public void setUp() {
        client = RestTestClient.bindToServer()
                .baseUrl("http://localhost:" + port)
                .build();

        productRepository.deleteAll();
    }

    @Test
    void shouldReturnOkWhenProductCreated () {
        EntityExchangeResult<Response> result = createProduct("Tenis 41/42", "Adidas");

        Integer id = result.getResponseBody().id();
        Product product = productRepository.findById(id).orElseThrow();

        assertEquals(HttpStatus.CREATED , result.getStatus());
        assertEquals("Tenis 41/42", product.getName());
    }

    @Test
    void shouldReturnBadRequestWhenFieldsAreEmpty() {
        EntityExchangeResult<Response> result = createProduct("", "");

        List<Product> products = productRepository.findAll();

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatus());
        assertEquals(0, products.size());
    }

    @Test
    void shouldReturnAllProducts () {
        createProduct("Tenis 41/42", "Adidas");

        List<Response> result = client.get()
                .uri("/products")
                .exchange()
                .returnResult(new ParameterizedTypeReference<List<Response>>() {
                }).getResponseBody();

        List<Response> products = productRepository.findAll()
                .stream()
                .map(Response::from)
                .toList();

        assertEquals(1, products.size());
        assertEquals(products, result);
    }

    @Test
    void shouldReturnProductById () {
        EntityExchangeResult<Response> productCreated = createProduct("Tenis 41/42", "Adidas");

        Integer id = productCreated.getResponseBody().id();

        EntityExchangeResult<Response> result = client.get()
                .uri("/products/" + id)
                .exchange()
                .returnResult(Response.class);

        assertEquals(productCreated.getResponseBody(), result.getResponseBody());


    }
}
