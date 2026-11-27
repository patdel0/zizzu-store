package com.zizzu.products;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import com.zizzu.products.dto.ProductRequest;
import com.zizzu.products.dto.ProductResponse;
import com.zizzu.products.dto.ProductVariantRequest;
import com.zizzu.taxonomies.Taxonomy;
import com.zizzu.taxonomies.TaxonomyRepository;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
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
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

@SpringBootTest
@Testcontainers
@WithMockUser(authorities = "write")
public class ProductControllerTest {

  private RestTestClient client;
  @Autowired private WebApplicationContext context;

  @Autowired private ProductRepository productRepository;

  @Autowired private TaxonomyRepository taxonomyRepository;

  @Autowired private ProductVariantRepository productVariantRepository;

  public EntityExchangeResult<ProductResponse> createProduct(String name, String details) {
    return createProduct(name, details, null, null);
  }

  public EntityExchangeResult<ProductResponse> createProduct(String name, String details, List<Integer> taxonomies) {
    return createProduct(name, details, taxonomies, null);
  }

  public EntityExchangeResult<ProductResponse> createProduct(
      String name, String details, List<Integer> taxonomyIds, List<ProductVariantRequest> variants) {
    return client
        .post()
        .uri("/products")
        .header("Content-Type", "application/json")
        .body(new ProductRequest(name, details, taxonomyIds, variants))
        .exchange()
        .returnResult(ProductResponse.class);
  }

  public EntityExchangeResult<ProductResponse> updateProduct(
      Integer id, String name, String details, List<Integer> taxonomyIds, List<ProductVariantRequest> variants) {
    return client
        .put()
        .uri("/products/" + id)
        .header("Content-Type", "application/json")
        .body(new ProductRequest(name, details, taxonomyIds, variants))
        .exchange()
        .returnResult(ProductResponse.class);
  }

  @ServiceConnection static MySQLContainer mySQLContainer = new MySQLContainer("mysql:latest");

  @BeforeEach
  public void setUp() {
    MockMvc mvc =
        MockMvcBuilders.webAppContextSetup(context)
            .apply(springSecurity())
            .defaultRequest(get("/").with(csrf()))
            .build();

    client = RestTestClient.bindTo(mvc).build();

    productRepository.deleteAll();
  }

  @Test
  void shouldReturnOkWhenProductCreated() {
    EntityExchangeResult<ProductResponse> result = createProduct("Tenis 41/42", "Adidas");

    Integer id = result.getResponseBody().id();
    Product product = productRepository.findById(id).orElseThrow();

    assertEquals(HttpStatus.CREATED, result.getStatus());
    assertEquals("Tenis 41/42", product.getName());
  }

  @Test
  void shouldReturnBadRequestWhenFieldsAreEmpty() {
    EntityExchangeResult<ProductResponse> result = createProduct("", "");

    List<Product> products = productRepository.findAll();

    assertEquals(HttpStatus.BAD_REQUEST, result.getStatus());
    assertEquals(0, products.size());
  }

  @Test
  void shouldReturnFirstTenProducts() {
    for (int n = 1; n <= 20; n++) {
      createProduct("Product " + n, "Details " + n);
    }

    List<ProductResponse> result =
        client
            .get()
            .uri("/products")
            .exchange()
            .returnResult(new ParameterizedTypeReference<List<ProductResponse>>() {})
            .getResponseBody();

    assertEquals(10, result.size());
    assertEquals("Product 1", result.get(0).name());
    assertEquals("Product 10", result.get(9).name());
  }

  @Test
  void shouldReturnNProducts() {
    for (int n = 1; n <= 20; n++) {
      createProduct("Product " + n, "Details " + n);
    }

    List<ProductResponse> result =
        client
            .get()
            .uri("/products?page=1&size=5")
            .exchange()
            .returnResult(new ParameterizedTypeReference<List<ProductResponse>>() {})
            .getResponseBody();

    assertEquals(5, result.size());
    assertEquals("Product 6", result.get(0).name());
    assertEquals("Details 10", result.get(4).details());
  }

  @Transactional
  @Test
  void shouldReturnAllProducts() {
    createProduct("Tenis 41/42", "Adidas");
    createProduct("Lingerie Preta", "BBW");

    List<ProductResponse> result =
        client
            .get()
            .uri("/products")
            .exchange()
            .returnResult(new ParameterizedTypeReference<List<ProductResponse>>() {})
            .getResponseBody();

    List<ProductResponse> products =
        productRepository.findAll().stream().map(ProductResponse::from).toList();

    assertEquals(2, products.size());
    assertEquals(products, result);
  }

  @Test
  void shouldReturnProductById() {
    EntityExchangeResult<ProductResponse> productCreated = createProduct("Tenis 41/42", "Adidas");
    Integer id = productCreated.getResponseBody().id();

    EntityExchangeResult<ProductResponse> result =
        client.get().uri("/products/" + id).exchange().returnResult(ProductResponse.class);

    assertEquals(productCreated.getResponseBody(), result.getResponseBody());
  }

  @Test
  void shouldReturnUpdatedProduct() {
    EntityExchangeResult<ProductResponse> productCreated = createProduct("Tenis 41/42", "Adidas");

    Integer id = productCreated.getResponseBody().id();

    EntityExchangeResult<ProductResponse> updatedProduct =
        client
            .put()
            .uri("/products/" + id)
            .header("Content-Type", "application/json")
            .body(new ProductRequest("T-shirt M", "Nike", null, null))
            .exchange()
            .returnResult(ProductResponse.class);

    Product product = productRepository.findById(id).orElseThrow();

    assertEquals(HttpStatus.OK, updatedProduct.getStatus());
    assertNotEquals(updatedProduct.getResponseBody(), productCreated.getResponseBody());
    assertEquals("T-shirt M", product.getName());
  }

  @Test
  void shouldReturnProductDeletion() {
    EntityExchangeResult<ProductResponse> productCreated = createProduct("Tenis 41/42", "Adidas");

    Integer id = productCreated.getResponseBody().id();

    EntityExchangeResult<String> deletedProduct =
        client.delete().uri("/products/" + id).exchange().returnResult(String.class);

    boolean product = productRepository.existsById(id);

    assertFalse(product);
  }

  @Test
  void shouldCreateProductWithTaxonomy() {
    Taxonomy taxonomy = new Taxonomy();
    taxonomy.setName("Setin");
    Taxonomy savedTaxonomy = taxonomyRepository.save(taxonomy);

    EntityExchangeResult<ProductResponse> result =
        createProduct("Lingerie", "Victoria Secrets", List.of(savedTaxonomy.getId()));

    ProductResponse created = result.getResponseBody();

    assertEquals(HttpStatus.CREATED, result.getStatus());
    assertEquals(1, created.taxonomies().size());
    assertEquals("Setin", created.taxonomies().iterator().next().name());
  }

  @Test
  void shouldUpdateProductTaxonomies() {
    Taxonomy taxonomy = new Taxonomy();
    taxonomy.setName("Cotton");
    Taxonomy savedTaxonomy = taxonomyRepository.save(taxonomy);

    EntityExchangeResult<ProductResponse> productCreated =
        createProduct("Victoria Secrets", "Malevola", List.of(savedTaxonomy.getId()));

    Integer id = productCreated.getResponseBody().id();
    assertEquals(1, productCreated.getResponseBody().taxonomies().size());

    EntityExchangeResult<ProductResponse> updatedProduct =
        updateProduct(id, "T-shirt M", "Nike", new ArrayList<>(), null);

    assertEquals(HttpStatus.OK, updatedProduct.getStatus());
    assertEquals(0, updatedProduct.getResponseBody().taxonomies().size());
  }

  @Test
  void shouldAddTaxonomyToProduct() {
    Taxonomy taxonomy = new Taxonomy();
    taxonomy.setName("Nylon");
    Taxonomy savedTaxonomy = taxonomyRepository.save(taxonomy);

    EntityExchangeResult<ProductResponse> productCreated =
        createProduct("Victoria Secrets", "Malevola");
    Integer id = productCreated.getResponseBody().id();
    assertEquals(0, productCreated.getResponseBody().taxonomies().size());

    EntityExchangeResult<ProductResponse> updatedProduct =
        updateProduct(id, "Victoria Secrets", "Malevola", List.of(savedTaxonomy.getId()), null);

    assertEquals(HttpStatus.OK, updatedProduct.getStatus());
    assertEquals(1, updatedProduct.getResponseBody().taxonomies().size());
    assertEquals("Nylon", updatedProduct.getResponseBody().taxonomies().iterator().next().name());
  }

  @Nested
  class ListVariants {
    @BeforeEach
    void setUp() {
      Taxonomy taxonomy = new Taxonomy();
      taxonomy.setName("Setin");
      Taxonomy savedTaxonomy = taxonomyRepository.save(taxonomy);

      List<ProductVariantRequest> variants = List.of(
              new ProductVariantRequest(21.99, 4, "Black", "Extra Small"),
              new ProductVariantRequest(11.40, 2, "Red", "Medium"),
              new ProductVariantRequest(45.89, 11, "Nude", "Small")
      );
      EntityExchangeResult<ProductResponse> productCreated = createProduct("Victoria Secrets", "Lingerie", List.of(savedTaxonomy.getId()), variants);

    }
    @Test
    void shouldGetAllProductVariants() {
      List<ProductResponse> response =
              client
                      .get()
                      .uri("/products")
                      .exchange()
                      .returnResult(new ParameterizedTypeReference<List<ProductResponse>>() {})
                      .getResponseBody();

      List<ProductVariant> variants = productVariantRepository.findAll();

      assertEquals(3, variants.size());
      assertEquals(variants.size(),response.get(0).productVariants().size());
    }
  }
}
