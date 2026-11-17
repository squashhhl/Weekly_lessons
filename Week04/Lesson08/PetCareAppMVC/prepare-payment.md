# Feature: Prepare payment details

## 1. User goal
Pet owners need this feature. They want to review the selected service and its amount before payment.

## 2. Scope
The feature will:
- Accept a service ID in the URL.
- Find the service in the mock service catalogue.
- Use the catalogue price as the amount.
- Return the payment details as JSON with the status `READY_FOR_PAYMENT`.
- Return an error if the service does not exist.

The feature will NOT:
- Charge money.
- Connect to a payment gateway.
- Create new database tables.
- Create new EJS pages.
- Use an amount supplied by the client.
- Require login. This is a classroom mock endpoint.

Preparing payment details is not the same as processing a payment.

## 3. Request
- HTTP method: `GET`
- URL: `/payments/prepare/:serviceId`
- Input: `serviceId` in the URL. No request body is needed.
- Example: `/payments/prepare/1`
- The server chooses the price from the catalogue. Any amount sent by the client is not used.

## 4. Service catalogue
The mock catalogue is the source of truth for service names and prices.

| ID (number) | Service name (string) | Price (number) |
|---|---|---|
| 1 | Vaccination | 35 |
| 2 | Pet Grooming | 50 |
| 3 | Boarding | 80 |

## 5. Successful response
When the service exists, the server returns HTTP status 200 with exactly five JSON fields.

Example for service ID 1:

```json
{
  "serviceId": 1,
  "serviceName": "Vaccination",
  "amount": 35,
  "currency": "sgd",
  "status": "READY_FOR_PAYMENT"
}
```

| Field | Type | Value |
|---|---|---|
| `serviceId` | number | The requested service ID |
| `serviceName` | string | The service name from the catalogue |
| `amount` | number | The service price from the catalogue |
| `currency` | string | Always `sgd` |
| `status` | string | Always `READY_FOR_PAYMENT` |

`serviceId` and `amount` must be JSON numbers, not strings. For example, `35` is correct, but `"35.00"` is not.

## 6. Unsuccessful response
When the requested service does not exist in the catalogue, the server returns HTTP status 404 with this JSON:

```json
{
  "error": "Service not found"
}
```

## 7. Acceptance criteria
- AC1: When service ID 1 is requested, the response is 200 with `serviceName` "Vaccination" and `amount` 35.
- AC2: When service ID 2 is requested, the response is 200 with `serviceName` "Pet Grooming" and `amount` 50.
- AC3: When service ID 3 is requested, the response is 200 with `serviceName` "Boarding" and `amount` 80.
- AC4: When service ID 999 is requested, the response is 404 with `{"error":"Service not found"}`.
- AC5: Any successful response has exactly five fields, with `serviceId` and `amount` as numbers, `serviceName`, `currency` and `status` as strings, `currency` equal to "sgd" and `status` equal to "READY_FOR_PAYMENT".

## 8. Open questions
- Should a malformed service ID, such as `abc`, return 404 or 400?
- Should the prepared payment be linked to a specific pet or owner in a later version?
- Should login be required when this stops being a classroom mock endpoint?
