package com.zizzu.taxonomies.dto;

import com.zizzu.taxonomies.Taxonomy;

public record TaxonomyResponse(Integer id, String name) {
    public static TaxonomyResponse from (Taxonomy taxonomy) {
        return new TaxonomyResponse(taxonomy.getId(), taxonomy.getName());
    }
}
