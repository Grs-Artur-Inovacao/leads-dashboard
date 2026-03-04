"use server"

import fs from "fs/promises"
import fs_sync from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"
import yaml from "js-yaml"

const execAsync = promisify(exec)

// Environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME

const PROMPTS_ROOT = "C:/Users/inovacao02/OneDrive - Alltech Tools do Brasil Ltda/Documentos/Prompts-Allconnect"
const SDR_PATH = path.join(PROMPTS_ROOT, "SDR").replace(/\\/g, '/')
const RECIPES_PATH = path.join(SDR_PATH, "recipes").replace(/\\/g, '/')

export interface RecipeComponent {
    path: string
    title?: string
}

export interface Recipe {
    name: string
    output_filename: string
    components: RecipeComponent[]
}

// Helper to determine if we should use GitHub API
const useGitHubApi = () => {
    // If we're on Vercel OR the local path doesn't exist, we must use the API
    return process.env.VERCEL === "1" || !fs_sync.existsSync(PROMPTS_ROOT);
}

// Universal fetcher for GitHub content
async function fetchFromGitHub(repoPath: string, isRaw = false) {
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
        throw new Error("GitHub configuration missing (token, owner or repo name)")
    }

    const url = isRaw
        ? `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/main/${repoPath}`
        : `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${repoPath}`

    const response = await fetch(url, {
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Accept": isRaw ? "application/vnd.github.v3.raw" : "application/vnd.github.v3+json",
            "User-Agent": "Leads-Dashboard"
        },
        cache: 'no-store'
    })

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText} for ${url}`)
    }

    return isRaw ? response.text() : response.json()
}

export async function listRecipes() {
    const logFile = path.join(process.cwd(), "debug.log")
    const log = (msg: string) => {
        try { fs_sync.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`) } catch (e) { }
    }

    try {
        if (useGitHubApi()) {
            log("LIST: Using GitHub API (Production/Vercel mode)")
            const contents = await fetchFromGitHub("SDR/recipes")
            const files = Array.isArray(contents)
                ? contents.filter(item => item.type === "file" && (item.name.endsWith(".yaml") || item.name.endsWith(".yml")))
                : []
            const names = files.map(f => f.name)
            log("LIST API: " + JSON.stringify(names))
            return names
        } else {
            log("LIST: Using Local Disk")
            const files = await fs.readdir(RECIPES_PATH)
            const filtered = files.filter(f => f.endsWith(".yaml") || f.endsWith(".yml"))
            return filtered
        }
    } catch (error: any) {
        log("LIST ERROR: " + error.message)
        return []
    }
}

export async function getRecipe(filename: string): Promise<Recipe | null> {
    try {
        let content: string

        if (useGitHubApi()) {
            content = await fetchFromGitHub(`SDR/recipes/${filename}`, true)
        } else {
            const filePath = path.join(RECIPES_PATH, filename)
            content = await fs.readFile(filePath, "utf8")
        }

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
        if (useGitHubApi()) {
            return await fetchFromGitHub(`SDR/${modulePath}`, true)
        } else {
            const filePath = path.join(SDR_PATH, modulePath)
            return await fs.readFile(filePath, "utf8")
        }
    } catch (error) {
        console.error(`Error reading module ${modulePath}:`, error)
        return "Erro ao carregar conteúdo do módulo."
    }
}

export async function runBuild() {
    if (useGitHubApi()) return { success: false, error: "Build not available in production mode." }

    try {
        const { stdout, stderr } = await execAsync("python build_manager.py", { cwd: SDR_PATH })
        return { success: true, output: stdout, error: stderr }
    } catch (error: any) {
        console.error("Error running build:", error)
        return { success: false, output: error.stdout, error: error.message }
    }
}

export async function syncWithGithub() {
    // In Vercel mode, sync is redundant since we fetch directly
    if (useGitHubApi()) return { success: true, message: "Production mode: Auto-fetching latest from GitHub." }

    try {
        const branch = "main"
        const logFile = path.join(process.cwd(), "debug.log")
        const log = (msg: string) => { try { fs_sync.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`) } catch (e) { } }

        log("SYNC: Starting local sync in " + PROMPTS_ROOT)
        const { stdout, stderr } = await execAsync(`git pull origin ${branch}`, { cwd: PROMPTS_ROOT })
        log("SYNC OK: " + stdout)

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
