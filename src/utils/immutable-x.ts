// utils/immutableX.js

import { ERC721TokenType, ImmutableAssetStatus, ImmutableXClient, Link } from "@imtbl/imx-sdk";
import { generateStarkPrivateKey, createStarkSigner, Config, ImmutableX } from "@imtbl/core-sdk";
import { Wallet, providers } from "ethers";
import { CONTRACTS } from "@/constants";

const API_URL = "https://api.sandbox.x.immutable.com/v1";

function makeid(length: number = 10) {
	let result = "";
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
}

async function checkUserAssets(user: string, collection: string, tokenId: string) {
	const client = await ImmutableXClient.build({ publicApiUrl: API_URL });
	let assets: any[] = [];
	let assetCursor;

	do {
		const assetRequest = await client.getAssets({
			user,
			status: ImmutableAssetStatus.eth,
			collection: collection,
		});
		assets = assets.concat(assetRequest.result);
		assetCursor = (assetRequest?.remaining || 0) > 0;
	} while (assetCursor);

	for (const asset of assets) {
		if (asset.token_id == tokenId) {
			return true;
		}
	}
	alert("this wallet do not have this asset");
	return false;
}

async function checkIMXUserAssets(user: string, collection: string, tokenId: string) {
	const client = await ImmutableXClient.build({ publicApiUrl: API_URL });
	let assets: any[] = [];
	let assetCursor;

	do {
		const assetRequest = await client.getAssets({
			user,
			status: ImmutableAssetStatus.imx,
			collection: collection,
		});
		assets = assets.concat(assetRequest.result);
		assetCursor = (assetRequest?.remaining || 0) > 0;
	} while (assetCursor);

	for (const asset of assets) {
		if (asset.token_id == tokenId) {
			return true;
		}
	}
	return false;
}

const depositOrder = async (address: string, tokenAddress: string, tokenId: string, receiver: string, link: Link) => {
	const deposited = await checkIMXUserAssets(address, tokenAddress, tokenId);
	if (!deposited) {
		const checked = await checkUserAssets(address as string, tokenAddress, tokenId);

		if (!checked) {
			return null;
		}

		await link.deposit({
			type: ERC721TokenType.ERC721,
			tokenId,
			tokenAddress,
		});

		await sleep(120000); //sleep for 2 mins to allow sync of bc data
	}

	console.log("done first");

	const response = await link.batchNftTransfer([
		{
			type: ERC721TokenType.ERC721,
			tokenId,
			tokenAddress,
			toAddress: receiver,
		},
	]);

	return response;
};

export const getIMXRequests = async (id?: string) => {
	const jsondata = await fetch("/api");
	const data = await jsondata.json();
	if (id) {
		return data[id];
	}
	return data;
};

export const addIMXRequest = async (data: any, id: string) => {
	const jsondata = await fetch("/api", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			data,
			id,
		}),
	});

	await jsondata.json();
};

export const getAvailableClaims = async (user: string) => {
	const jsondata = await fetch("/claims");
	const data = await jsondata.json();
	if (user && data[user]) {
		return data[user];
	}
	return [];
};

export const addClaim = async (data: any, user: string) => {
	const jsondata = await fetch("/claims", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			data,
			user,
		}),
	});

	await jsondata.json();
};

export const deleteClaim = async (id: any, user: string) => {
	const jsondata = await fetch("/claims", {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			id,
			user,
		}),
	});

	await jsondata.json();
};

const sleep = (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

export const updateIMXRequest = async (data: any, id: string) => {
	const jsondata = await fetch("/api", {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			data,
			id,
		}),
	});

	await jsondata.json();
};

export const createOrder = async (link: Link, tokenAddress: string, tokenId: string, neededTokenId: string) => {
	const address = localStorage.getItem("WALLET_ADDRESS");
	const starkPrivateKey = CONTRACTS.SEPOLIA.ESCROW.privateKey;
	const starkSigner = createStarkSigner(starkPrivateKey);
	const escrowWallet = CONTRACTS.SEPOLIA.ESCROW.address;
	const provider = CONTRACTS.SEPOLIA.RPC;
	const wallet = new Wallet(CONTRACTS.SEPOLIA.ESCROW.ethPrivate).connect(provider);
	const walletConnection = { ethSigner: wallet, starkSigner };
	const config = Config.SANDBOX;
	const client = new ImmutableX(config);

	await client.registerOffchain(walletConnection);

	const response = await depositOrder(address as string, tokenAddress, tokenId, wallet.address, link);

	const orderId = makeid();

	if (response?.result[0].status == "success") {
		addIMXRequest(
			{
				escrow: {
					address: escrowWallet,
					privateKey: starkPrivateKey,
					"eth-address": wallet.address,
					"eth-private": wallet.privateKey,
				},
				players: {
					playerA: {
						address,
						tokenId,
					},
					playerB: {
						tokenId: neededTokenId,
						address: "",
					},
				},
				collection: tokenAddress,
				status: "pending",
				orderId,
			},
			orderId,
		);
		return response;
	}

	return response;
};

export const takeOrder = async (link: Link, tokenAddress: string, orderId: string) => {
	const address = localStorage.getItem("WALLET_ADDRESS");
	const order = await getIMXRequests(orderId);

	if (!order) {
		throw new Error("Invalid Order");
	}

	const response = await depositOrder(
		address as string,
		tokenAddress,
		order.players.playerB.tokenId,
		order.escrow["eth-address"],
		link,
	);

	if (response?.result[0].status == "success") {
		order["status"] = "success";
		order["players"]["playerB"]["address"] = address;
		await updateIMXRequest(order, orderId);
		return response;
	}

	return null;
};

export const fulfillOrder = async (orderId: string) => {
	const order = await getIMXRequests(orderId);
	const signer = createStarkSigner(CONTRACTS.SEPOLIA.ESCROW.privateKey);
	const provider = CONTRACTS.SEPOLIA.RPC;
	const ethSigner = new Wallet(CONTRACTS.SEPOLIA.ESCROW.ethPrivate).connect(provider);
	const walletConnection = { ethSigner, starkSigner: signer };
	const config = Config.SANDBOX;
	const client = new ImmutableX(config);

	client.registerOffchain(walletConnection);

	const unsignedTransferRequest = {
		type: ERC721TokenType.ERC721,
		tokenId: order.players.playerA.tokenId,
		tokenAddress: order.collection,
		receiver: order.players.playerB.address,
	};

	const unsignedTransferRequest2 = {
		type: ERC721TokenType.ERC721,
		tokenId: order.players.playerB.tokenId,
		tokenAddress: order.collection,
		receiver: order.players.playerA.address,
	};

	const response = await client.transfer(walletConnection, unsignedTransferRequest);

	const response2 = await client.transfer(walletConnection, unsignedTransferRequest2);

	// console.log(response, response2);
	await addClaim(
		{ tokenAddress: order.collection, tokenId: order.players.playerB.tokenId, orderId },
		order.players.playerA.address,
	);

	await addClaim(
		{ tokenAddress: order.collection, tokenId: order.players.playerA.tokenId, orderId },
		order.players.playerB.address,
	);

	return { response, response2 };
};

export const receiveAsset = async (link: Link, tokenAddress: string, orderId: string) => {
	const address = localStorage.getItem("WALLET_ADDRESS");
	const order = await getIMXRequests(orderId);

	const tokenId =
		order.players.playerA.address == address ? order.players.playerB.tokenId : order.players.playerA.tokenId;

	if (!order) {
		throw new Error("Invalid Order");
	}

	const response = await link.prepareWithdrawal({
		type: ERC721TokenType.ERC721,
		tokenAddress,
		tokenId,
	});

	await sleep(1 * 60 * 1000);

	if (response.withdrawalId) {
		const withdraw = await link.completeWithdrawal({
			type: ERC721TokenType.ERC721,
			tokenAddress,
			tokenId,
		});
		if (!withdraw.transactionId) {
			alert("withdrawal failed");
			return;
		}

		const claims = await getAvailableClaims(address as string);
		const id = claims.findIndex((cx: any) => cx.orderId == orderId);
		await deleteClaim(id, address as string);
		return withdraw.transactionId;
	}
	alert("withdrawal failed");
	return null;
};
