import fs from "node:fs";
import path from "node:path";
import { HtmlBasePlugin } from "@11ty/eleventy";
import MarkdownIt from "markdown-it";
import { vc2Url, vc2Label } from "./lib/vc2.js";

const md = new MarkdownIt({ html: false, linkify: true });

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addWatchTarget("content/");

  eleventyConfig.addFilter("vc2Url", vc2Url);
  eleventyConfig.addFilter("vc2Label", vc2Label);
  eleventyConfig.addFilter("md", (text) => md.render(text || ""));
  eleventyConfig.addFilter("mdInline", (text) => md.renderInline(String(text || "")));
  // Text in square brackets is a placeholder for content still to come.
  eleventyConfig.addFilter("isPlaceholder", (v) => typeof v === "string" && v.trim().startsWith("["));

  // Copy every non-Markdown file in content/units (PDFs, slides, images)
  // to the same path under /units/ on the site.
  eleventyConfig.on("eleventy.after", ({ dir }) => {
    const from = path.join("content", "units");
    if (!fs.existsSync(from)) return;
    fs.cpSync(from, path.join(dir.output, "units"), {
      recursive: true,
      filter: (src) => fs.statSync(src).isDirectory() || (!src.endsWith(".md") && !src.endsWith(".DS_Store")),
    });
  });
}

export const config = {
  dir: { input: "src", output: "_site" },
  pathPrefix: "/music-hub/",
  htmlTemplateEngine: "njk",
};
