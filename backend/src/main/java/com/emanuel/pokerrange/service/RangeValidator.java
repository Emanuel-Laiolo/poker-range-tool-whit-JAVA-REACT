package com.emanuel.pokerrange.service;

import com.emanuel.pokerrange.api.dto.HandActionDto;
import com.emanuel.pokerrange.api.dto.RangePayloadDto;
import com.emanuel.pokerrange.domain.ActionType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * RangeValidator
 * ---------------------------------------------------------------------------
 * "Contract rules" that must be true for every range.
 *
 * This is what you would describe as "business validation".
 *
 * Rules enforced here:
 * - Every hand has at least one action
 * - No duplicate actions for the same hand
 * - For each hand, weights sum to 100 (+/- epsilon)
 */
@Component
public class RangeValidator {
  public void validateOrThrow(RangePayloadDto payload) {
    for (Map.Entry<String, List<HandActionDto>> e : payload.hands().entrySet()) {
      String hand = e.getKey();
      List<HandActionDto> actions = e.getValue();

      if (actions == null || actions.isEmpty()) {
        throw new IllegalArgumentException("Hand '" + hand + "' must have at least one action");
      }

      // 1) Sum weights
      double sum = actions.stream().mapToDouble(a -> a.weight() == null ? 0 : a.weight()).sum();
      if (Math.abs(sum - 100.0) > 0.0001) {
        throw new IllegalArgumentException("Hand '" + hand + "' weights must sum to 100 (got " + sum + ")");
      }

      // 2) No duplicate action types
      var seen = new java.util.HashSet<ActionType>();
      for (var a : actions) {
        if (!seen.add(a.action())) {
          throw new IllegalArgumentException("Hand '" + hand + "' has duplicate action: " + a.action());
        }
      }
    }
  }

  /**
   * Compute average distribution per action across all hands.
   * This returns % values (0..100) averaged per hand.
   */
  public Map<ActionType, Double> computeActionTotals(RangePayloadDto payload) {
    Map<ActionType, Double> totals = new EnumMap<>(ActionType.class);
    for (var action : ActionType.values()) totals.put(action, 0.0);

    int handCount = payload.hands().size();
    if (handCount == 0) return totals;

    // Sum all weights
    for (var entry : payload.hands().entrySet()) {
      for (var a : entry.getValue()) {
        totals.put(a.action(), totals.getOrDefault(a.action(), 0.0) + a.weight());
      }
    }

    // Convert totals -> average per hand
    for (var action : ActionType.values()) {
      totals.put(action, totals.get(action) / handCount);
    }

    return totals;
  }

  /** VPIP = any non-FOLD action (simplified definition). */
  public double computeVpip(Map<ActionType, Double> byAction) {
    double vpip = 0.0;
    for (var e : byAction.entrySet()) {
      if (e.getKey() != ActionType.FOLD) vpip += e.getValue();
    }
    return vpip;
  }
}
