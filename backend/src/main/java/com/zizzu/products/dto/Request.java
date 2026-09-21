package com.zizzu.products.dto;


import jakarta.validation.constraints.NotBlank;

public record Request(@NotBlank String name, @NotBlank String details) {

}
