import { loginUserAction } from "../src/lib/actions";

async function main() {
  try {
    console.log("Attempting to log in as admin...");
    const res = await loginUserAction("admin@moonzthrift.com", "admin123");
    console.log("Login action response:", res);
  } catch (err) {
    console.error("Failed to run login test:", err);
  }
}

main();
