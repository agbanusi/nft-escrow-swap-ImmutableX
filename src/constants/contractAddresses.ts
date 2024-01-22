import { Abi, Address, getAddress } from "viem";
import { sepolia } from "wagmi";

import { simpleNftABI } from "../../abis/SimpleNFT";
import { providers } from "ethers";

export type ContractABIPair = {
	ADDRESS: Address;
	ABI: Abi;
};

// TODO: Add in contract deployments and their ABIs for each network supported
type ContractDeployments = {
	NFT_COLLECTION: ContractABIPair;
	ESCROW: {
		address: string;
		privateKey: string;
		ethAddress: string;
		ethPrivate: string;
	};
	RPC: any;
};

const SEPOLIA: ContractDeployments = {
	// SimpleNFT: https://sepolia.etherscan.io/address/0x1cfD246a218b35e359584979dDBeAD1f567d9C88
	NFT_COLLECTION: {
		ADDRESS: "0x7d5524041A6630352C761ddBB360226e0e6140EF",
		ABI: simpleNftABI,
	},
	ESCROW: {
		address: "0x07df12fc4fe9a0a083ba62cb529aa7ed7aff0ba89e5dc1360acc5f80589b6f3c",
		privateKey: "fb4d74c010c79e3081e0f18809fbc48e4603072f66802391b5751b5621673",
		ethAddress: "0xa599B33A20E7c6A4316098A5Bd36389Fe61AE1ed",
		ethPrivate: "0x304909a9bc74ad315f6efd26ba0b0cb564df331b3e05deaf9b4b9b910cad416f",
	},
	RPC: new providers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/FYrXfSN4J2gxmrfCrm-5HUcXO9EMmM30", {
		name: "sepolia",
		chainId: 11155111,
	}),
};

const CONTRACTS = {
	SEPOLIA,
};

export default CONTRACTS;
