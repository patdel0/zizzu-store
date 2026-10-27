package com.zizzu.products.dto;

import java.util.List;

import com.zizzu.products.Product;
import com.zizzu.products.Taxonomy;

public record Response(Integer id, String name, String details, List<Integer> taxonomyIds) {
    public static Response from (Product product) {
        List<Integer> taxonomyIds = product.getTaxonomies().stream()
                .map(Taxonomy::getId)
                .sorted()
                .toList();
        return new Response(product.getId(), product.getName(), product.getDetails(), taxonomyIds);
    }
}
