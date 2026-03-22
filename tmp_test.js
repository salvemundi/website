const secret = "FZiv2qnlsnHIxr9OWLJyVzgLVU9AOhvxVDSKTPQkPCK059XfUXD4OKXFqLilMbuh7TAAC1Py/BCGuD3DlwGPvw==";
const tokenFromEnv = secret.replace(/^"|"$/g, '').trim();
const authHeader = "Bearer " + tokenFromEnv;
const expected = "Bearer " + tokenFromEnv;
console.log("Check:", authHeader === expected);
