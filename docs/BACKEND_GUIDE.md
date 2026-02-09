# Backend guide (Java / Spring Boot)

## What the backend does
- Exposes an HTTP API under `/api/*`
- Validates the JSON payload (range contract)
- Stores ranges in a database (H2)

## Project structure

- `BackendApplication.java`
  - Spring Boot entrypoint

- `api/RangeController.java`
  - REST endpoints

- `api/dto/*`
  - DTOs that define the API payloads and responses

- `service/RangeService.java`
  - Business logic: create/update/get/list/delete

- `service/RangeValidator.java`
  - Contract rules: weights sum to 100, etc.

- `persistence/*`
  - JPA entity + repository

- `config/CorsConfig.java`
  - Allows the frontend to call the API in development

## Running
From `backend/`:

```bash
./mvnw spring-boot:run
```

Swagger UI:
- `http://localhost:8080/swagger-ui.html`

## Quick explanation for interview
> "React builds a range JSON. Java receives it, validates it, stores it, and can return it back. Java is the source of truth for data and validation rules."
