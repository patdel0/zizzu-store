package com.zizzu.products.dto;

import com.zizzu.products.Product;
import com.zizzu.products.ProductVariant;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Product data returned by the API.
 *
 * @param id database-generated identifier of the product
 * @param name display name of the product
 * @param details description of the product
 * @param taxonomies taxonomies assigned to the product
 */
public record ProductResponse(
        Integer id, String name, String details, Set<TaxonomyList> taxonomies, Set<ProductVariantList> productVariants) {
  /** The ID and name of a taxonomy assigned to the product. */
  public record TaxonomyList(Integer id, String name) {}
  public record ProductVariantList(Integer id, Double price, Integer quantity, String color, String size) {}

  /** Creates a response from a {@link Product} entity. */
  public static ProductResponse from(Product product) {
    return new ProductResponse(
        product.getId(),
        product.getName(),
        product.getDetails(),
        product.getTaxonomies().stream()
            .map(taxonomy -> new TaxonomyList(taxonomy.getId(), taxonomy.getName()))
            .collect(Collectors.toSet()),
        product.getVariants().stream()
                .map(variant -> new ProductVariantList(variant.getId(), variant.getPrice(), variant.getQuantity(), variant.getColor(), variant.getSize()))
                .collect(Collectors.toSet()));
  }
}
