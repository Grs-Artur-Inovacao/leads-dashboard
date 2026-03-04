import { listRecipes, getRecipe, getModuleContent } from "../lib/actions/prompt-actions";

async function runTests() {
    console.log("--- Testing Prompt Actions ---");

    // 1. List Recipes
    console.log("\n1. Listing Recipes...");
    const recipes = await listRecipes();
    console.log("Found recipes:", recipes);

    if (recipes.length === 0) {
        console.error("No recipes found! Check the PROMPTS_ROOT path.");
        return;
    }

    // 2. Get Renata v2 Recipe
    const targetRecipe = recipes.includes("renata_v2.yaml") ? "renata_v2.yaml" : recipes[0];
    console.log(`\n2. Getting Recipe: ${targetRecipe}...`);
    const recipe = await getRecipe(targetRecipe);
    if (recipe) {
        console.log("Recipe Name:", recipe.name);
        console.log("Components Count:", recipe.components.length);

        // 3. Get Module Content
        if (recipe.components.length > 0) {
            const firstMod = recipe.components[0];
            console.log(`\n3. Reading Module: ${firstMod.path}...`);
            const content = await getModuleContent(firstMod.path);
            console.log("Content Preview (50 chars):", content.substring(0, 50).replace(/\n/g, "\\n") + "...");
        }
    } else {
        console.error("Failed to get recipe!");
    }

    console.log("\n--- Tests Completed ---");
}

runTests().catch(err => {
    console.error("Test execution failed:", err);
});
