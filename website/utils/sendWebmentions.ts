#!/usr/bin/env tsx
/**
 * Automated Webmention Sender for Bridgy Publish
 *
 * This script sends webmentions to Bridgy after a successful build.
 * It scans the build directory for blog posts and sends webmentions.
 *
 * Usage:
 *   npm run send-webmentions                    # Dry-run for all posts
 *   SEND_WEBMENTIONS=true npm run send-webmentions  # Actually send
 *   ONLY_RECENT=7 npm run send-webmentions      # Only posts from last 7 days
 *   POST_ID=19 npm run send-webmentions         # Only specific post
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = "https://www.fretchen.eu";
const BRIDGY_ENDPOINT = "https://brid.gy/publish/webmention";
const BUILD_DIR = path.join(__dirname, "../build/client/blog");

const BRIDGY_TARGETS = [
  "https://brid.gy/publish/mastodon",
  "https://brid.gy/publish/bluesky",
  "https://brid.gy/publish/github",
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
 * Scan build directory for blog posts
 */
function scanBlogPosts(): BlogPostInfo[] {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`❌ Build directory not found: ${BUILD_DIR}`);
    console.error("   Run 'npm run build' first");
    process.exit(1);
  }

  const posts: BlogPostInfo[] = [];
  const entries = fs.readdirSync(BUILD_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const id = parseInt(entry.name, 10);
    if (isNaN(id)) continue;

    const htmlPath = path.join(BUILD_DIR, entry.name, "index.html");
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

  // Scan blog posts
  console.log("📚 Scanning blog posts from build directory...");
  let posts = scanBlogPosts();
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

  if (totalFailed > 0 && !isDryRun) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
