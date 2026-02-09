package com.emanuel.pokerrange.service;

import com.emanuel.pokerrange.api.dto.HandActionDto;
import com.emanuel.pokerrange.api.dto.RangePayloadDto;
import com.emanuel.pokerrange.domain.ActionType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class RangeValidator {
  /**
   * Validates:
   * - each hand has non-empty actions
   * - weights are within 0..100 (also covered by bean validation)
   * - sum of weights per hand is 100 (+/- epsilon)
   */
  public void validateOrThrow(RangePayloadDto payload) {
    for (Map.Entry<String, List<HandActionDto>> e : payload.hands().entrySet()) {
      String hand = e.getKey();
      List<HandActionDto> actions = e.getValue();

      if (actions == null || actions.isEmpty()) {
        throw new IllegalArgumentException("Hand '" + hand + "' must have at least one action");
      }

      double sum = actions.stream().mapToDouble(a -> a.weight() == null ? 0 : a.weight()).sum();
      if (Math.abs(sum - 100.0) > 0.0001) {
        throw new IllegalArgumentException("Hand '" + hand + "' weights must sum to 100 (got " + sum + ")");
      }

      // Optional: disallow duplicates of the same action.
      var seen = new java.util.HashSet<ActionType>();
      for (var a : actions) {
        if (!seen.add(a.action())) {
          throw new IllegalArgumentException("Hand '" + hand + "' has duplicate action: " + a.action());
        }
      }
    }
  }

  public Map<ActionType, Double> computeActionTotals(RangePayloadDto payload) {
    Map<ActionType, Double> totals = new EnumMap<>(ActionType.class);
    for (var action : ActionType.values()) totals.put(action, 0.0);

    int handCount = payload.hands().size();
    if (handCount == 0) return totals;

    for (var entry : payload.hands().entrySet()) {
      for (var a : entry.getValue()) {
        totals.put(a.action(), totals.getOrDefault(a.action(), 0.0) + a.weight());
      }
    }

    // Convert to % across entire grid (avg per hand).
    for (var action : ActionType.values()) {
      totals.put(action, totals.get(action) / handCount);
    }

    return totals;
  }

  public double computeVpip(Map<ActionType, Double> byAction) {
    // VPIP = any action except fold (simple definition).
    double vpip = 0.0;
    for (var e : byAction.entrySet()) {
      if (e.getKey() != ActionType.FOLD) vpip += e.getValue();
    }
    return vpip;
  }
}
