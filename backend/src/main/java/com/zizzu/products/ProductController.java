package com.zizzu.products;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping(path="/products")
public class ProductController {
    @Autowired

    private ProductRepository productRepository;

    @PostMapping(path="/add")
    public @ResponseBody String addNewProduct (@RequestParam String title
    , @RequestParam String details
    , @RequestParam Integer stock
    , @RequestParam Float pricing
    , @RequestParam String colourVariants
    , @RequestParam String taxonomy) {
        Product n = new Product();
        n.setTitle(title);
        n.setDetails(details);
        n.setStock(stock);
        n.setPricing(pricing);
        n.setColourVariants(colourVariants);
        n.setTaxonomy(taxonomy);
        productRepository.save(n);
        return "Saved";
    }

    @GetMapping(path="/all")
    public @ResponseBody Iterable<Product> getAllProducts() {
        return productRepository.findAll();
    }
}
