package com.zizzu.taxonomies;

import org.springframework.data.repository.ListCrudRepository;
import org.springframework.data.repository.ListPagingAndSortingRepository;

/** Data access for {@link Taxonomy} entities, with CRUD and paging support. */
public interface TaxonomyRepository
    extends ListCrudRepository<Taxonomy, Integer>,
        ListPagingAndSortingRepository<Taxonomy, Integer> {}
