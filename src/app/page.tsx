// pages/index.js
"use client";

import { useState } from "react";
import { createOrder, takeOrder, fulfillOrder } from "../utils/immutable-x";
import Transfer from "../utils/transfer";
import { useContract } from "@/components/ContractProvider";
import { CONTRACTS } from "@/constants";

export default function Home() {
	const [playerAAsset, setPlayerAAsset] = useState("");
	const [playerBAsset, setPlayerBAsset] = useState("");
	const { link } = useContract();
	const nft = CONTRACTS.SEPOLIA.NFT_COLLECTION.ADDRESS;

	const handleProposeTrade = async () => {
		// Create order on Immutable X for player A
		console.log("teet");
		await createOrder(link, nft as string, playerAAsset, playerBAsset);
	};

	const handleAcceptTrade = async (orderId: string) => {
		// Take the order on Immutable X for player B
		const orderB = await takeOrder(link, nft as string, orderId);

		// Fulfill the trade if assets match
		if (orderB) {
			await fulfillOrder(orderId);

			// Display success message
			alert("Trade successful! NFTs swapped.");
		} else {
			// Display error message if assets do not match
			alert("Trade failed! Assets do not match.");
		}
	};

	return (
		<div>
			<h1>Immutable X Escrow Swap System</h1>

			<div style={{ display: "grid" }}>
				<h2 style={{ marginBottom: "5px" }}> Player</h2>
				<input
					type="text"
					placeholder="Your Asset ID"
					value={playerAAsset}
					style={{ width: "100px", marginBottom: "5px" }}
					onChange={(e) => setPlayerAAsset(e.target.value)}
				/>
				<input
					type="text"
					placeholder="Needed Asset ID for Swap"
					value={playerBAsset}
					style={{ width: "100px", marginBottom: "5px" }}
					onChange={(e) => setPlayerBAsset(e.target.value)}
				/>
				<button style={{ width: "100px", marginBottom: "5px" }} onClick={handleProposeTrade}>
					Propose Trade
				</button>
			</div>

			<hr style={{ width: "100%", marginTop: "40px", borderBottomWidth: "1.5px", borderColor: "white" }} />

			<div style={{ marginTop: "40px" }}>
				<h2 style={{ marginBottom: "15px" }}>Get List of Swap Proposals</h2>
				<div>
					{Object.values(Transfer).map((txn: any, i: number) => (
						<div key={"key-" + i}>
							<hr
								style={{
									width: "100%",
									marginTop: "5px",
									marginBottom: "5px",
									borderBottomWidth: "1.5px",
									borderColor: "grey",
								}}
							/>
							<h4> NFT ADDRESS: {nft}</h4>
							<h4>
								Swap Token {txn.players.playerA.tokenId} for {txn.players.playerB.tokenId}
							</h4>
							<p>Status: started</p>
							<button onClick={() => handleAcceptTrade(txn.orderId)}>Accept Trade</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
