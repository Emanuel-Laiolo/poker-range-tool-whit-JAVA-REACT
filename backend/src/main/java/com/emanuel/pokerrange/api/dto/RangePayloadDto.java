package com.emanuel.pokerrange.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public record RangePayloadDto(
    @NotBlank String name,
    @NotNull Map<@NotBlank String, @Valid List<@Valid HandActionDto>> hands
) {}
