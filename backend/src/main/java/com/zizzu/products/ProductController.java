package com.zizzu.products;

import java.net.URI;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import com.zizzu.products.dto.Request;
import com.zizzu.products.dto.Response;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import jakarta.validation.Valid;

@Controller
@CrossOrigin(origins = "${app.cors.origins}")
@RequestMapping(path="/products")
public class ProductController {
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TaxonomyRepository taxonomyRepository;

    private Set<Taxonomy> findTaxonomies(List<Integer> ids) {
        Set<Integer> distinct = new HashSet<>(ids);
        List<Taxonomy> found = taxonomyRepository.findAllById(distinct);
        if (found.size() != distinct.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown taxonomy id");
        }
        return new HashSet<>(found);
    }

    private void replaceTaxonomies(Product product, Set<Taxonomy> taxonomies) {
        for (Taxonomy current : new HashSet<>(product.getTaxonomies())) {
            if (!taxonomies.contains(current)) {
                product.removeTaxonomy(current);
            }
        }
        taxonomies.forEach(product::addTaxonomy);
    }

    @PostMapping
    public @ResponseBody ResponseEntity<Response> addNewProduct(@Valid @RequestBody Request request) {
        Product n = new Product();
        n.setName(request.name());
        n.setDetails(request.details());
        if (request.taxonomyIds() != null) {
            findTaxonomies(request.taxonomyIds()).forEach(n::addTaxonomy);
        }
        Product saved = productRepository.save(n);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(saved.getId())
                .toUri();
        return ResponseEntity.created(location).body(Response.from(saved));
    }

    @PutMapping(path = "/{id}")
    public @ResponseBody ResponseEntity<Response> updateProduct(
        @PathVariable Integer id,
        @Valid @RequestBody Request request
    ) {
        Optional<Product> existing = productRepository.findById(id);
        return existing
            .map(p -> {
                p.setName(request.name());
                p.setDetails(request.details());
                if (request.taxonomyIds() != null) {
                    replaceTaxonomies(p, findTaxonomies(request.taxonomyIds()));
                }
                return ResponseEntity.ok(Response.from(productRepository.save(p)));
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping(path = "/{id}")
    public @ResponseBody String deleteProduct(@PathVariable Integer id) {
        if (!productRepository.existsById(id)) {
            return "Product not found.";
        }
        productRepository.deleteById(id);
        return "Product deleted.";
    }

    @GetMapping(path = "/{id}")
    public @ResponseBody ResponseEntity<Response> getProduct(@PathVariable Integer id) {
        Optional<Product> existing = productRepository.findById(id);
        return existing
                .map(product -> ResponseEntity.ok(Response.from(product)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public @ResponseBody Iterable<Response> getAllProducts(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page,size);
        return productRepository.findAll(pageable).stream()
                .map(Response::from)
                .toList();
    }
}
