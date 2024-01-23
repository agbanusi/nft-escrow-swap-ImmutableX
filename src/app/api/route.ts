import { NextResponse } from "next/server";
import path from "path";

import fs from "fs/promises";
// GET /api
export async function GET(req: Request) {
	try {
		// Get params
		const data = await fs.readFile(process.cwd() + "/src/app/api/txn.json", "utf8");
		return NextResponse.json(JSON.parse(data));
	} catch (error: any) {
		return NextResponse.json({ error });
	}
}

// POST /api
export async function POST(req: Request) {
	try {
		const txn = await fs.readFile(process.cwd() + "/src/app/api/txn.json", "utf8");
		const { data, id } = await req.json();
		const trans = JSON.parse(txn);
		trans[id] = data;

		await fs.writeFile(process.cwd() + "/src/app/api/txn.json", JSON.stringify(trans));

		// Return success
		return NextResponse.json({ status: true });
	} catch (error: any) {
		return NextResponse.json({ error });
	}
}

// PATCH /api
export async function PATCH(req: Request) {
	try {
		const txn = await fs.readFile(process.cwd() + "/src/app/api/txn.json", "utf8");
		const { data, id } = await req.json();
		const trans = JSON.parse(txn);
		trans[id] = { ...trans[id], ...data };

		await fs.writeFile(process.cwd() + "/src/app/api/txn.json", JSON.stringify(trans));

		// Return success
		return NextResponse.json({ status: true });
	} catch (error: any) {
		return NextResponse.json({ error });
	}
}
