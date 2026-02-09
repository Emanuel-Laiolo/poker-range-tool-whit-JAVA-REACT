package com.emanuel.pokerrange.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RangeRepository extends JpaRepository<RangeEntity, UUID> {}
