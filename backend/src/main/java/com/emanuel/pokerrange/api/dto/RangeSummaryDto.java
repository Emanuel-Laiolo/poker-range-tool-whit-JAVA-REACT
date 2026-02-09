package com.emanuel.pokerrange.api.dto;

import java.time.Instant;
import java.util.UUID;

public record RangeSummaryDto(
    UUID id,
    String name,
    Instant createdAt,
    Instant updatedAt
) {}
