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
 * Converts refs to superscript links and appends a footnotes section.
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
    return markdown
  }

  // second pass: replace inline references with superscript links
  // track which footnotes are actually referenced and assign numbers
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
    return `<sup>[${index}](#footnote-${index})</sup>`
  })

  // build footnotes section from referenced definitions (in order)
  if (referencedOrder.length > 0) {
    const footnotesSection = ['\n---\n']
    for (let i = 0; i < referencedOrder.length; i++) {
      const label = referencedOrder[i]
      const text = definitions.get(label)
      footnotesSection.push(`${i + 1}. <span id="footnote-${i + 1}"></span> ${text}`)
    }
    content += '\n' + footnotesSection.join('\n')
  }

  return content
}

/**
 * Runs all custom markdown preprocessors on the input.
 */
export function preprocessMarkdown(markdown) {
  let result = markdown
  result = processAdmonitions(result)
  result = processFootnotes(result)
  return result
}
