package com.zizzu.products;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import java.util.HashSet;
import java.util.Set;
import org.jspecify.annotations.Nullable;


@Entity
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;
    private String name;
    private String details;
    private String sku;

    @ManyToMany
    @JoinTable(
        name = "product_taxonomy",
        joinColumns = @JoinColumn(name = "product_id"),
        inverseJoinColumns = @JoinColumn(name = "taxonomy_id"))
    private Set<Taxonomy> taxonomies = new HashSet<>();

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDetails(){
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

    public void addTaxonomy(Taxonomy taxonomy) {
        taxonomies.add(taxonomy);
        taxonomy.getProducts().add(this);
    }

    public void removeTaxonomy(Taxonomy taxonomy) {
        taxonomies.remove(taxonomy);
        taxonomy.getProducts().remove(this);
    }
}


