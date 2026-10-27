package com.zizzu.products;

import org.springframework.data.repository.ListCrudRepository;

/** Data access for {@link Taxonomy} entities. */
public interface TaxonomyRepository extends ListCrudRepository<Taxonomy, Integer> {}
