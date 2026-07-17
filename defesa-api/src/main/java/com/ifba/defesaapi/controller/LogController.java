package com.ifba.defesaapi.controller;

import com.ifba.defesaapi.model.StatusTentativa;
import com.ifba.defesaapi.model.TentativaLogin;
import com.ifba.defesaapi.repository.TentativaLoginRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class LogController {

    private final TentativaLoginRepository tentativaLoginRepository;

    public LogController(TentativaLoginRepository tentativaLoginRepository) {
        this.tentativaLoginRepository = tentativaLoginRepository;
    }

    @GetMapping("/logs")
    public List<TentativaLogin> logs(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) StatusTentativa status,
            @RequestParam(defaultValue = "200") int limit) {
        Pageable pageable = PageRequest.of(0, Math.min(Math.max(limit, 1), 1000));
        return tentativaLoginRepository.buscar(username, status, pageable);
    }

    @DeleteMapping("/logs")
    public ResponseEntity<Void> limparLogs() {
        tentativaLoginRepository.deleteAll();
        return ResponseEntity.noContent().build();
    }
}
