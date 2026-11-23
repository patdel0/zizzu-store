package com.zizzu.taxonomies.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for creating or updating a taxonomy.
 *
 * @param name display name of the taxonomy; must not be blank
 */
public record TaxonomyRequest(@NotBlank String name) {}
