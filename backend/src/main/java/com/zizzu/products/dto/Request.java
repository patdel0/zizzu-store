package com.zizzu.products.dto;


import java.util.List;

import jakarta.validation.constraints.NotBlank;

/** {@code taxonomyIds} null means "leave taxonomies unchanged" on update and "none" on create. */
public record Request(@NotBlank String name, @NotBlank String details, List<Integer> taxonomyIds) {

    public Request(String name, String details) {
        this(name, details, null);
    }
}
