package com.zizzu.products;

import org.springframework.data.repository.ListCrudRepository;


public interface ProductRepository extends ListCrudRepository<Product, Integer> {
}
