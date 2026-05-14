import { auth } from "./apps/frontend/src/server/auth/auth";

async function check() {
    console.log("Auth keys:", Object.keys(auth));
    if (auth.api) {
        console.log("Auth API keys:", Object.keys(auth.api));
    } else {
        console.log("Auth API is undefined");
    }
}

check().catch(console.error);
