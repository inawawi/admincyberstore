import test from "node:test";
import assert from "node:assert/strict";
import {
  Logger,
  maskEmail,
  maskPhone,
  redactSensitiveData,
  generateRequestId,
} from "../lib/logger";

test("maskEmail correctly obscures email addresses", () => {
  assert.equal(maskEmail("john.doe@example.com"), "j***e@example.com");
  assert.equal(maskEmail("ab@domain.com"), "a***@domain.com");
  assert.equal(maskEmail(""), "");
  assert.equal(maskEmail("invalid-email"), "[INVALID_EMAIL]");
});

test("maskPhone correctly obscures phone numbers", () => {
  assert.equal(maskPhone("081234567890"), "0812****7890");
  assert.equal(maskPhone("123"), "****");
  assert.equal(maskPhone(""), "");
});

test("redactSensitiveData redacts sensitive keys recursively", () => {
  const sensitiveObj = {
    user: "john",
    password: "supersecretpassword",
    credentials: {
      api_token: "secret-token-value",
      otp_code: "123456",
      auth_secret: "my-jwt-secret",
    },
    metadata: {
      tags: ["admin", "test"],
      safeField: "safe",
    },
  };

  const redacted = redactSensitiveData(sensitiveObj) as Record<string, any>;
  assert.equal(redacted.user, "john");
  assert.equal(redacted.password, "[REDACTED]");
  assert.equal(redacted.credentials.api_token, "[REDACTED]");
  assert.equal(redacted.credentials.otp_code, "[REDACTED]");
  assert.equal(redacted.credentials.auth_secret, "[REDACTED]");
  assert.equal(redacted.metadata.safeField, "safe");
  assert.deepEqual(redacted.metadata.tags, ["admin", "test"]);
});

test("generateRequestId produces unique prefixed strings", () => {
  const id1 = generateRequestId();
  const id2 = generateRequestId();
  assert.ok(id1.startsWith("req_"));
  assert.ok(id2.startsWith("req_"));
  assert.notEqual(id1, id2);
});

test("Logger child inherits parent context", () => {
  const parent = new Logger({ context: { service: "cyberstore-api" }, reqId: "req_123" });
  const child = parent.child({ module: "payments", orderId: 99 });
  assert.equal(child.reqId, "req_123");
});
