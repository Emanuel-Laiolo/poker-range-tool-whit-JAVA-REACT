package com.emanuel.pokerrange.api.dto;

import java.time.Instant;
import java.util.UUID;

public record RangeResponseDto(
    UUID id,
    String name,
    Instant createdAt,
    Instant updatedAt,
    RangePayloadDto payload
) {}
