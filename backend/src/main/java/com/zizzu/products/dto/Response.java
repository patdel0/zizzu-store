package com.zizzu.products.dto;

import com.zizzu.products.Product;

/**
 * Product data returned by the API.
 *
 * @param id database-generated identifier of the product
 * @param name display name of the product
 * @param details description of the product
 */
public record Response(Integer id, String name, String details) {
  /** Creates a response from a {@link Product} entity. */
  public static Response from(Product product) {
    return new Response(product.getId(), product.getName(), product.getDetails());
  }
}
