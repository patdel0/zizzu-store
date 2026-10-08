package com.zizzu.products;

import com.zizzu.products.dto.Request;
import com.zizzu.products.dto.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
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

    @ServiceConnection
    static MySQLContainer mySQLContainer = new MySQLContainer("mysql:latest");

    @BeforeEach
    public void setUp() {
        client = RestTestClient.bindToServer()
                .baseUrl("http://localhost:" + port)
                .build();

    }

    @Test
    void shouldReturnOkWhenProductCreated () {
        EntityExchangeResult<Response> result = client.post()
                .uri("/products")
                .header("Content-Type", "application/json")
                .body(new Request("Tenis 40/41","Adidas"))
                .exchange()
                .returnResult(Response.class);

        Integer id = result.getResponseBody().id();
        Product product = productRepository.findById(id).orElseThrow();

        assertEquals(HttpStatus.CREATED , result.getStatus());
        assertEquals("Tenis 40/41", product.getName());
    }

    @Test
    void shouldReturnBadRequestWhenProductCreated() {
        EntityExchangeResult<Response> result = client.post()
                .uri("/products")
//                .header("Content-Type", "application/json")
                .body(new Request("", ""))
                .exchange()
//                .expectStatus().isBadRequest()
                .returnResult(Response.class);

        List<Product> products = productRepository.findAll();

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatus());
        assertEquals(1, products.size());

    }

    @Test
    void isTrue() {
        assertEquals(true, true);
    }
}
