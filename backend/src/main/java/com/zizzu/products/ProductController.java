package com.zizzu.products;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Optional;

@Controller
@RequestMapping(path="/products")
public class ProductController {
    @Autowired
    private ProductRepository productRepository;

    @PostMapping
    public @ResponseBody String addNewProduct (@RequestParam String name
    , @RequestParam String details ){
        Product n = new Product();
        n.setName(name);
        n.setDetails(details);
        productRepository.save(n);
        return "Saved";
    }

    @PatchMapping(path = "/{id}")
    public @ResponseBody String updateProduct(@PathVariable Integer id
    , @RequestParam(required = false) String name
    , @RequestParam(required = false) String details) {
        Optional<Product> existing = productRepository.findById(id);
        if (existing.isEmpty()) {
            return "Product not found.";
        }
        Product p = existing.get();
        if (name != null) {
            p.setName(name);
        }
        if (details != null) {
            p.setDetails((details));
        }
        productRepository.save(p);
            return "Product updated.";
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
    public @ResponseBody ResponseEntity<Product> getProduct(@PathVariable Integer id) {
        Optional<Product> existing = productRepository.findById(id);
        return existing
                .map(product -> ResponseEntity.ok(product))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public @ResponseBody Iterable<Product> getAllProducts() {
        return productRepository.findAll();
    }

}


