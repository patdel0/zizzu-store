package com.zizzu.products;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping(path="/all")
    public @ResponseBody Iterable<Product> getAllProducts() {
        return productRepository.findAll();
    }


}
