package com.zizzu.products;

import com.zizzu.taxonomies.Taxonomy;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import java.util.HashSet;
import java.util.Set;
import org.jspecify.annotations.Nullable;

/** A product listed in the store, persisted as a JPA entity. */
@Entity
public class Product {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private @Nullable Integer id;

  @ManyToMany
  @JoinTable(
      name = "product_taxonomy",
      joinColumns = @JoinColumn(name = "product_id"),
      inverseJoinColumns = @JoinColumn(name = "taxonomy_id"))
  private Set<Taxonomy> taxonomies = new HashSet<>();

  private String name;
  private String details;
  private String sku;

  public Integer getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDetails() {
    return details;
  }

  public void setDetails(String details) {
    this.details = details;
  }

  public String getSku() {
    return sku;
  }

  public void setSku(String sku) {
    this.sku = sku;
  }

  public Set<Taxonomy> getTaxonomies() {
    return taxonomies;
  }

  /** Links this product and the taxonomy on both sides of the relationship. */
  public void addTaxonomy(Taxonomy taxonomy) {
    taxonomies.add(taxonomy);
    taxonomy.getProducts().add(this);
  }

  /** Unlinks this product and the taxonomy on both sides of the relationship. */
  public void removeTaxonomy(Taxonomy taxonomy) {
    taxonomies.remove(taxonomy);
    taxonomy.getProducts().remove(this);
  }
}
