package com.zizzu.products;

import jakarta.persistence.*;
import org.jspecify.annotations.Nullable;


@Entity
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;
    private String name;
    private String details;

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
}

