package com.emanuel.pokerrange.api.dto;

import com.emanuel.pokerrange.domain.ActionType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record HandActionDto(
    @NotNull ActionType action,
    @NotNull @Min(0) @Max(100) Double weight
) {}
