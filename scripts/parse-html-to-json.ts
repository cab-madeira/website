import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface JsonPost {
  file: string
  image: string
  date: string
  title: string
  body: string
}

interface LogEntry {
  filename: string
  id: string
  reason: string
  details?: string
}

/**
 * Extract ID from filename (e.g., "noticia_detalhefd75.html" -> "fd75")
 */
function extractId(filename: string): string {
  const match = filename.match(/noticia_detalhe([^.]+)\.html/)
  return match ? match[1] : ''
}

/**
 * Extract text content from HTML, removing extra whitespace
 */
function extractText($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): string {
  if (!element || element.length === 0) return ''
  return element.text().trim().replace(/\s+/g, ' ')
}

/**
 * Parse a single HTML news article
 */
function parseNewsArticle(html: string, filename: string): JsonPost | null {
  try {
    const $ = cheerio.load(html)

    // Extract date - look for <em> tag containing date in DD/MM/YYYY format
    let date = ''
    $('em').each((_, em) => {
      const text = extractText($, $(em))
      // Match DD/MM/YYYY format
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
        date = text
        return false // break
      }
    })

    if (!date) {
      console.warn(`  ⚠️  No date found in ${filename}`)
      return null
    }

    // Extract image - look for link rel="image_src" or first image in article
    let image = ''
    const imageSrcLink = $('link[rel="image_src"]')
    if (imageSrcLink.length > 0) {
      const href = imageSrcLink.attr('href') || ''
      // Decode URL encoding (e.g., %20 -> space) and convert to relative path for data/ folder
      const decodedHref = decodeURIComponent(href)
      image = decodedHref.replace(/^images\/noticias\//, 'cab/cab-madeira.com/images/noticias/')
    } else {
      // Fallback: look for first image in article content
      const articleImg = $('td[width="29%"] img')
      if (articleImg.length > 0) {
        const src = articleImg.attr('src') || ''
        // Decode URL encoding
        const decodedSrc = decodeURIComponent(src)
        image = decodedSrc.replace(/^images\/noticias\//, 'cab/cab-madeira.com/images/noticias/')
      }
    }

    // Skip posts with .html images (invalid image format)
    if (image && path.extname(image).toLowerCase() === '.html') {
      console.warn(`  ⚠️  Invalid image format (.html) in ${filename}, skipping image`)
      image = ''
    }

    // Use placeholder if no image found
    if (!image) {
      image = 'placeholder-blur.png'
    }

    // Extract title - look for <strong> tag in article content (not in navigation)
    let title = ''
    const articleContent = $('td[width="71%"]')
    if (articleContent.length > 0) {
      // First strong tag in article content (after the category)
      articleContent.find('strong').each((_, strong) => {
        const text = extractText($, $(strong))
        // Skip if it's part of the body paragraphs (look for longer text or navigation)
        if (text && text.length > 0 && text.length < 200 && !text.includes(':')) {
          title = text
          return false // break
        }
      })
    }

    // Fallback 1: Try to use category as title (span with class style6)
    if (!title) {
      const category = articleContent.find('span.style6')
      if (category.length > 0) {
        const categoryText = extractText($, category)
        if (categoryText) {
          title = categoryText
        }
      }
    }

    // Fallback 2: extract from page title
    if (!title) {
      const pageTitle = $('title')
      if (pageTitle.length > 0) {
        const fullTitle = extractText($, pageTitle)
        // Remove the site name prefix and extra text
        title = fullTitle.replace(/^CAB-MADEIRA\.COM\s*-\s*/, '').trim()
      }
    }

    if (!title || title.length === 0) {
      console.warn(`  ⚠️  No title found in ${filename}`)
      return null
    }

    // Extract body content
    let body = ''
    if (articleContent.length > 0) {
      // Find the main content paragraphs and divs
      // Look for the paragraph/div after the title
      let foundTitle = false
      const bodyParagraphs: string[] = []

      // Process both <p> and <div> elements that might contain body content
      articleContent.find('p, div[dir="ltr"], div').each((_, element) => {
        const $el = $(element)
        const text = extractText($, $el)

        // Skip empty elements
        if (!text) return

        // Skip the date/category paragraph
        if (text.includes(date)) return

        // Skip social sharing toolbox
        if (text.includes('addthis')) return

        // Skip if it's the title
        if (text === title) {
          foundTitle = true
          return
        }

        // After title, collect body paragraphs/divs
        if (foundTitle || text.length > 100) {
          // Look for nested paragraphs/divs (sometimes wrapped in another element)
          const nestedElements = $el.find('p, div[dir="ltr"]')
          if (nestedElements.length > 0) {
            nestedElements.each((_, nested) => {
              const nestedText = extractText($, $(nested))
              // More lenient: accept very short paragraphs (at least 3 chars)
              if (nestedText && nestedText.length >= 3) {
                bodyParagraphs.push(nestedText)
              }
            })
          } else if (text.length >= 3 && $el.parent().attr('width') === '71%') {
            // Only add if it's a direct child of the article content area
            bodyParagraphs.push(text)
          }
        }
      })

      // Join paragraphs with double newline
      body = bodyParagraphs.join('\n\n')
    }

    // Be more lenient: if no proper body found, try to use any paragraph text
    if (!body || body.length < 3) {
      // Last resort: grab any paragraph content that's not navigation/metadata
      const fallbackParagraphs: string[] = []
      articleContent.find('p').each((_, p) => {
        const $p = $(p)
        const text = extractText($, $p)
        if (
          text &&
          text.length >= 3 &&
          !text.includes(date) &&
          !text.includes('addthis') &&
          text !== title
        ) {
          fallbackParagraphs.push(text)
        }
      })

      if (fallbackParagraphs.length > 0) {
        body = fallbackParagraphs.join('\n\n')
      }
    }

    // If still no body, use the title as minimal content
    if (!body || body.length < 3) {
      console.warn(`  ⚠️  Very minimal body content in ${filename}, using title`)
      body = title
    }

    return {
      file: filename,
      image,
      date,
      title,
      body,
    }
  } catch (error) {
    console.error(`  ❌ Error parsing ${filename}:`, error)
    return null
  }
}

/**
 * Main function to parse all HTML files and generate JSON
 */
async function parseAllNews() {
  console.log('🚀 Starting HTML to JSON conversion...\n')

  // Path to the scraped HTML files
  const htmlDir = path.resolve(__dirname, '../data/cab/cab-madeira.com')
  const outputDir = path.resolve(__dirname, '../data/posts')
  const logsDir = path.resolve(__dirname, '../logs')

  // Create output and logs directories if they don't exist
  await fs.mkdir(outputDir, { recursive: true })
  await fs.mkdir(logsDir, { recursive: true })

  // Read all files in the directory
  const files = await fs.readdir(htmlDir)

  // Filter for noticia_detalhe*.html files
  const newsFiles = files.filter(
    (file) => file.startsWith('noticia_detalhe') && file.endsWith('.html'),
  )

  console.log(`📂 Found ${newsFiles.length} news HTML files\n`)

  let parsed = 0
  let skipped = 0
  let errors = 0
  const skippedLog: LogEntry[] = []
  const errorLog: LogEntry[] = []
  const missingImageLog: LogEntry[] = []

  for (const file of newsFiles) {
    try {
      console.log(`📄 Processing: ${file}`)

      // Extract ID from filename
      const id = extractId(file)
      if (!id) {
        console.log(`  ⏭️  Skipping ${file} (couldn't extract ID)\n`)
        skipped++
        skippedLog.push({
          filename: file,
          id: '',
          reason: 'Could not extract ID from filename',
        })
        continue
      }

      // Read HTML file
      const htmlPath = path.join(htmlDir, file)
      const html = await fs.readFile(htmlPath, 'utf-8')

      // Parse the article
      const article = parseNewsArticle(html, file)

      if (!article) {
        console.log(`  ⏭️  Skipping ${file} (missing required fields)\n`)
        skipped++
        skippedLog.push({
          filename: file,
          id,
          reason: 'Missing required fields (date, title, or body)',
        })
        continue
      }

      // Create folder for this article (e.g., data/posts/fd75/)
      const articleDir = path.join(outputDir, id)
      await fs.mkdir(articleDir, { recursive: true })

      // Copy image to article folder if it exists
      let imageFilename = ''
      if (article.image) {
        const imagePath = path.join(__dirname, '../data', article.image)
        const isPlaceholder = article.image === 'placeholder-blur.png'

        try {
          await fs.access(imagePath)
          // Get the image filename
          imageFilename = path.basename(article.image)
          const destImagePath = path.join(articleDir, imageFilename)

          // Copy the image file
          await fs.copyFile(imagePath, destImagePath)

          if (isPlaceholder) {
            console.log(`  🖼️  Using placeholder image`)
          } else {
            console.log(`  📸 Copied image: ${imageFilename}`)
          }

          // Update article to reference just the filename
          article.image = imageFilename
        } catch (error) {
          console.log(`  ⚠️  Image not found or couldn't be copied: ${article.image}`)
          article.image = '' // Clear the image path if copy failed

          if (!isPlaceholder) {
            missingImageLog.push({
              filename: file,
              id,
              reason: 'Image file not found or could not be copied',
              details: article.image,
            })
          }
        }
      } else {
        // This should not happen anymore since we set placeholder
        missingImageLog.push({
          filename: file,
          id,
          reason: 'No image in article data',
        })
      }

      // Generate output filename
      const jsonFilename = 'data.json'
      const jsonPath = path.join(articleDir, jsonFilename)

      // Check if JSON already exists
      try {
        await fs.access(jsonPath)
        console.log(`  ⏭️  JSON already exists: ${id}/${jsonFilename}\n`)
        skipped++
        skippedLog.push({
          filename: file,
          id,
          reason: 'JSON file already exists',
        })
        continue
      } catch {
        // File doesn't exist, proceed
      }

      // Write JSON file
      await fs.writeFile(jsonPath, JSON.stringify(article, null, 2), 'utf-8')

      console.log(`  ✅ Created: ${id}/${jsonFilename}`)
      console.log(`     Title: ${article.title}`)
      console.log(`     Date: ${article.date}`)
      console.log(`     Image: ${article.image || 'None'}`)
      console.log(`     Body length: ${article.body.length} chars\n`)

      parsed++
    } catch (error) {
      const id = extractId(file)
      console.error(`  ❌ Error processing ${file}:`, error)
      console.error('')
      errors++
      errorLog.push({
        filename: file,
        id,
        reason: 'Exception during processing',
        details: error instanceof Error ? error.message : String(error),
      })
    }
  }

  console.log('═══════════════════════════════════════')
  console.log('📊 Conversion Summary:')
  console.log(`   ✅ Parsed: ${parsed}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`   📝 Total: ${newsFiles.length}`)
  console.log('═══════════════════════════════════════\n')
  console.log(`📁 Output directory: ${outputDir}`)

  // Write log file
  if (skippedLog.length > 0 || errorLog.length > 0 || missingImageLog.length > 0) {
    const logFilePath = path.join(logsDir, 'parse-html-to-json.log')
    const timestamp = new Date().toISOString()
    const logContent = [
      '# HTML to JSON Parsing Log',
      `# Generated: ${timestamp}`,
      `# Total files: ${newsFiles.length}`,
      `# Parsed: ${parsed}`,
      `# Skipped: ${skipped}`,
      `# Errors: ${errors}`,
      `# Missing images: ${missingImageLog.length}`,
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
    ]

    if (skippedLog.length > 0) {
      logContent.push('## SKIPPED FILES')
      logContent.push('')
      skippedLog.forEach((entry) => {
        logContent.push(`File: ${entry.filename}`)
        logContent.push(`ID: ${entry.id || 'N/A'}`)
        logContent.push(`Reason: ${entry.reason}`)
        if (entry.details) {
          logContent.push(`Details: ${entry.details}`)
        }
        logContent.push('---')
        logContent.push('')
      })
    }

    if (errorLog.length > 0) {
      logContent.push('## ERRORS')
      logContent.push('')
      errorLog.forEach((entry) => {
        logContent.push(`File: ${entry.filename}`)
        logContent.push(`ID: ${entry.id || 'N/A'}`)
        logContent.push(`Reason: ${entry.reason}`)
        if (entry.details) {
          logContent.push(`Details: ${entry.details}`)
        }
        logContent.push('---')
        logContent.push('')
      })
    }

    if (missingImageLog.length > 0) {
      logContent.push('## MISSING IMAGES')
      logContent.push('')
      missingImageLog.forEach((entry) => {
        logContent.push(`File: ${entry.filename}`)
        logContent.push(`ID: ${entry.id || 'N/A'}`)
        logContent.push(`Reason: ${entry.reason}`)
        if (entry.details) {
          logContent.push(`Image path: ${entry.details}`)
        }
        logContent.push('---')
        logContent.push('')
      })
    }

    await fs.writeFile(logFilePath, logContent.join('\n'), 'utf-8')

    console.log(`\n📋 Log file created: ${logFilePath}`)
    console.log(`   ⏭️  Skipped entries: ${skippedLog.length}`)
    console.log(`   ❌ Error entries: ${errorLog.length}`)
    console.log(`   📸 Missing images: ${missingImageLog.length}`)
  }
}

// Run the parser
parseAllNews().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
