package com.zizzu.taxonomies;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import com.zizzu.taxonomies.dto.TaxonomyRequest;
import com.zizzu.taxonomies.dto.TaxonomyResponse;
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
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

@SpringBootTest
@Testcontainers
@WithMockUser(authorities = "write")
public class TaxonomyControllerTest {
  private RestTestClient client;

  @Autowired private WebApplicationContext context;

  @Autowired private TaxonomyRepository taxonomyRepository;

  public EntityExchangeResult<TaxonomyResponse> createTaxonomy(String name) {
    return client
        .post()
        .uri("/taxonomies")
        .header("Content-Type", "application/json")
        .body(new TaxonomyRequest(name))
        .exchange()
        .returnResult(TaxonomyResponse.class);
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

    taxonomyRepository.deleteAll();
  }

  @Nested
  class CreateTaxonomy {
    @Test
    void shouldReturnCreatedWhenTaxonomyCreated() {
      EntityExchangeResult<TaxonomyResponse> result = createTaxonomy("Cotton");

      Integer id = result.getResponseBody().id();
      Taxonomy taxonomy = taxonomyRepository.findById(id).orElseThrow();

      assertEquals((HttpStatus.CREATED), result.getStatus());
      assertEquals("Cotton", taxonomy.getName());
    }

    @Test
    void shouldReturnBadRequestWhenFieldsAreEmpty() {
      EntityExchangeResult<TaxonomyResponse> result = createTaxonomy("");

      List<Taxonomy> taxonomies = taxonomyRepository.findAll();

      assertEquals(HttpStatus.BAD_REQUEST, result.getStatus());
      assertEquals(0, taxonomies.size());
    }
  }

  @Nested
  class GetTaxonomy {
    @Test
    void shouldReturnTaxonomyById() {
      EntityExchangeResult<TaxonomyResponse> taxonomyCreated = createTaxonomy("Lingerie");

      Integer id = taxonomyCreated.getResponseBody().id();

      EntityExchangeResult<TaxonomyResponse> result =
          client.get().uri("/taxonomies/" + id).exchange().returnResult(TaxonomyResponse.class);

      assertEquals(taxonomyCreated.getResponseBody(), result.getResponseBody());
    }
  }

  @Nested
  class ListTaxonomies {
    @BeforeEach
    void setUp() {
      for (int n = 1; n <= 30; n++) {
        createTaxonomy("Lingerie " + n);
      }
    }

    @Test
    void shouldHandlePaginationParams() {
      List<TaxonomyResponse> result =
          client
              .get()
              .uri("/taxonomies?page=1&size=10")
              .exchange()
              .returnResult(new ParameterizedTypeReference<List<TaxonomyResponse>>() {})
              .getResponseBody();

      assertEquals(10, result.size());
      assertEquals("Lingerie 11", result.get(0).name());
      assertEquals("Lingerie 20", result.get(9).name());
    }

    @Test
    void shouldReturnAllTaxonomies() {
      List<TaxonomyResponse> result =
          client
              .get()
              .uri("/taxonomies")
              .exchange()
              .returnResult(new ParameterizedTypeReference<List<TaxonomyResponse>>() {})
              .getResponseBody();

      List<TaxonomyResponse> taxonomies =
          taxonomyRepository.findAll().stream().map(TaxonomyResponse::from).toList();

      assertEquals(30, taxonomies.size());
      assertEquals(taxonomies, result);
    }
  }

  @Nested
  class UpdateTaxonomy {
    @Test
    void shouldReturnUpdatedTaxonomy() {
      EntityExchangeResult<TaxonomyResponse> createdTaxonomy = createTaxonomy("Cotton");

      Integer id = createdTaxonomy.getResponseBody().id();

      EntityExchangeResult<TaxonomyResponse> updatedTaxonomy =
          client
              .put()
              .uri("/taxonomies/" + id)
              .header("Content-Type", "application/json")
              .body(new TaxonomyRequest("Setin"))
              .exchange()
              .returnResult(TaxonomyResponse.class);

      Taxonomy taxonomy = taxonomyRepository.findById(id).orElseThrow();

      assertEquals(HttpStatus.OK, updatedTaxonomy.getStatus());
      assertNotEquals(updatedTaxonomy.getResponseBody(), createdTaxonomy.getResponseBody());
      assertEquals("Setin", taxonomy.getName());
    }
  }

  @Nested
  class DeleteTaxonomy {

    @Test
    void shouldReturnTaxonomyDeletion() {
      EntityExchangeResult<TaxonomyResponse> createdTaxonomy = createTaxonomy("Cotton");

      Integer id = createdTaxonomy.getResponseBody().id();

      EntityExchangeResult<String> deletedTaxonomy =
          client.delete().uri("/taxonomies/" + id).exchange().returnResult(String.class);

      boolean taxonomy = taxonomyRepository.existsById(id);

      assertFalse(taxonomy);
    }
  }
}
