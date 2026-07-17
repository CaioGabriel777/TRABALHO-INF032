package com.ifba.defesaapi.repository;

import com.ifba.defesaapi.model.StatusTentativa;
import com.ifba.defesaapi.model.TentativaLogin;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TentativaLoginRepository extends JpaRepository<TentativaLogin, Long> {

    @Query("""
            SELECT t FROM TentativaLogin t
            WHERE (:username IS NULL OR t.username = :username)
              AND (:status IS NULL OR t.status = :status)
            ORDER BY t.timestamp DESC
            """)
    List<TentativaLogin> buscar(
            @Param("username") String username,
            @Param("status") StatusTentativa status,
            Pageable pageable);
}
