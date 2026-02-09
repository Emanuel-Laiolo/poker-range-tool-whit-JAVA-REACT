package com.emanuel.pokerrange.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Simple health endpoint for demos and uptime checks. */
@RestController
public class HealthController {

  @GetMapping("/api/health")
  public String health() {
    return "OK";
  }
}
