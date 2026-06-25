/**
 * Seed script for local/demo data.
 * Creates demo@nexus.com / Demo@1234! with deterministic balances and ledger history.
 */
import "../src/config/dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SUPPORTED_TOKENS = ["BRL", "BTC", "ETH", "USDT"] as const;

type SeedToken = (typeof SUPPORTED_TOKENS)[number];

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

async function main() {
	const name = "Demo User";
	const username = "demouser";
	const email = "demo@nexus.com";
	const password = "Demo@1234!";

	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		console.log(`Seed: removing previous demo user id=${existing.id}`);
		await prisma.user.delete({ where: { id: existing.id } });
	}

	const user = await prisma.user.create({
		data: {
			name,
			username,
			email,
			passwordHash: await bcrypt.hash(password, 10),
		},
	});

	const wallet = await prisma.wallet.create({ data: { userId: user.id } });

	const finalBalances: Record<SeedToken, string> = {
		BRL: "10000.00",
		BTC: "0.045",
		ETH: "0.85",
		USDT: "350.00",
	};

	await prisma.balance.createMany({
		data: SUPPORTED_TOKENS.map((token) => ({
			walletId: wallet.id,
			token,
			amount: finalBalances[token],
		})),
	});

	console.log("Seed: creating demo ledger history...");

	await prisma.transaction.create({
		data: {
			userId: user.id,
			type: "DEPOSIT",
			tokenTo: "BRL",
			amountTo: "20000.00",
			createdAt: daysAgo(5),
			movements: {
				create: {
					walletId: wallet.id,
					type: "DEPOSIT",
					token: "BRL",
					amount: "20000.00",
					balanceBefore: "0.00",
					balanceAfter: "20000.00",
				},
			},
		},
	});

	await prisma.transaction.create({
		data: {
			userId: user.id,
			type: "SWAP",
			tokenFrom: "BRL",
			amountFrom: "7000.00",
			tokenTo: "BTC",
			amountTo: "0.045",
			feeAmount: "0.00068528",
			feeToken: "BTC",
			rate: "0.000006528",
			createdAt: daysAgo(3),
			movements: {
				createMany: {
					data: [
						{
							walletId: wallet.id,
							type: "SWAP_OUT",
							token: "BRL",
							amount: "-7000.00",
							balanceBefore: "20000.00",
							balanceAfter: "13000.00",
						},
						{
							walletId: wallet.id,
							type: "SWAP_FEE",
							token: "BTC",
							amount: "-0.00068528",
							balanceBefore: "0.00000000",
							balanceAfter: "-0.00068528",
						},
						{
							walletId: wallet.id,
							type: "SWAP_IN",
							token: "BTC",
							amount: "0.04568528",
							balanceBefore: "-0.00068528",
							balanceAfter: "0.04500000",
						},
					],
				},
			},
		},
	});

	await prisma.transaction.create({
		data: {
			userId: user.id,
			type: "SWAP",
			tokenFrom: "BRL",
			amountFrom: "2850.00",
			tokenTo: "ETH",
			amountTo: "0.85",
			feeAmount: "0.01294416",
			feeToken: "ETH",
			rate: "0.0003027874",
			createdAt: daysAgo(2),
			movements: {
				createMany: {
					data: [
						{
							walletId: wallet.id,
							type: "SWAP_OUT",
							token: "BRL",
							amount: "-2850.00",
							balanceBefore: "13000.00",
							balanceAfter: "10150.00",
						},
						{
							walletId: wallet.id,
							type: "SWAP_FEE",
							token: "ETH",
							amount: "-0.01294416",
							balanceBefore: "0.00000000",
							balanceAfter: "-0.01294416",
						},
						{
							walletId: wallet.id,
							type: "SWAP_IN",
							token: "ETH",
							amount: "0.86294416",
							balanceBefore: "-0.01294416",
							balanceAfter: "0.85000000",
						},
					],
				},
			},
		},
	});

	await prisma.transaction.create({
		data: {
			userId: user.id,
			type: "WITHDRAWAL",
			tokenFrom: "BRL",
			amountFrom: "150.00",
			createdAt: daysAgo(1),
			movements: {
				create: {
					walletId: wallet.id,
					type: "WITHDRAWAL",
					token: "BRL",
					amount: "-150.00",
					balanceBefore: "10150.00",
					balanceAfter: "10000.00",
				},
			},
		},
	});

	await prisma.transaction.create({
		data: {
			userId: user.id,
			type: "DEPOSIT",
			tokenTo: "USDT",
			amountTo: "350.00",
			createdAt: hoursAgo(12),
			movements: {
				create: {
					walletId: wallet.id,
					type: "DEPOSIT",
					token: "USDT",
					amount: "350.00",
					balanceBefore: "0.00",
					balanceAfter: "350.00",
				},
			},
		},
	});

	console.log(`Seed: created ${email} / ${password} (id=${user.id}).`);
	console.log("Seed: balances BRL=10000, BTC=0.045, ETH=0.85, USDT=350.");
	console.log("Seed: created 5 transactions.");
}

main()
	.catch((error) => {
		console.error("Seed failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
