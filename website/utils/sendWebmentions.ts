#!/usr/bin/env tsx
/**
 * Automated Webmention Sender for Bridgy Publish
 *
 * This script sends webmentions to Bridgy after a successful build.
 * It can scan either the local build directory or the gh-pages branch.
 *
 * Usage:
 *   npm run send-webmentions                        # Dry-run, auto-detect source
 *   SEND_WEBMENTIONS=true npm run send-webmentions  # Actually send
 *   ONLY_RECENT=7 npm run send-webmentions          # Only posts from last 7 days
 *   POST_ID=19 npm run send-webmentions             # Only specific post
 *   SOURCE=gh-pages npm run send-webmentions        # Use gh-pages branch
 *   SOURCE=build npm run send-webmentions           # Use local build (default)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = "https://www.fretchen.eu";
const BRIDGY_ENDPOINT = "https://brid.gy/publish/webmention";
const BUILD_DIR = path.join(__dirname, "../build/client/blog");
const TEMP_PAGES_DIR = path.join(__dirname, "../.temp-gh-pages");

const BRIDGY_TARGETS = [
  "https://brid.gy/publish/mastodon",
  "https://brid.gy/publish/bluesky",
] as const;

interface WebmentionResult {
  success: boolean;
  status?: number;
  message?: string;
  responseText?: string;
}

interface BlogPostInfo {
  id: number;
  publishingDate?: string;
}

/**
 * Extract publishing date from HTML
 */
function extractPublishingDate(html: string): string | undefined {
  const match = html.match(/<time class="dt-published" dateTime="([^"]+)"/);
  return match ? match[1] : undefined;
}

/**
 * Setup gh-pages worktree for reading
 */
function setupGhPagesWorktree(): string {
  console.log("🔧 Setting up gh-pages worktree...");

  // Clean up if exists
  if (fs.existsSync(TEMP_PAGES_DIR)) {
    try {
      execSync(`git worktree remove ${TEMP_PAGES_DIR} --force`, { stdio: "ignore" });
    } catch {
      // Worktree might not be registered, just remove directory
      fs.rmSync(TEMP_PAGES_DIR, { recursive: true, force: true });
    }
  }

  // Create worktree from remote to ensure it's up-to-date
  try {
    execSync(`git worktree add ${TEMP_PAGES_DIR} origin/gh-pages`, { stdio: "pipe" });
    console.log("   ✅ gh-pages worktree ready\n");
    // Blog files are directly in the root, not in client/ subdirectory
    return path.join(TEMP_PAGES_DIR, "blog");
  } catch (error) {
    console.error("❌ Failed to create gh-pages worktree");
    console.error("   Make sure you have a gh-pages branch");
    console.error(`   Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

/**
 * Cleanup gh-pages worktree
 */
function cleanupGhPagesWorktree(): void {
  if (fs.existsSync(TEMP_PAGES_DIR)) {
    try {
      execSync(`git worktree remove ${TEMP_PAGES_DIR} --force`, { stdio: "ignore" });
    } catch {
      fs.rmSync(TEMP_PAGES_DIR, { recursive: true, force: true });
    }
  }
}

/**
 * Scan directory for blog posts
 */
function scanBlogPosts(blogDir: string): BlogPostInfo[] {
  if (!fs.existsSync(blogDir)) {
    console.error(`❌ Blog directory not found: ${blogDir}`);
    console.error("   Run 'npm run build' first or use SOURCE=gh-pages");
    process.exit(1);
  }

  const posts: BlogPostInfo[] = [];
  const entries = fs.readdirSync(blogDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const id = parseInt(entry.name, 10);
    if (isNaN(id)) continue;

    const htmlPath = path.join(blogDir, entry.name, "index.html");
    if (!fs.existsSync(htmlPath)) continue;

    const html = fs.readFileSync(htmlPath, "utf-8");
    const publishingDate = extractPublishingDate(html);

    posts.push({ id, publishingDate });
  }

  return posts.sort((a, b) => a.id - b.id);
}

/**
 * Check if a post is recent
 */
function isRecent(publishingDate: string | undefined, days: number): boolean {
  if (!publishingDate) return false;

  const postDate = new Date(publishingDate);
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);

  return postDate >= daysAgo;
}

/**
 * Send a webmention
 */
async function sendWebmention(source: string, target: string): Promise<WebmentionResult> {
  try {
    const body = new URLSearchParams({ source, target });

    const response = await fetch(BRIDGY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const responseText = await response.text();

    return {
      success: response.ok,
      status: response.status,
      message: response.statusText,
      responseText: responseText.substring(0, 200),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🚀 Bridgy Webmention Sender\n");

  const isDryRun = process.env.SEND_WEBMENTIONS !== "true";
  const onlyRecentDays = process.env.ONLY_RECENT ? parseInt(process.env.ONLY_RECENT, 10) : undefined;
  const specificPostId = process.env.POST_ID ? parseInt(process.env.POST_ID, 10) : undefined;
  const source = process.env.SOURCE || "auto";

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No webmentions will be sent");
    console.log("   Set SEND_WEBMENTIONS=true to actually send\n");
  }

  if (onlyRecentDays) {
    console.log(`📅 Only processing posts from the last ${onlyRecentDays} days\n`);
  }

  if (specificPostId) {
    console.log(`🎯 Only processing post ID: ${specificPostId}\n`);
  }

  // Determine source
  let blogDir: string;
  let useGhPages = false;

  if (source === "gh-pages") {
    blogDir = setupGhPagesWorktree();
    useGhPages = true;
    console.log("📚 Using gh-pages branch as source");
  } else if (source === "build") {
    blogDir = BUILD_DIR;
    console.log("📚 Using local build directory as source");
  } else {
    // Auto-detect: prefer build if exists, fallback to gh-pages
    if (fs.existsSync(BUILD_DIR)) {
      blogDir = BUILD_DIR;
      console.log("📚 Auto-detected: Using local build directory");
    } else {
      blogDir = setupGhPagesWorktree();
      useGhPages = true;
      console.log("📚 Auto-detected: Using gh-pages branch (no local build found)");
    }
  }

  // Scan blog posts
  console.log(`   Scanning: ${blogDir}\n`);
  let posts = scanBlogPosts(blogDir);
  console.log(`   Found ${posts.length} blog posts\n`);

  // Filter posts
  if (specificPostId) {
    posts = posts.filter((post) => post.id === specificPostId);
  } else if (onlyRecentDays) {
    posts = posts.filter((post) => isRecent(post.publishingDate, onlyRecentDays));
  }

  if (posts.length === 0) {
    console.log("ℹ️  No posts to process");
    return;
  }

  console.log(`📤 Processing ${posts.length} posts...\n`);

  let totalSent = 0;
  let totalFailed = 0;

  // Send webmentions
  for (const post of posts) {
    const sourceUrl = `${SITE_URL}/blog/${post.id}`;

    console.log(`\n📝 Post ${post.id}`);
    console.log(`   URL: ${sourceUrl}`);
    console.log(`   Date: ${post.publishingDate || "N/A"}`);

    for (const target of BRIDGY_TARGETS) {
      const targetName = target.split("/").pop();

      if (isDryRun) {
        console.log(`   [DRY RUN] Would send to ${targetName}`);
        continue;
      }

      console.log(`   → Sending to ${targetName}...`);

      const result = await sendWebmention(sourceUrl, target);

      if (result.success) {
        console.log(`   ✅ Success (${result.status})`);
        totalSent++;
      } else {
        console.log(`   ❌ Failed (${result.status || "N/A"}): ${result.message}`);
        if (result.responseText) {
          console.log(`      Response: ${result.responseText}`);
        }
        totalFailed++;
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary");
  console.log("=".repeat(60));

  if (isDryRun) {
    console.log(`Would send ${posts.length * BRIDGY_TARGETS.length} webmentions`);
    console.log(`for ${posts.length} posts to ${BRIDGY_TARGETS.length} targets`);
    console.log("\nRun with SEND_WEBMENTIONS=true to actually send");
  } else {
    console.log(`✅ Successfully sent: ${totalSent}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📝 Total posts: ${posts.length}`);
    console.log(`🎯 Total targets: ${BRIDGY_TARGETS.length}`);
  }

  console.log("=".repeat(60) + "\n");

  // Cleanup
  if (useGhPages) {
    cleanupGhPagesWorktree();
  }

  if (totalFailed > 0 && !isDryRun) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  // Try to cleanup on error
  try {
    cleanupGhPagesWorktree();
  } catch {
    // Ignore cleanup errors
  }
  process.exit(1);
});
