import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import { toHtml } from "hast-util-to-html"
import { transformCallouts } from "./dist/index.js"

const md = "> [!note-blank]\n>\n> > > [!thm|*] Theorem **name**\n> > >\n> > > content"
const tree = unified().use(remarkParse).parse(md)
console.log("BEFORE:", JSON.stringify(tree.children[0], null, 1).slice(0, 900))
transformCallouts(tree, { theorems: true })
const hast = await unified().use(remarkRehype, {allowDangerousHtml:true}).use(rehypeRaw).run(tree)
console.log("HTML:", toHtml(hast, {allowDangerousHtml:true}).replace(/\s+/g," "))
