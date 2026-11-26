package com.zizzu.products.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

/**
 * Request body for creating or updating a product.
 *
 * @param name display name of the product; must not be blank
 * @param details description of the product; must not be blank
 * @param taxonomyIds IDs of the taxonomies to assign, or null to leave them unchanged
 */
public record ProductRequest(
    @NotBlank String name, @NotBlank String details, List<Integer> taxonomyIds, List<ProductVariantRequest> variants) {}
