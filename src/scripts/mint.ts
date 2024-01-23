import { Wallet, Contract } from "ethers";
import { CONTRACTS } from "../constants/index";

async function mintNFT() {
	const provider = CONTRACTS.SEPOLIA.RPC;
	const wallet = new Wallet(CONTRACTS.SEPOLIA.ESCROW.ethPrivate).connect(provider);

	const simpleNFTContract = new Contract(
		CONTRACTS.SEPOLIA.NFT_COLLECTION.ADDRESS,
		JSON.stringify(CONTRACTS.SEPOLIA.NFT_COLLECTION.ABI),
		wallet,
	);

	try {
		const args = process.argv.slice(2);
		const recipientAddress = args[0];
		// Replace 'metadataURI' with the actual metadata URI and other arguments as needed
		const transaction = await simpleNFTContract.safeMint(recipientAddress);
		await transaction.wait();

		console.log("NFT minted successfully!");
	} catch (error: any) {
		console.error("Error minting NFT:", error.message);
	}
}

mintNFT();
