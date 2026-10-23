package com.zizzu.products;

import org.springframework.data.repository.ListCrudRepository;
import org.springframework.data.repository.ListPagingAndSortingRepository;

/** Data access for {@link Product} entities, with CRUD and paging support. */
public interface ProductRepository
    extends ListCrudRepository<Product, Integer>,
        ListPagingAndSortingRepository<Product, Integer> {}
