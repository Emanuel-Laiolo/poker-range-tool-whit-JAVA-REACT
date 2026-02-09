package com.emanuel.pokerrange;

import com.emanuel.pokerrange.api.dto.HandActionDto;
import com.emanuel.pokerrange.api.dto.RangePayloadDto;
import com.emanuel.pokerrange.domain.ActionType;
import com.emanuel.pokerrange.service.RangeValidator;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class RangeValidatorTest {

  @Test
  void validatesWeightSum() {
    RangeValidator v = new RangeValidator();

    var payload = new RangePayloadDto(
        "test",
        Map.of(
            "AKs", List.of(new HandActionDto(ActionType.OPEN, 50.0), new HandActionDto(ActionType.FOLD, 50.0)),
            "A5s", List.of(new HandActionDto(ActionType.OPEN, 100.0))
        )
    );

    assertDoesNotThrow(() -> v.validateOrThrow(payload));

    var bad = new RangePayloadDto(
        "bad",
        Map.of("AKs", List.of(new HandActionDto(ActionType.OPEN, 90.0)))
    );

    var ex = assertThrows(IllegalArgumentException.class, () -> v.validateOrThrow(bad));
    assertTrue(ex.getMessage().contains("sum to 100"));
  }
}
