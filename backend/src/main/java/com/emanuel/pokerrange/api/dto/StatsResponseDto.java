package com.emanuel.pokerrange.api.dto;

import com.emanuel.pokerrange.domain.ActionType;

import java.util.Map;

public record StatsResponseDto(
    double vpip,
    Map<ActionType, Double> byAction
) {}
