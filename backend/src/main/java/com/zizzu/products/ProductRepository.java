package com.zizzu.products;

import java.util.List;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.data.repository.ListPagingAndSortingRepository;

/** Data access for {@link Product} entities, with CRUD and paging support. */
public interface ProductRepository
    extends ListCrudRepository<Product, Integer>, ListPagingAndSortingRepository<Product, Integer> {
  /** Finds all products assigned to the taxonomy with the given ID. */
  List<Product> findByTaxonomiesId(Integer taxonomyId);
}
