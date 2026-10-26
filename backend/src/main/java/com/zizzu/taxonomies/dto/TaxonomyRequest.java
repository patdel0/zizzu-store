package com.zizzu.taxonomies.dto;

import jakarta.validation.constraints.NotBlank;

public record TaxonomyRequest(@NotBlank String name) {
}
