package com.zizzu.products.dto;

import jakarta.validation.constraints.NotBlank;
/**
 * Request body for creating/modifying Product Variant
 *
 * @param name price color size
 */
public record ProductVariantRequest(
        @NotBlank Double price, @NotBlank Integer quantity, String color, String size) {
}
