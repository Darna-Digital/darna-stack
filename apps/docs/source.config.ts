import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import type { Code, Root } from "mdast";
import { visit } from "unist-util-visit";

export const docs = defineDocs({
  dir: "content/docs",
});

// Convert ```mermaid fenced code blocks into <Mermaid chart="..." /> JSX nodes
// BEFORE Shiki touches them. Authoring stays pure markdown; Shiki only
// processes non-mermaid languages; the runtime <Mermaid> client component
// renders SVG via dynamic-imported mermaid.
const remarkMermaid = () => (tree: Root) => {
  visit(tree, "code", (node: Code, index, parent) => {
    if (node.lang !== "mermaid" || !parent || typeof index !== "number") return;
    const replacement = {
      type: "mdxJsxFlowElement",
      name: "Mermaid",
      attributes: [{ type: "mdxJsxAttribute", name: "chart", value: node.value }],
      children: [],
    } as never;
    parent.children[index] = replacement;
  });
};

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMermaid],
  },
});
