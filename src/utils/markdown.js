// custom markdown preprocessors for admonitions and footnotes

const ADMONITION_TYPES = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION']

/**
 * Converts GitHub-style admonition blockquotes into marked blockquotes
 * with a sentinel prefix that the React renderer can detect.
 *
 * Syntax:
 *   > [!NOTE]
 *   > This is a note admonition.
 *
 * Becomes:
 *   > <!--admonition:note-->
 *   > **Note**
 *   >
 *   > This is a note admonition.
 */
export function processAdmonitions(markdown) {
  const typesPattern = ADMONITION_TYPES.join('|')
  // match "> [!TYPE]" optionally followed by more blockquote lines
  const regex = new RegExp(
    `^(> *)\\[!(${typesPattern})\\][ ]*$`,
    'gmi'
  )

  return markdown.replace(regex, (match, prefix, type) => {
    const label = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
    return `${prefix}<!--admonition:${type.toLowerCase()}-->\n${prefix}**${label}**\n${prefix}`
  })
}

/**
 * Processes footnote references and definitions in markdown.
 *
 * Inline refs:  [^1] or [^label]
 * Definitions:  [^1]: Footnote text here
 *               Can span multiple lines if indented.
 *
 * Returns { content, footnotes } where footnotes is an array of
 * { index, text } objects for rendering separately in React.
 * Inline refs become markdown links: [¹](#footnote-1)
 */
export function processFootnotes(markdown) {
  const lines = markdown.split('\n')

  // first pass: collect footnote definitions
  const definitions = new Map()
  const nonDefLines = []
  let currentFootnote = null

  for (const line of lines) {
    const defMatch = line.match(/^\[\^([^\]]+)\]:\s*(.*)$/)
    if (defMatch) {
      currentFootnote = defMatch[1]
      definitions.set(currentFootnote, defMatch[2])
      continue
    }

    // continuation lines for multi-line footnotes (indented by 2+ spaces)
    if (currentFootnote && /^  +\S/.test(line)) {
      definitions.set(
        currentFootnote,
        definitions.get(currentFootnote) + ' ' + line.trim()
      )
      continue
    }

    currentFootnote = null
    nonDefLines.push(line)
  }

  if (definitions.size === 0) {
    return { content: markdown, footnotes: [] }
  }

  // second pass: replace inline references with markdown links
  // track which footnotes are actually referenced and assign numbers
  const superscriptDigits = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
  const toSuperscript = (n) => {
    return String(n).split('').map(d => superscriptDigits[Number(d)]).join('')
  }

  const referencedOrder = []
  let content = nonDefLines.join('\n')

  content = content.replace(/\[\^([^\]]+)\]/g, (match, label) => {
    if (!definitions.has(label)) {
      return match
    }
    if (!referencedOrder.includes(label)) {
      referencedOrder.push(label)
    }
    const index = referencedOrder.indexOf(label) + 1
    return `[${toSuperscript(index)}](#footnote-${index})`
  })

  // build footnotes array for React rendering
  const footnotes = referencedOrder.map((label, i) => ({
    index: i + 1,
    text: definitions.get(label)
  }))

  return { content, footnotes }
}

/**
 * Splits content on a <!-- draft-below --> marker.
 * Everything above renders normally; everything below is
 * returned separately so it can be styled as draft/unreviewed.
 */
export function splitDraftMarker(markdown) {
  const marker = /^<!--\s*draft-below\s*-->$/im
  const match = markdown.match(marker)
  if (!match) {
    return { above: markdown, below: null }
  }
  const idx = match.index
  return {
    above: markdown.slice(0, idx).trimEnd(),
    below: markdown.slice(idx + match[0].length).trimStart()
  }
}

/**
 * Runs all custom markdown preprocessors on the input.
 * Returns { content, draftContent, footnotes } where:
 *  - content is the reviewed portion of the post
 *  - draftContent (if any) is the unreviewed portion after <!-- draft-below -->
 *  - footnotes is an array of { index, text } for rendering a footnotes section
 */
export function preprocessMarkdown(markdown) {
  let result = markdown
  result = processAdmonitions(result)
  const { content, footnotes } = processFootnotes(result)
  const { above, below } = splitDraftMarker(content)
  return { content: above, draftContent: below, footnotes }
}
