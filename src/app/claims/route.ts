import { NextResponse } from "next/server";
import path from "path";

import fs from "fs/promises";
// GET /claims
export async function GET(req: Request) {
	try {
		// Get params
		const data = await fs.readFile(process.cwd() + "/src/app/claims/txt.json", "utf8");
		return NextResponse.json(JSON.parse(data));
	} catch (error: any) {
		return NextResponse.json({ error });
	}
}

// POST /claims
export async function POST(req: Request) {
	try {
		const txn = await fs.readFile(process.cwd() + "/src/app/claims/txt.json", "utf8");
		const { data, user } = await req.json();
		const trans = JSON.parse(txn);
		if (!trans[user]) {
			trans[user] = [data];
		} else {
			trans[user] = [...trans[user], data];
		}

		await fs.writeFile(process.cwd() + "/src/app/claims/txt.json", JSON.stringify(trans));

		// Return success
		return NextResponse.json({ status: true });
	} catch (error: any) {
		return NextResponse.json({ error });
	}
}

export async function DELETE(req: Request) {
	try {
		const txn = await fs.readFile(process.cwd() + "/src/app/claims/txt.json", "utf8");
		const { user, id } = await req.json();
		const trans = JSON.parse(txn);
		if (trans[user]) {
			trans[user] = trans[user].splice(id, 1);
		}

		await fs.writeFile(process.cwd() + "/src/app/claims/txt.json", JSON.stringify(trans));

		// Return success
		return NextResponse.json({ status: true });
	} catch (error: any) {
		return NextResponse.json({ error });
	}
}
