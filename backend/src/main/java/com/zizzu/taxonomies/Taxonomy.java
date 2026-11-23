package com.zizzu.taxonomies;

import com.zizzu.products.Product;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import java.util.HashSet;
import java.util.Set;
import org.jspecify.annotations.Nullable;

/** A named classification that can be assigned to multiple products. */
@Entity
public class Taxonomy {
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private @Nullable Integer id;

  @ManyToMany(mappedBy = "taxonomies")
  private Set<Product> products = new HashSet<>();

  private String name;

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
