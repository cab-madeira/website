import fs from 'fs/promises'
import path from 'path'
import * as cheerio from 'cheerio'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SOURCE_DIR = path.resolve(__dirname, '../data/cab/cab-madeira.com')
const IMAGES_DIR = path.join(SOURCE_DIR, 'images/galeria')
const OUTPUT_DIR = path.resolve(__dirname, '../data/gallery/Galleries')
const LOGS_DIR = path.resolve(__dirname, '../logs')

interface LogEntry {
  filename: string
  id: string
  reason: string
  details?: string
}

function getGalleryFiles(files: string[]): string[] {
  return files.filter((f) => /^galeria_foto[\w]+\.html$/.test(f))
}

function extractGalleryId(filename: string): string {
  return filename.replace('galeria_foto', '').replace('.html', '')
}

function sanitizeFolderName(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .toLowerCase()
}

function extractTitle(html: string): string {
  const $ = cheerio.load(html)
  const titleElem = $('td.style9 strong')
  return titleElem.text().trim() || ''
}

function extractImages(html: string): string[] {
  const $ = cheerio.load(html)
  const images: string[] = []
  $('a[rel^="lightbox"] img').each((_, elem) => {
    const src = $(elem).attr('src')
    if (src) {
      const imagePath = src.replace('images/galeria/', '')
      if (imagePath) {
        // Decode URL-encoded filenames (e.g., %20 -> space)
        const decodedPath = decodeURIComponent(imagePath)

        // Only include actual image files (skip .html and other non-image files)
        const ext = decodedPath.toLowerCase().split('.').pop()
        if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
          images.push(decodedPath)
        }
      }
    }
  })
  return images
}

async function copyImages(
  images: string[],
  folderName: string,
  galleryId: string,
  failedImages: LogEntry[],
) {
  const galleryDir = path.join(OUTPUT_DIR, folderName)
  await fs.mkdir(galleryDir, { recursive: true })
  let copied = 0
  let failed = 0
  let skipped = 0
  for (const img of images) {
    const srcPath = path.join(IMAGES_DIR, img)
    const destPath = path.join(galleryDir, img)
    try {
      // Check if destination file already exists
      try {
        await fs.access(destPath)
        // File exists, skip copying
        skipped++
        continue
      } catch {
        // File doesn't exist, proceed with copy
      }

      await fs.copyFile(srcPath, destPath)
      copied++
    } catch (err) {
      console.warn(`  Failed to copy image: ${img}`)
      failedImages.push({
        filename: `galeria_foto${galleryId}.html`,
        id: galleryId,
        reason: 'Image copy failed',
        details: `Image: ${img}, Error: ${err}`,
      })
      failed++
    }
  }
  if (copied > 0) {
    console.log(`  Copied ${copied} image${copied > 1 ? 's' : ''}`)
  }
  if (skipped > 0) {
    console.log(`  Skipped ${skipped} existing image${skipped > 1 ? 's' : ''}`)
  }
  if (failed > 0) {
    console.log(`  Failed: ${failed} image${failed > 1 ? 's' : ''}`)
  }
  return { copied, failed }
}

async function writeGalleryJson(gallery: {
  id: string
  title: string
  images: string[]
  folderName: string
}) {
  const galleryDir = path.join(OUTPUT_DIR, gallery.folderName)
  const jsonPath = path.join(galleryDir, 'data.json')
  await fs.writeFile(
    jsonPath,
    JSON.stringify({ id: gallery.id, title: gallery.title, images: gallery.images }, null, 2),
  )
  console.log(`  Created: ${gallery.folderName}/data.json`)
}

async function main() {
  console.log('Starting gallery HTML parsing...\n')
  const files = await fs.readdir(SOURCE_DIR)
  const galleryFiles = getGalleryFiles(files)
  console.log(`Found ${galleryFiles.length} gallery HTML files\n`)

  let processed = 0
  let errors = 0
  let totalImages = 0
  let totalCopied = 0
  let totalFailed = 0

  const errorLog: LogEntry[] = []
  const failedImages: LogEntry[] = []

  for (const file of galleryFiles) {
    try {
      console.log(`Processing: ${file}`)
      const html = await fs.readFile(path.join(SOURCE_DIR, file), 'utf8')
      const id = extractGalleryId(file)
      const title = extractTitle(html) || file
      const folderName = sanitizeFolderName(title)
      const images = extractImages(html)

      totalImages += images.length
      console.log(`  Found ${images.length} image${images.length !== 1 ? 's' : ''}`)
      console.log(`  Title: ${title}`)
      console.log(`  Folder: ${folderName}`)

      const result = await copyImages(images, folderName, id, failedImages)
      totalCopied += result.copied
      totalFailed += result.failed

      await writeGalleryJson({ id, title, images, folderName })
      console.log()
      processed++
    } catch (error) {
      console.error(`  Error processing ${file}:`, error)
      console.error('')
      errorLog.push({
        filename: file,
        id: extractGalleryId(file),
        reason: 'Processing failed',
        details: String(error),
      })
      errors++
    }
  }

  console.log('=======================================')
  console.log('Gallery Parsing Summary:')
  console.log(`   Processed: ${processed}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total Images: ${totalImages}`)
  console.log(`   Copied: ${totalCopied}`)
  console.log(`   Failed: ${totalFailed}`)
  console.log(`   Total Galleries: ${galleryFiles.length}`)
  console.log('=======================================\n')
  console.log(`Output directory: ${OUTPUT_DIR}`)

  // Write log file if there are errors or failures
  if (errorLog.length > 0 || failedImages.length > 0) {
    await fs.mkdir(LOGS_DIR, { recursive: true })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const logFilePath = path.join(LOGS_DIR, `gallery-parse-${timestamp}.log`)

    const logContent: string[] = []
    logContent.push('# Gallery Parsing Log')
    logContent.push('')
    logContent.push(`Date: ${new Date().toISOString()}`)
    logContent.push(`Total Galleries Processed: ${processed}`)
    logContent.push(`Total Errors: ${errors}`)
    logContent.push(`Total Failed Images: ${totalFailed}`)
    logContent.push('')
    logContent.push('=')
    logContent.push('')

    if (errorLog.length > 0) {
      logContent.push('## PROCESSING ERRORS')
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

    if (failedImages.length > 0) {
      logContent.push('## FAILED IMAGE COPIES')
      logContent.push('')
      failedImages.forEach((entry) => {
        logContent.push(`Gallery: ${entry.filename}`)
        logContent.push(`ID: ${entry.id}`)
        logContent.push(`Reason: ${entry.reason}`)
        if (entry.details) {
          logContent.push(`Details: ${entry.details}`)
        }
        logContent.push('---')
        logContent.push('')
      })
    }

    await fs.writeFile(logFilePath, logContent.join('\n'), 'utf-8')

    console.log(`\nLog file created: ${logFilePath}`)
    console.log(`   Processing errors: ${errorLog.length}`)
    console.log(`   Failed images: ${failedImages.length}`)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
