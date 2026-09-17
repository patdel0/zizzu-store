package com.zizzu.products.variant;

import com.zizzu.products.Product;
import com.zizzu.products.colour.Colour;
import com.zizzu.products.size.Size;
import jakarta.persistence.*;
import org.jspecify.annotations.Nullable;

import java.math.BigDecimal;

@Entity
@Table(name = "product_variant", uniqueConstraints = {
        @UniqueConstraint(name = "uk_variant_psk", columnNames = {"product_id", "colour_id", "size_id"})
})
public class ProductVariant {
    @Id @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "colour_id")
    private Colour colour;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "size_id")
    private Size size;

    @Column(name = "sku_code", nullable = false, unique = true)
    private String skuCode;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal price;

    private Integer quantity;

}
