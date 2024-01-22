// utils/immutableX.js

import { ERC721TokenType, ImmutableAssetStatus, ImmutableXClient, Link } from "@imtbl/imx-sdk";
import { generateStarkPrivateKey, createStarkSigner, Config, ImmutableX } from "@imtbl/core-sdk";
import { Wallet, providers } from "ethers";
import Transfer from "./transfer";
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

const depositOrder = async (address: string, tokenAddress: string, tokenId: string, receiver: string, link: Link) => {
	const checked = await checkUserAssets(address as string, tokenAddress, tokenId);

	if (!checked) {
		return null;
	}

	await link.deposit({
		type: ERC721TokenType.ERC721,
		tokenId,
		tokenAddress,
	});

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

	console.log(response?.result);

	const orderId = makeid();

	if (response?.result[0].status == "success") {
		Transfer[orderId] = {
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
		};
		return response;
	}

	return response;
};

export const takeOrder = async (link: Link, tokenAddress: string, orderId: string) => {
	const address = localStorage.getItem("WALLET_ADDRESS");
	const order = Transfer[orderId];

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
		Transfer[orderId]["persons"]["playerB"]["address"] = address;
		return response;
	}
	return null;
};

export const fulfillOrder = async (orderId: string) => {
	const order = Transfer[orderId];
	const signer = createStarkSigner(CONTRACTS.SEPOLIA.ESCROW.privateKey);
	const ethSigner = new Wallet(CONTRACTS.SEPOLIA.ESCROW.ethPrivate).connect(new providers.JsonRpcProvider());
	const walletConnection = { ethSigner, starkSigner: signer };
	const config = Config.SANDBOX;
	const client = new ImmutableX(config);

	client.registerOffchain(walletConnection);

	const unsignedTransferRequest = {
		type: ERC721TokenType.ERC721,
		tokenId: order.players.playerA.tokenId,
		tokenAddress: order.collection,
		receiver: order.players.playerB.tokenId,
	};

	const unsignedTransferRequest2 = {
		type: ERC721TokenType.ERC721,
		tokenId: order.players.playerB.tokenId,
		tokenAddress: order.collection,
		receiver: order.players.playerA.tokenId,
	};

	const response = await client.transfer(walletConnection, unsignedTransferRequest);

	const response2 = await client.transfer(walletConnection, unsignedTransferRequest2);

	console.log(response, response2);

	return { response, response2 };
};
