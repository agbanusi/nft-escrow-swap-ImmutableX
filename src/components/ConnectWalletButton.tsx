import { Button, Typography } from "@mui/material";
import { Link, ProviderPreference } from "@imtbl/imx-sdk";
import { useContract } from "@/components/ContractProvider";

const styles = {
	button: {
		py: 1,
	},
	walletText: {
		pl: 1,
	},
};

const ConnectWalletButton = (): JSX.Element => {
	const link = new Link("https://link.sandbox.x.immutable.com");
	const { setLink } = useContract();

	async function setupAccount() {
		const { address, starkPublicKey } = await link.setup({});
		localStorage.setItem("WALLET_ADDRESS", address);
		localStorage.setItem("STARK_PUBLIC_KEY", starkPublicKey);
		setLink(link);
		console.log(address, starkPublicKey);
	}

	return (
		<>
			<Button
				id="connect-wallet-button"
				variant="contained"
				color="primary"
				size="small"
				sx={styles.button}
				onClick={() => setupAccount()}
			>
				Connect Wallet
			</Button>
		</>
	);
};

export default ConnectWalletButton;
