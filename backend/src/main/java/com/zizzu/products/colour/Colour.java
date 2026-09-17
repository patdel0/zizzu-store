package com.zizzu.products.colour;

import com.zizzu.products.variant.ProductVariant;
import jakarta.persistence.*;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Colour {
    @Id @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;
    private String name;

    @Column(name = "hex_code")
    private String hexCode;

    @OneToMany(mappedBy = "colour")
    private List<ProductVariant> variants = new ArrayList<>();

}
