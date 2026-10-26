package com.zizzu.products.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for creating or updating a product.
 *
 * @param name display name of the product; must not be blank
 * @param details description of the product; must not be blank
 */
public record ProductRequest(@NotBlank String name, @NotBlank String details) {}
