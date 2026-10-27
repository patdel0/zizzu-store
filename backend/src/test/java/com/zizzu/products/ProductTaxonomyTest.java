package com.zizzu.products;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Testcontainers
@Transactional
class ProductTaxonomyTest {

  @ServiceConnection static MySQLContainer mySQLContainer = new MySQLContainer("mysql:latest");

  @Autowired private ProductRepository productRepository;
  @Autowired private TaxonomyRepository taxonomyRepository;
  @Autowired private EntityManager entityManager;
  @Autowired private JdbcTemplate jdbcTemplate;

  private Product product(String name) {
    Product product = new Product();
    product.setName(name);
    product.setDetails("details");
    product.setSku(name);
    return productRepository.save(product);
  }

  private Taxonomy taxonomy(String name) {
    Taxonomy taxonomy = new Taxonomy();
    taxonomy.setName(name);
    return taxonomyRepository.save(taxonomy);
  }

  private void flushAndClear() {
    entityManager.flush();
    entityManager.clear();
  }

  private int joinRows(Integer productId) {
    return jdbcTemplate.queryForObject(
        "select count(*) from product_taxonomy where product_id = ?", Integer.class, productId);
  }

  @Test
  void shouldPersistManyTaxonomiesOnAProduct() {
    Product shoes = product("shoes");
    shoes.addTaxonomy(taxonomy("footwear"));
    shoes.addTaxonomy(taxonomy("sport"));
    flushAndClear();

    Product found = productRepository.findById(shoes.getId()).orElseThrow();

    assertEquals(2, found.getTaxonomies().size());
    assertEquals(2, joinRows(shoes.getId()));
  }

  @Test
  void shouldShareOneTaxonomyAcrossManyProducts() {
    Taxonomy sport = taxonomy("sport");
    Product shoes = product("shoes");
    Product ball = product("ball");
    shoes.addTaxonomy(sport);
    ball.addTaxonomy(sport);
    flushAndClear();

    Taxonomy found = taxonomyRepository.findById(sport.getId()).orElseThrow();

    assertEquals(2, found.getProducts().size());
  }

  @Test
  void shouldRemoveLinkButKeepTaxonomyWhenUnlinked() {
    Taxonomy sport = taxonomy("sport");
    Product shoes = product("shoes");
    shoes.addTaxonomy(sport);
    flushAndClear();

    Product managed = productRepository.findById(shoes.getId()).orElseThrow();
    Taxonomy managedTaxonomy = taxonomyRepository.findById(sport.getId()).orElseThrow();
    managed.removeTaxonomy(managedTaxonomy);
    flushAndClear();

    assertEquals(0, joinRows(shoes.getId()));
    assertTrue(taxonomyRepository.findById(sport.getId()).isPresent());
  }

  @Test
  void shouldRemoveJoinRowsButKeepTaxonomyWhenProductDeleted() {
    Taxonomy sport = taxonomy("sport");
    Product shoes = product("shoes");
    shoes.addTaxonomy(sport);
    flushAndClear();

    productRepository.deleteById(shoes.getId());
    flushAndClear();

    assertEquals(0, joinRows(shoes.getId()));
    assertTrue(taxonomyRepository.findById(sport.getId()).isPresent());
  }
}
