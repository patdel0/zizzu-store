package com.zizzu.products;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping(path="/products")
public class ProductController {
    @Autowired
    private ProductRepository productRepository;

    @PostMapping
    public @ResponseBody String addNewProduct (@RequestParam String title
    , @RequestParam String details ){
        Product n = new Product();
        n.setTitle(title);
        n.setDetails(details);
        productRepository.save(n);
        return "Saved";
    }

    @GetMapping(path="/all")
    public @ResponseBody Iterable<Product> getAllProducts() {
        return productRepository.findAll();
    }
}
