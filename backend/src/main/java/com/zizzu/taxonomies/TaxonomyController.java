package com.zizzu.taxonomies;

import com.zizzu.taxonomies.dto.TaxonomyRequest;
import com.zizzu.taxonomies.dto.TaxonomyResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;


import java.net.URI;
import java.util.Optional;

@Controller
@CrossOrigin(origins = "${app.cors.origins}")
@RequestMapping(path = "/taxonomies")
public class TaxonomyController {
    @Autowired
    private TaxonomyRepository taxonomyRepository;

    @PostMapping
    public @ResponseBody ResponseEntity<TaxonomyResponse> addNewTaxonomy(@Valid @RequestBody TaxonomyRequest taxonomyRequest) {
        Taxonomy t = new Taxonomy();
        t.setName(taxonomyRequest.name());

        Taxonomy saved = taxonomyRepository.save(t);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(saved.getId())
                .toUri();
        return ResponseEntity.created(location).body(TaxonomyResponse.from(saved));
    }

    @PutMapping(path = "/{id}")
    public @ResponseBody ResponseEntity<TaxonomyResponse> updateTaxonomy (
            @PathVariable Integer id,
            @Valid @RequestBody TaxonomyRequest taxonomyRequest
    ) {
        Optional<Taxonomy> existing = taxonomyRepository.findById(id);
        return existing
                .map(t -> {
                    t.setName(taxonomyRequest.name());
                    return ResponseEntity.ok(TaxonomyResponse.from(taxonomyRepository.save(t)));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping(path = "/{id}")
    public @ResponseBody String deleteTaxonomy (@PathVariable Integer id) {
        if (!taxonomyRepository.existsById(id)) {
            return "Taxonomy not found.";
        }
        taxonomyRepository.deleteById(id);
        return "Taxonomy deleted.";
    }

    @GetMapping(path = "/{id}")
    public @ResponseBody ResponseEntity<TaxonomyResponse> getTaxonomy(@PathVariable Integer id) {
        Optional<Taxonomy> existing = taxonomyRepository.findById(id);
        return existing
                .map(taxonomy -> ResponseEntity.ok(TaxonomyResponse.from(taxonomy)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public @ResponseBody Iterable<TaxonomyResponse> getAllTaxonomies(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "30") int size) {
        Pageable pageable = PageRequest.of(page,size);
        return taxonomyRepository.findAll(pageable).stream()
                .map(TaxonomyResponse::from)
                .toList();
    }
}
