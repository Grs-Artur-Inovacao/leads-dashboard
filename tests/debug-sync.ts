
import { syncWithGithub, listRecipes } from "../lib/actions/prompt-actions";

async function debug() {
    console.log("--- Debugging Prompt Actions ---");

    console.log("1. Starting sync...");
    try {
        const syncResult = await syncWithGithub();
        console.log("Sync Result:", JSON.stringify(syncResult, null, 2));
    } catch (e) {
        console.error("Sync caught error:", e);
    }

    console.log("\n2. Listing recipes...");
    try {
        const recipes = await listRecipes();
        console.log("Recipes Result:", recipes);
    } catch (e) {
        console.error("List caught error:", e);
    }
}

debug();
