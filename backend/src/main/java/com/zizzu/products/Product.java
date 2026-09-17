package com.zizzu.products;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import org.jspecify.annotations.Nullable;

@Entity
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;

    private String title;

    private String details;

    private Integer stock;

    private Float pricing;

    private String[] colourVariants;

    private String[] taxonomy;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Float getPricing() {
        return pricing;
    }

    public void setPricing(Float pricing) {
        this.pricing = pricing;
    }

    public String getColourVariants() {
        return colourVariants[];
    }

    public void setColourVariants(String[] colourVariants) {
        this.colourVariants = colourVariants;
    }

    public String getTaxonomy() {
        return taxonomy[];
    }

    public void setTaxonomy(String[] taxonomy) {
        this.taxonomy = taxonomy;
    }
}

