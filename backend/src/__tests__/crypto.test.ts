import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "../utils/crypto";

describe("Crypto Webhook Signature Verification Tests", () => {
	const secret = "super-secret-key-12345";
	const sampleBody = {
		userId: "user-123",
		token: "BTC",
		amount: "0.1",
		idempotencyKey: "key-123",
	};

	it("should successfully verify a correct signature", () => {
		const payload = JSON.stringify(sampleBody);
		const signature = crypto
			.createHmac("sha256", secret)
			.update(payload)
			.digest("hex");

		const isValid = verifyWebhookSignature(sampleBody, signature, secret);
		expect(isValid).toBe(true);
	});

	it("should fail verification for incorrect signature", () => {
		const isValid = verifyWebhookSignature(
			sampleBody,
			"wrong-signature-hash",
			secret,
		);
		expect(isValid).toBe(false);
	});

	it("should fail verification for missing signature", () => {
		const isValid = verifyWebhookSignature(sampleBody, undefined, secret);
		expect(isValid).toBe(false);
	});

	it("should fail verification for different payload body", () => {
		const payload = JSON.stringify(sampleBody);
		const signature = crypto
			.createHmac("sha256", secret)
			.update(payload)
			.digest("hex");

		const modifiedBody = { ...sampleBody, amount: "0.2" };
		const isValid = verifyWebhookSignature(modifiedBody, signature, secret);
		expect(isValid).toBe(false);
	});
});
