"use client";
import { AppBar, Box, Container, Toolbar } from "@mui/material";
import { grey } from "@mui/material/colors";

import ConnectWalletButton from "./ConnectWalletButton";
import { useContract } from "./ContractProvider";

const styles = {
	appBar: { backgroundColor: grey[900] },
	navigationMobileWrap: { display: { xs: "flex", md: "none" }, flexGrow: 1, alignItems: "center", mr: 1 },
	navigationMobileMenu: { display: { xs: "block", md: "none" } },
	navigationDesktopWrap: { display: { xs: "none", md: "flex" }, flexGrow: 1, alignItems: "center" },
	logoMobile: {
		mx: 2,
		display: { xs: "flex", md: "none" },
		fontFamily: "monospace",
		fontWeight: 700,
		letterSpacing: ".3rem",
		color: "inherit",
		textDecoration: "none",
	},
	logoDesktop: {
		mr: 2,
		display: { xs: "none", md: "flex" },
		fontFamily: "monospace",
		fontWeight: 700,
		letterSpacing: ".3rem",
		color: "inherit",
		textDecoration: "none",
	},
	navigationLink: { my: 2, color: "white", display: "block" },
	userConnectedButton: { px: 2, py: 0.75 },
	userAvatar: { ml: 1, width: "24px", height: "24px", flexGrow: 0, fontSize: "12px" },
	userMenuWrap: { flexGrow: 0 },
	userMenu: { mt: "45px" },
};

const AppHeader = () => {
	// Hooks
	const { link } = useContract();

	return (
		<AppBar position="static" elevation={0} sx={styles.appBar}>
			<Container maxWidth="xl">
				<Toolbar disableGutters>
					{/* User Menu */}
					<Box sx={styles.userMenuWrap}>{link ? <></> : <ConnectWalletButton />}</Box>
				</Toolbar>
			</Container>
		</AppBar>
	);
};

export default AppHeader;
