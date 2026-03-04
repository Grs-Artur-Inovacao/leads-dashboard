"use server"

import fs from "fs/promises"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"
import yaml from "js-yaml"

const execAsync = promisify(exec)

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME

const PROMPTS_ROOT = "C:\\Users\\inovacao02\\OneDrive - Alltech Tools do Brasil Ltda\\Documentos\\Prompts-Allconnect"
const SDR_PATH = path.join(PROMPTS_ROOT, "SDR")
const RECIPES_PATH = path.join(SDR_PATH, "recipes")

export interface RecipeComponent {
    path: string
    title?: string
}

export interface Recipe {
    name: string
    output_filename: string
    components: RecipeComponent[]
}

export async function listRecipes() {
    try {
        const files = await fs.readdir(RECIPES_PATH)
        return files.filter(f => f.endsWith(".yaml") || f.endsWith(".yml"))
    } catch (error) {
        console.error("Error listing recipes:", error)
        return []
    }
}

export async function getRecipe(filename: string): Promise<Recipe | null> {
    try {
        const filePath = path.join(RECIPES_PATH, filename)
        const content = await fs.readFile(filePath, "utf8")
        const data = yaml.load(content) as any

        let lastTitle = "Geral"
        const components = (data.components || []).map((c: string) => {
            if (c.includes("|")) {
                const [p, title] = c.split("|").map(s => s.trim())
                lastTitle = title
                return { path: p, title }
            }
            return { path: c.trim(), title: lastTitle }
        })

        return {
            name: data.name,
            output_filename: data.output_filename,
            components
        }
    } catch (error) {
        console.error(`Error reading recipe ${filename}:`, error)
        return null
    }
}

export async function getModuleContent(modulePath: string) {
    try {
        const filePath = path.join(SDR_PATH, modulePath)
        return await fs.readFile(filePath, "utf8")
    } catch (error) {
        console.error(`Error reading module ${modulePath}:`, error)
        return "Erro ao carregar conteúdo do módulo."
    }
}

export async function runBuild() {
    try {
        const { stdout, stderr } = await execAsync("python build_manager.py", { cwd: SDR_PATH })
        return { success: true, output: stdout, error: stderr }
    } catch (error: any) {
        console.error("Error running build:", error)
        return { success: false, output: error.stdout, error: error.message }
    }
}

export async function syncWithGithub() {
    try {
        // We'll target the 'main' branch as requested
        const branch = "main"

        // Perform git pull
        const { stdout, stderr } = await execAsync(`git pull origin ${branch}`, { cwd: PROMPTS_ROOT })

        return {
            success: true,
            output: stdout,
            error: stderr,
            branch: branch,
            timestamp: new Date().toISOString()
        }
    } catch (error: any) {
        console.error("Error syncing with GitHub:", error)
        return {
            success: false,
            output: error?.stdout || "",
            error: error?.message || "Unknown error during sync",
            branch: "main",
            timestamp: new Date().toISOString()
        }
    }
}
