package com.zizzu.products.dto;

import com.zizzu.products.Product;

public record Response(Integer id, String name, String details) {
    public static Response from (Product product) {
        return new Response(product.getId(), product.getName(), product.getDetails());
    }
}
