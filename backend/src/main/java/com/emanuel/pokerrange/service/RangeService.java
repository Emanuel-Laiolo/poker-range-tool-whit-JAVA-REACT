package com.emanuel.pokerrange.service;

import com.emanuel.pokerrange.api.dto.RangePayloadDto;
import com.emanuel.pokerrange.persistence.RangeEntity;
import com.emanuel.pokerrange.persistence.RangeRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class RangeService {
  private final RangeRepository repo;
  private final ObjectMapper mapper;
  private final RangeValidator validator;

  public RangeService(RangeRepository repo, ObjectMapper mapper, RangeValidator validator) {
    this.repo = repo;
    this.mapper = mapper;
    this.validator = validator;
  }

  @Transactional
  public RangeEntity create(RangePayloadDto payload) {
    validator.validateOrThrow(payload);

    RangeEntity e = new RangeEntity();
    e.setName(payload.name());
    e.setPayloadJson(toJson(payload));
    return repo.save(e);
  }

  @Transactional
  public RangeEntity update(UUID id, RangePayloadDto payload) {
    validator.validateOrThrow(payload);

    RangeEntity e = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Range not found"));
    e.setName(payload.name());
    e.setPayloadJson(toJson(payload));
    return repo.save(e);
  }

  public Optional<RangeEntity> get(UUID id) {
    return repo.findById(id);
  }

  public java.util.List<RangeEntity> list() {
    return repo.findAll(org.springframework.data.domain.Sort.by("updatedAt").descending());
  }

  public void delete(UUID id) {
    repo.deleteById(id);
  }

  public RangePayloadDto parsePayload(String json) {
    try {
      return mapper.readValue(json, RangePayloadDto.class);
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Invalid payload JSON", e);
    }
  }

  private String toJson(RangePayloadDto payload) {
    try {
      return mapper.writeValueAsString(payload);
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }
  }
}
