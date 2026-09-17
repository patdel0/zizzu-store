package com.zizzu.taxonomy;

import com.zizzu.products.Product;
import jakarta.persistence.*;
import org.jspecify.annotations.Nullable;

@Entity
@Table(name = "product_taxonomy")
public class ProductTaxonomy {
    @Id @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "taxonomy_id")
    private Taxonomy taxonomy;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

}
