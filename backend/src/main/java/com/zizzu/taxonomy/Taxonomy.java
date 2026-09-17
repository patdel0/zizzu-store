package com.zizzu.taxonomy;

import jakarta.persistence.*;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Taxonomy {
    @Id @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;
    private String name;
    private String type;

    @OneToMany(mappedBy = "taxonomy")
    private List<ProductTaxonomy> productTaxonomies = new ArrayList<>();
}
