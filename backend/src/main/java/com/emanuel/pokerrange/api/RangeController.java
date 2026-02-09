package com.emanuel.pokerrange.api;

import com.emanuel.pokerrange.api.dto.RangePayloadDto;
import com.emanuel.pokerrange.api.dto.RangeResponseDto;
import com.emanuel.pokerrange.api.dto.RangeSummaryDto;
import com.emanuel.pokerrange.api.dto.StatsResponseDto;
import com.emanuel.pokerrange.service.RangeService;
import com.emanuel.pokerrange.service.RangeValidator;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/ranges")
public class RangeController {
  private final RangeService service;
  private final RangeValidator validator;

  public RangeController(RangeService service, RangeValidator validator) {
    this.service = service;
    this.validator = validator;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public RangeResponseDto create(@RequestBody @Valid RangePayloadDto payload) {
    var e = service.create(payload);
    return new RangeResponseDto(e.getId(), e.getName(), e.getCreatedAt(), e.getUpdatedAt(), payload);
  }

  @PutMapping("/{id}")
  public RangeResponseDto update(@PathVariable UUID id, @RequestBody @Valid RangePayloadDto payload) {
    var e = service.update(id, payload);
    return new RangeResponseDto(e.getId(), e.getName(), e.getCreatedAt(), e.getUpdatedAt(), payload);
  }

  @GetMapping("/{id}")
  public RangeResponseDto get(@PathVariable UUID id) {
    var e = service.get(id).orElseThrow(() -> new IllegalArgumentException("Range not found"));
    var payload = service.parsePayload(e.getPayloadJson());
    return new RangeResponseDto(e.getId(), e.getName(), e.getCreatedAt(), e.getUpdatedAt(), payload);
  }

  @GetMapping
  public java.util.List<RangeSummaryDto> list() {
    return service.list().stream()
        .map(e -> new RangeSummaryDto(e.getId(), e.getName(), e.getCreatedAt(), e.getUpdatedAt()))
        .toList();
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID id) {
    service.delete(id);
  }

  @PostMapping("/validate")
  public void validate(@RequestBody @Valid RangePayloadDto payload) {
    validator.validateOrThrow(payload);
  }

  @PostMapping("/stats")
  public StatsResponseDto stats(@RequestBody @Valid RangePayloadDto payload) {
    validator.validateOrThrow(payload);
    var byAction = validator.computeActionTotals(payload);
    var vpip = validator.computeVpip(byAction);
    return new StatsResponseDto(vpip, byAction);
  }
}
