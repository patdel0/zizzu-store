package com.zizzu.taxonomies.dto;

import com.zizzu.taxonomies.Taxonomy;

/**
 * Taxonomy data returned by the API.
 *
 * @param id database-generated identifier of the taxonomy
 * @param name display name of the taxonomy
 */
public record TaxonomyResponse(Integer id, String name) {
  /** Creates a response from a {@link Taxonomy} entity. */
  public static TaxonomyResponse from(Taxonomy taxonomy) {
    return new TaxonomyResponse(taxonomy.getId(), taxonomy.getName());
  }
}
