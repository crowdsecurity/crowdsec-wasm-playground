import {LRLanguage} from "@codemirror/language"
import {parser} from "./grok.js"
import {styleTags, tags as t} from "@lezer/highlight"
import {LanguageSupport} from "@codemirror/language"


let parserWithMetadata = parser.configure({
  props: [
    styleTags({
      GrokPattern: t.variableName,
      GrokSemantic: t.definitionKeyword,
      GrokStart: t.operator,
	  GrokEnd: t.operator,
    }),
  ]
})


export const grokLanguage = LRLanguage.define({
  parser: parserWithMetadata,
})


export function grok() {
  return new LanguageSupport(grokLanguage, [])
}