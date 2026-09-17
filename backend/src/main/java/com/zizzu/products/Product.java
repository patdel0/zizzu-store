package com.zizzu.products;

import jakarta.persistence.*;
import org.jspecify.annotations.Nullable;


@Entity
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;
    private String title;
    private String details;

    public Integer getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDetails(){
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}

