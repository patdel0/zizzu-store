package com.zizzu.products;

import jakarta.persistence.*;
import org.jspecify.annotations.Nullable;
import java.util.ArrayList;
import java.util.List;

import com.zizzu.products.variant.ProductVariant;
import com.zizzu.taxonomy.ProductTaxonomy;

@Entity
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;
    private String title;
    private String details;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductVariant> variants = new ArrayList<>();

    @OneToMany(mappedBy = "product")
    private List<ProductTaxonomy> taxonomies = new ArrayList<>();

    public void addVariant(ProductVariant v) {
        variants.add(v);
        v.setProduct(this);
    }

}

