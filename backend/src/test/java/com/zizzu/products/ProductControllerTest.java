package com.zizzu.products;

import com.zizzu.products.dto.Request;
import com.zizzu.products.dto.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.client.EntityExchangeResult;
import org.springframework.test.web.servlet.client.RestTestClient;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;


import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

@SpringBootTest
@Testcontainers
@WithMockUser(authorities = "write")
public class ProductControllerTest {

    private RestTestClient client;
    @Autowired
    private WebApplicationContext context;

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
        MockMvc mvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .defaultRequest(get("/").with(csrf()))
                .build();

        client = RestTestClient.bindTo(mvc)
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
    void shouldReturnFirstTenProducts () {
        for (int n = 1; n <= 20; n++) {
            createProduct("Product " + n, "Details " + n);
        }

        List<Response> result = client.get()
                .uri("/products")
                .exchange()
                .returnResult(new ParameterizedTypeReference<List<Response>>() {
                }).getResponseBody();

        assertEquals(10, result.size());
        assertEquals("Product 1", result.get(0).name());
        assertEquals("Product 10", result.get(9).name());
    }

    @Test
    void shouldReturnNProducts () {
        for (int n = 1; n <= 20; n++) {
            createProduct("Product " + n, "Details " + n);
        }

        List<Response> result = client.get()
                .uri("/products?page=1&size=5")
                .exchange()
                .returnResult(new ParameterizedTypeReference<List<Response>>() {
                }).getResponseBody();

        assertEquals(5, result.size());
        assertEquals("Product 6", result.get(0).name());
        assertEquals("Details 10", result.get(4).details());
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

    @Test
    void shouldReturnUpdatedProduct() {
        EntityExchangeResult<Response> createdProduct = createProduct("Tenis 41/42", "Adidas");

        Integer id = createdProduct.getResponseBody().id();

        EntityExchangeResult<Response> updatedProduct = client.put()
                .uri("/products/" + id)
                .header("Content-Type", "application/json")
                .body(new Request("T-shirt M", "Nike"))
                .exchange()
                .returnResult(Response.class);

        Product product = productRepository.findById(id).orElseThrow();

        assertEquals(HttpStatus.OK, updatedProduct.getStatus());
        assertNotEquals(updatedProduct.getResponseBody(), createdProduct.getResponseBody());
        assertEquals("T-shirt M", product.getName());
    }

    @Test
    void shouldReturnProductDeletion () {
        EntityExchangeResult<Response> createdProduct = createProduct("Tenis 41/42", "Adidas");

        Integer id = createdProduct.getResponseBody().id();

        EntityExchangeResult<String> deletedProduct = client.delete()
                .uri("/products/" + id)
                .exchange()
                .returnResult(String.class);

        boolean  product = productRepository.existsById(id);

        assertFalse(product);
    }
}
