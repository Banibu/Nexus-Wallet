import Decimal from "decimal.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../config/prisma";
import { reconstructBalance } from "../modules/ledger/ledger.service";
import { execute, quote } from "../modules/swap/swap.service";
import { processDeposit } from "../modules/webhook/webhook.service";
import { requestWithdrawal } from "../modules/withdrawal/withdrawal.service";

// Mock @prisma/client directly to handle Prisma.Decimal and error classes
vi.mock("@prisma/client", () => {
	const Dec = require("decimal.js");

	class MockPrismaClient {
		// stub
	}

	class MockDecimal {
		value: string;
		constructor(v: any) {
			this.value = new Dec(v).toString();
		}
		toString() {
			return this.value;
		}
		// Prisma Decimal compatibility check methods
		toNumber() {
			return Number(this.value);
		}
		toFixed() {
			return this.value;
		}
	}

	class MockPrismaClientKnownRequestError extends Error {
		code: string;
		constructor(message: string, code: string) {
			super(message);
			this.code = code;
		}
	}

	return {
		PrismaClient: MockPrismaClient,
		Decimal: MockDecimal,
		Prisma: {
			Decimal: MockDecimal,
			PrismaClientKnownRequestError: MockPrismaClientKnownRequestError,
		},
	};
});

vi.mock("../config/prisma", () => {
	const mPrisma = {
		user: {
			findUnique: vi.fn(),
		},
		wallet: {
			findUnique: vi.fn(),
		},
		balance: {
			update: vi.fn(),
			findUnique: vi.fn(),
		},
		transaction: {
			findUnique: vi.fn(),
			create: vi.fn(),
		},
		movement: {
			create: vi.fn(),
			aggregate: vi.fn(),
		},
		$transaction: vi.fn((cb) => cb(mPrisma)),
		$queryRaw: vi.fn(),
	};
	return { prisma: mPrisma };
});

vi.mock("../config/redis", () => {
	return {
		redis: {
			get: vi.fn(),
			set: vi.fn(),
		},
	};
});

vi.mock("../lib/coingecko", () => {
	const Dec = require("decimal.js");
	return {
		getRate: vi.fn().mockResolvedValue({
			rate: new Dec(5.5),
			source: "mock",
			fetchedAt: new Date().toISOString(),
		}),
	};
});

describe("Nexus Wallet Services Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Deposit Webhook", () => {
		it("should process new deposit and credit balance", async () => {
			// Setup mock data
			const mockUser = {
				id: "user-123",
				wallet: {
					id: "wallet-123",
					balances: [{ token: "BRL", amount: new Decimal(0) }],
				},
			};

			vi.mocked(prisma.transaction.findUnique).mockResolvedValueOnce(null);
			vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);
			vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
				{
					id: "bal-123",
					walletId: "wallet-123",
					token: "BRL",
					amount: new Decimal(0),
				},
			]);
			vi.mocked(prisma.transaction.create).mockResolvedValueOnce({
				id: "tx-123",
			} as any);
			vi.mocked(prisma.movement.create).mockResolvedValueOnce({
				id: "mov-123",
			} as any);

			const res = await processDeposit({
				userId: "user-123",
				token: "BRL",
				amount: "100",
				idempotencyKey: "key-123",
			});

			expect(res.status).toBe("ok");
			expect(res.amount).toBe("100");
			expect(res.balanceBefore).toBe("0");
			expect(res.balanceAfter).toBe("100");
			expect(prisma.transaction.create).toHaveBeenCalled();
			expect(prisma.balance.update).toHaveBeenCalled();
		});

		it("should return duplicate status for existing idempotency key", async () => {
			vi.mocked(prisma.transaction.findUnique).mockResolvedValueOnce({
				id: "tx-existing",
				userId: "user-123",
				tokenTo: "BRL",
				amountTo: new Decimal(100),
				type: "DEPOSIT",
			} as any);

			const res = await processDeposit({
				userId: "user-123",
				token: "BRL",
				amount: "100",
				idempotencyKey: "key-123",
			});

			expect(res.status).toBe("duplicate");
			expect(res.transactionId).toBe("tx-existing");
			expect(prisma.user.findUnique).not.toHaveBeenCalled();
		});
	});

	describe("Swap Service", () => {
		it("should quote swap with 1.5% fee correctly", async () => {
			const res = await quote({
				fromToken: "BTC",
				toToken: "BRL",
				amount: "1",
			});

			expect(res.fromToken).toBe("BTC");
			expect(res.toToken).toBe("BRL");
			expect(res.amountIn).toBe("1");
			expect(res.feePercent).toBe("1.5");
			// Fee is in BRL (destination): 1 BTC * 5.5 = 5.5 BRL gross. 1.5% fee is 0.0825 BRL
			expect(res.feeAmount).toBe("0.0825");
			expect(res.feeToken).toBe("BRL");
			// 5.5 - 0.0825 = 5.4175 BRL
			expect(res.amountOut).toBe("5.4175");
		});

		it("should execute swap and deduct balances", async () => {
			const mockWallet = { id: "wallet-123" };
			vi.mocked(prisma.wallet.findUnique).mockResolvedValueOnce(
				mockWallet as any,
			);

			// Sorted alphabetically: BRL then BTC
			vi.mocked(prisma.$queryRaw)
				.mockResolvedValueOnce([
					{
						id: "bal-brl",
						walletId: "wallet-123",
						token: "BRL",
						amount: new Decimal(0),
					},
				])
				.mockResolvedValueOnce([
					{
						id: "bal-btc",
						walletId: "wallet-123",
						token: "BTC",
						amount: new Decimal(2),
					},
				]);
			vi.mocked(prisma.transaction.create).mockResolvedValueOnce({
				id: "tx-swap-123",
			} as any);

			const res = await execute("user-123", {
				fromToken: "BTC",
				toToken: "BRL",
				amount: "1",
			});

			expect(res.transactionId).toBe("tx-swap-123");
			expect(res.amountIn).toBe("1");
			expect(res.amountOut).toBe("5.4175");
			expect(prisma.movement.create).toHaveBeenCalledTimes(3); // swap_out, swap_fee, swap_in
			expect(prisma.balance.update).toHaveBeenCalledTimes(2);
		});

		it("should fail swap if balance is insufficient", async () => {
			const mockWallet = { id: "wallet-123" };
			vi.mocked(prisma.wallet.findUnique).mockResolvedValueOnce(
				mockWallet as any,
			);

			// Sorted alphabetically: BRL then BTC
			vi.mocked(prisma.$queryRaw)
				.mockResolvedValueOnce([
					{
						id: "bal-brl",
						walletId: "wallet-123",
						token: "BRL",
						amount: new Decimal(0),
					},
				])
				.mockResolvedValueOnce([
					{
						id: "bal-btc",
						walletId: "wallet-123",
						token: "BTC",
						amount: new Decimal(0.5),
					}, // insufficient
				]);

			await expect(
				execute("user-123", {
					fromToken: "BTC",
					toToken: "BRL",
					amount: "1",
				}),
			).rejects.toThrow("Saldo insuficiente");
		});
	});

	describe("Withdrawal Service", () => {
		it("should execute withdrawal if balance is sufficient", async () => {
			const mockWallet = { id: "wallet-123" };
			vi.mocked(prisma.wallet.findUnique).mockResolvedValueOnce(
				mockWallet as any,
			);
			vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
				{
					id: "bal-brl",
					walletId: "wallet-123",
					token: "BRL",
					amount: new Decimal(100),
				},
			]);
			vi.mocked(prisma.transaction.create).mockResolvedValueOnce({
				id: "tx-withdraw-123",
			} as any);
			vi.mocked(prisma.movement.create).mockResolvedValueOnce({
				id: "mov-withdraw-123",
			} as any);

			const res = await requestWithdrawal("user-123", {
				token: "BRL",
				amount: "40",
				destinationAddress: "bank-acc-123",
			});

			expect(res.status).toBe("ok");
			expect(res.balanceBefore).toBe("100");
			expect(res.balanceAfter).toBe("60");
			expect(prisma.balance.update).toHaveBeenCalled();
			expect(prisma.movement.create).toHaveBeenCalled();
		});

		it("should fail withdrawal if balance is insufficient", async () => {
			const mockWallet = { id: "wallet-123" };
			vi.mocked(prisma.wallet.findUnique).mockResolvedValueOnce(
				mockWallet as any,
			);
			vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
				{
					id: "bal-brl",
					walletId: "wallet-123",
					token: "BRL",
					amount: new Decimal(10),
				},
			]);

			await expect(
				requestWithdrawal("user-123", {
					token: "BRL",
					amount: "40",
				}),
			).rejects.toThrow("Saldo insuficiente");
		});
	});

	describe("Ledger auditability / Balance reconstruction", () => {
		it("should reconstruct current balance by summing ledger movements", async () => {
			const mockWallet = { id: "wallet-123" };
			vi.mocked(prisma.wallet.findUnique).mockResolvedValueOnce(
				mockWallet as any,
			);
			vi.mocked(prisma.movement.aggregate).mockResolvedValueOnce({
				_sum: { amount: new Decimal(64.175) },
			} as any);
			vi.mocked(prisma.balance.findUnique).mockResolvedValueOnce({
				amount: new Decimal(64.175),
			} as any);

			const res = await reconstructBalance("user-123", "BRL");

			expect(res.token).toBe("BRL");
			expect(res.reconstructed).toBe("64.175");
			expect(res.stored).toBe("64.175");
			expect(res.consistent).toBe(true);
		});
	});
});
