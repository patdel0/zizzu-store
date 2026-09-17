package com.zizzu.products.size;

import com.zizzu.products.variant.ProductVariant;
import jakarta.persistence.*;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Size {
    @Id @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;
    private String name;
    private String code;

    @OneToMany(mappedBy = "size")
    private List<ProductVariant> variants = new ArrayList<>();
}
