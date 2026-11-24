package com.zizzu.products;

import org.springframework.data.repository.ListCrudRepository;
import org.springframework.data.repository.ListPagingAndSortingRepository;
/**
 * Data access for {@link ProductVariant} entities, with CRUD and paging support.
 */
public interface ProductVariantRepository
        extends ListCrudRepository<ProductVariant, Integer>, ListPagingAndSortingRepository<ProductVariant, Integer> {
}
