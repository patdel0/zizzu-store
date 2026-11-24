package com.zizzu.products;

import com.zizzu.products.dto.ProductRequest;
import com.zizzu.products.dto.ProductResponse;
import com.zizzu.taxonomies.TaxonomyRepository;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/** REST endpoints for creating, reading, updating and deleting products. */
@Controller
@RequestMapping(path = "/products")
public class ProductController {
  @Autowired private ProductRepository productRepository;
  @Autowired private TaxonomyRepository taxonomyRepository;

  /** Creates a product and returns it with its location in the {@code Location} header. */
  @PostMapping
  public @ResponseBody ResponseEntity<ProductResponse> addNewProduct(
      @Valid @RequestBody ProductRequest request) {
    Product n = new Product();
    n.setName(request.name());
    n.setDetails(request.details());
    if (request.taxonomyIds() != null) {
      taxonomyRepository.findAllById(request.taxonomyIds()).forEach(n::addTaxonomy);
    }
    Product saved = productRepository.save(n);
    URI location =
        ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(saved.getId())
            .toUri();
    return ResponseEntity.created(location).body(ProductResponse.from(saved));
  }

  /** Updates the product with the given id, or returns 404 if it does not exist. */
  @PutMapping(path = "/{id}")
  public @ResponseBody ResponseEntity<ProductResponse> updateProduct(
      @PathVariable Integer id, @Valid @RequestBody ProductRequest request) {
    Optional<Product> existing = productRepository.findById(id);
    return existing
        .map(
            p -> {
              p.setName(request.name());
              p.setDetails(request.details());
              if (request.taxonomyIds() != null) {
                p.getTaxonomies().clear();
                taxonomyRepository.findAllById(request.taxonomyIds()).forEach(p::addTaxonomy);
              }
              return ResponseEntity.ok(ProductResponse.from(productRepository.save(p)));
            })
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  /** Deletes the product with the given id. */
  @DeleteMapping(path = "/{id}")
  public @ResponseBody String deleteProduct(@PathVariable Integer id) {
    if (!productRepository.existsById(id)) {
      return "Product not found.";
    }
    productRepository.deleteById(id);
    return "Product deleted.";
  }

  /** Returns the product with the given id, or 404 if it does not exist. */
  @GetMapping(path = "/{id}")
  public @ResponseBody ResponseEntity<ProductResponse> getProduct(@PathVariable Integer id) {
    Optional<Product> existing = productRepository.findById(id);
    return existing
        .map(product -> ResponseEntity.ok(ProductResponse.from(product)))
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  /** Returns products by taxonomy when specified, or one zero-based page of all products. */
  @GetMapping
  public @ResponseBody Iterable<ProductResponse> getAllProducts(
      @RequestParam(required = false) Integer taxonomyName,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    if (taxonomyName != null) {
      return productRepository.findByTaxonomiesId(taxonomyName).stream()
          .map(ProductResponse::from)
          .toList();
    }
    Pageable pageable = PageRequest.of(page, size);
    return productRepository.findAll(pageable).stream().map(ProductResponse::from).toList();
  }
}
