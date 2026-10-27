package com.zizzu.products;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import java.util.HashSet;
import java.util.Set;
import org.jspecify.annotations.Nullable;

/** A category or tag that products can be grouped under. */
@Entity
public class Taxonomy {
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private @Nullable Integer id;

  private String name;

  @ManyToMany(mappedBy = "taxonomies")
  private Set<Product> products = new HashSet<>();

  public Integer getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Set<Product> getProducts() {
    return products;
  }
}
