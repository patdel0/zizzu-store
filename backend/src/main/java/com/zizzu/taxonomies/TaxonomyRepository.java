package com.zizzu.taxonomies;

import org.springframework.data.repository.ListCrudRepository;
import org.springframework.data.repository.ListPagingAndSortingRepository;

public interface TaxonomyRepository extends ListCrudRepository<Taxonomy, Integer>, ListPagingAndSortingRepository<Taxonomy, Integer> {
}
