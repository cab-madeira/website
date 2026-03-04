import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface JsonGallery {
  id: string
  title: string
  images: string[]
}

interface ImageIssue {
  galleryTitle: string
  gallerySlug: string
  imagePath: string
  reason: 'not_found' | 'corrupted' | 'error'
  error?: string
}

const imageIssues: ImageIssue[] = []
let galleriesFolderId: number | null = null

// Get or create the "Galleries" folder
async function getOrCreateGalleriesFolder(payload: any): Promise<number | null> {
  if (galleriesFolderId) {
    return galleriesFolderId
  }

  // Check if "Galleries" folder already exists
  const existingFolders = await payload.find({
    collection: 'payload-folders',
    where: {
      name: {
        equals: 'Galleries',
      },
    },
    limit: 1,
  })

  if (existingFolders.docs.length > 0) {
    galleriesFolderId = existingFolders.docs[0].id
    console.log('Using existing "Galleries" folder')
    return galleriesFolderId
  }

  // Create the "Galleries" folder
  const newFolder = await payload.create({
    collection: 'payload-folders',
    data: {
      name: 'Galleries',
      folderType: ['media'],
    },
  })

  galleriesFolderId = newFolder.id
  console.log('Created new "Galleries" folder')
  return galleriesFolderId
}

// Get or create a gallery-specific folder inside "Galleries"
async function getOrCreateGalleryFolder(
  payload: any,
  galleryTitle: string,
  gallerySlug: string,
): Promise<number | null> {
  const parentFolderId = await getOrCreateGalleriesFolder(payload)
  if (!parentFolderId) {
    return null
  }

  // Check if gallery folder already exists
  const existingFolder = await payload.find({
    collection: 'payload-folders',
    where: {
      and: [
        {
          name: {
            equals: galleryTitle,
          },
        },
        {
          folder: {
            equals: parentFolderId,
          },
        },
      ],
    },
    limit: 1,
  })

  if (existingFolder.docs.length > 0) {
    console.log(`  Using existing folder for gallery: ${galleryTitle}`)
    return existingFolder.docs[0].id
  }

  // Create the gallery folder
  const newFolder = await payload.create({
    collection: 'payload-folders',
    data: {
      name: galleryTitle,
      folder: parentFolderId,
      folderType: ['media'],
    },
  })

  console.log(`  Created folder for gallery: ${galleryTitle}`)
  return newFolder.id
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
}

async function findOrCreateMedia(
  payload: any,
  imagePath: string,
  galleryTitle: string,
  gallerySlug: string,
  galleryFolderId: number,
  galleryFolderName: string,
) {
  // Extract filename from path
  const filename = path.basename(imagePath)

  // Determine MIME type from file extension
  const ext = path.extname(filename).toLowerCase()
  let mimetype = 'image/jpeg' // default
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      mimetype = 'image/jpeg'
      break
    case '.png':
      mimetype = 'image/png'
      break
    case '.gif':
      mimetype = 'image/gif'
      break
    case '.webp':
      mimetype = 'image/webp'
      break
    case '.svg':
      mimetype = 'image/svg+xml'
      break
    default:
      mimetype = 'image/jpeg' // fallback
  }

  // Check if media already exists in this gallery folder
  const existingMedia = await payload.find({
    collection: 'media',
    where: {
      and: [
        {
          filename: {
            equals: filename,
          },
        },
        {
          folder: {
            equals: galleryFolderId,
          },
        },
      ],
    },
    limit: 1,
  })

  if (existingMedia.docs.length > 0) {
    console.log(`  Media already exists: ${filename}`)
    return existingMedia.docs[0].id
  }

  // Find the image in gallery folder
  const dataImagePath = path.resolve(
    __dirname,
    '../data/gallery/Galleries',
    galleryFolderName,
    imagePath,
  )

  try {
    // Check if image exists
    await fs.access(dataImagePath)

    // Read the file
    const fileBuffer = await fs.readFile(dataImagePath)

    // Skip empty or very small files (likely corrupted)
    if (fileBuffer.length < 100) {
      console.log(`  Skipping empty/corrupted file: ${filename}`)
      imageIssues.push({
        galleryTitle,
        gallerySlug,
        imagePath,
        reason: 'corrupted',
        error: 'File is empty or too small',
      })
      return null
    }

    // Process image with Sharp to handle corrupted files
    const processedBuffer = await sharp(fileBuffer, { failOnError: false }).toBuffer()

    console.log(
      `  Uploading: ${filename} (${mimetype}, ${(processedBuffer.length / 1024).toFixed(1)} KB)`,
    )

    // Create media entry using Payload's upload API
    try {
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: filename.replace(/\.[^/.]+$/, ''), // Remove extension for alt text
          folder: galleryFolderId, // Assign to gallery-specific folder
        },
        file: {
          data: processedBuffer,
          name: filename,
          mimetype: mimetype,
          size: processedBuffer.length,
        },
      })

      return media.id
    } catch (uploadError: any) {
      // Handle image processing errors (corrupted images, etc.)
      if (
        uploadError.message?.includes('Vips') ||
        uploadError.message?.includes('JPEG') ||
        uploadError.message?.includes('premature')
      ) {
        console.log(`  Corrupted image skipped: ${filename}`)
        imageIssues.push({
          galleryTitle,
          gallerySlug,
          imagePath,
          reason: 'corrupted',
          error: uploadError.message,
        })
      } else {
        console.log(`  Failed to upload: ${filename} - ${uploadError.message}`)
        imageIssues.push({
          galleryTitle,
          gallerySlug,
          imagePath,
          reason: 'error',
          error: uploadError.message,
        })
      }
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`  Image not found: ${imagePath}`)
      imageIssues.push({
        galleryTitle,
        gallerySlug,
        imagePath,
        reason: 'not_found',
      })
    } else {
      console.log(`  Error processing: ${error.message}`)
      imageIssues.push({
        galleryTitle,
        gallerySlug,
        imagePath,
        reason: 'error',
        error: error.message,
      })
    }
  }

  return null
}

async function importGalleries() {
  // Check for command line arguments
  const args = process.argv.slice(2)
  const shouldDelete = args.includes('--delete') || args.includes('--clean')

  // Parse range arguments
  let startIndex = 0
  let limitCount: number | null = null

  // Check for --start argument
  const startArgIndex = args.findIndex((arg) => arg === '--start')
  if (startArgIndex !== -1 && args[startArgIndex + 1]) {
    startIndex = parseInt(args[startArgIndex + 1], 10)
    if (isNaN(startIndex) || startIndex < 0) {
      console.error('Invalid --start value. Must be a positive integer.')
      process.exit(1)
    }
  }

  // Check for --limit argument
  const limitArgIndex = args.findIndex((arg) => arg === '--limit')
  if (limitArgIndex !== -1 && args[limitArgIndex + 1]) {
    limitCount = parseInt(args[limitArgIndex + 1], 10)
    if (isNaN(limitCount) || limitCount < 1) {
      console.error('Invalid --limit value. Must be a positive integer.')
      process.exit(1)
    }
  }

  // Check for --range argument (format: --range 10-20)
  const rangeArgIndex = args.findIndex((arg) => arg === '--range')
  if (rangeArgIndex !== -1 && args[rangeArgIndex + 1]) {
    const rangeMatch = args[rangeArgIndex + 1].match(/^(\d+)-(\d+)$/)
    if (rangeMatch) {
      startIndex = parseInt(rangeMatch[1], 10)
      const endIndex = parseInt(rangeMatch[2], 10)
      if (endIndex < startIndex) {
        console.error('Invalid --range value. End must be greater than or equal to start.')
        process.exit(1)
      }
      limitCount = endIndex - startIndex + 1
    } else {
      console.error('Invalid --range format. Use: --range START-END (e.g., --range 0-50)')
      process.exit(1)
    }
  }

  console.log('Starting gallery import...\n')

  // Initialize Payload
  const payload = await getPayload({ config })
  console.log('Payload initialized\n')

  if (shouldDelete) {
    console.log(
      'DELETE MODE: Deleting all galleries, folders, and media in "Galleries" folder...\n',
    )

    // Initialize the "Galleries" folder to get its ID
    const galleriesFolderId = await getOrCreateGalleriesFolder(payload)

    // Get all galleries
    const allGalleries = await payload.find({
      collection: 'gallery',
      limit: 1000,
    })

    console.log(`Found ${allGalleries.docs.length} galleries to delete\n`)

    let deletedGalleries = 0
    let galleryErrors = 0

    for (const gallery of allGalleries.docs) {
      try {
        console.log(`Deleting gallery: "${gallery.title}" (${gallery.slug})`)
        await payload.delete({
          collection: 'gallery',
          id: gallery.id,
          context: {
            disableRevalidate: true,
          },
        })
        deletedGalleries++
      } catch (error) {
        console.error(`Error deleting gallery "${gallery.title}":`, error)
        galleryErrors++
      }
    }

    // Get all subfolders under "Galleries"
    const allSubfolders = await payload.find({
      collection: 'payload-folders',
      where: {
        folder: {
          equals: galleriesFolderId,
        },
      },
      limit: 1000,
    })

    console.log(`\nFound ${allSubfolders.docs.length} gallery subfolders to process\n`)

    let deletedMedia = 0
    let mediaErrors = 0
    let deletedFolders = 0
    let folderErrors = 0

    // Delete media in each subfolder, then delete the subfolder
    for (const subfolder of allSubfolders.docs) {
      console.log(`Processing subfolder: "${subfolder.name}"`)

      // Get all media in this subfolder
      const subfolderMedia = await payload.find({
        collection: 'media',
        where: {
          folder: {
            equals: subfolder.id,
          },
        },
        limit: 1000,
      })

      console.log(`  Found ${subfolderMedia.docs.length} media files in "${subfolder.name}"`)

      // Delete all media in this subfolder
      for (const media of subfolderMedia.docs) {
        try {
          console.log(`  Deleting media: "${media.filename}" (${media.id})`)
          await payload.delete({
            collection: 'media',
            id: media.id,
          })
          deletedMedia++
        } catch (error) {
          console.error(`  Error deleting media "${media.filename}":`, error)
          mediaErrors++
        }
      }

      // Delete the subfolder
      try {
        console.log(`  Deleting folder: "${subfolder.name}" (${subfolder.id})`)
        await payload.delete({
          collection: 'payload-folders',
          id: subfolder.id,
        })
        deletedFolders++
      } catch (error) {
        console.error(`  Error deleting folder "${subfolder.name}":`, error)
        folderErrors++
      }

      console.log()
    }

    console.log('=======================================')
    console.log('Delete Summary:')
    console.log(`   Galleries Deleted: ${deletedGalleries}`)
    console.log(`   Gallery Errors: ${galleryErrors}`)
    console.log(`   Subfolders Deleted: ${deletedFolders}`)
    console.log(`   Subfolder Errors: ${folderErrors}`)
    console.log(`   Media Deleted: ${deletedMedia}`)
    console.log(`   Media Errors: ${mediaErrors}`)
    console.log(`   Total Galleries: ${allGalleries.docs.length}`)
    console.log(`   Total Subfolders: ${allSubfolders.docs.length}`)
    console.log('=======================================\n')

    process.exit(0)
  }

  // Initialize the "Galleries" folder for media uploads
  await getOrCreateGalleriesFolder(payload)

  // Continue with normal import logic...

  // Read all JSON files from data/gallery/Galleries directory
  const dataDir = path.resolve(__dirname, '../data/gallery/Galleries')
  const galleryFolders = await fs.readdir(dataDir)

  // Collect all data.json files from gallery folders
  const jsonFiles: Array<{ folder: string; file: string }> = []
  for (const folder of galleryFolders) {
    const folderPath = path.join(dataDir, folder)
    const stat = await fs.stat(folderPath)

    if (stat.isDirectory()) {
      const dataJsonPath = path.join(folderPath, 'data.json')
      try {
        await fs.access(dataJsonPath)
        jsonFiles.push({ folder, file: 'data.json' })
      } catch {
        // data.json doesn't exist in this folder, skip it
      }
    }
  }

  console.log(`Found ${jsonFiles.length} gallery JSON files to import`)

  // Apply range filtering
  let filesToImport = jsonFiles
  if (startIndex > 0 || limitCount !== null) {
    const endIndex = limitCount !== null ? startIndex + limitCount : jsonFiles.length
    filesToImport = jsonFiles.slice(startIndex, endIndex)
    console.log(
      `Importing range: ${startIndex} to ${Math.min(endIndex - 1, jsonFiles.length - 1)} (${filesToImport.length} files)\n`,
    )
  } else {
    console.log()
  }

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const { folder, file } of filesToImport) {
    try {
      console.log(`Processing: ${folder}/${file}`)

      // Read and parse JSON file
      const filePath = path.join(dataDir, folder, file)
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const jsonData: JsonGallery = JSON.parse(fileContent)

      // Generate slug from title
      const slug = generateSlug(jsonData.title)

      // Check if gallery already exists
      const existingGallery = await payload.find({
        collection: 'gallery',
        where: {
          slug: {
            equals: slug,
          },
        },
        limit: 1,
      })

      if (existingGallery.docs.length > 0) {
        console.log(`Gallery already exists: "${jsonData.title}" (${slug})\n`)
        skipped++
        continue
      }

      // Create or get gallery-specific folder
      const galleryFolderId = await getOrCreateGalleryFolder(payload, jsonData.title, slug)
      if (!galleryFolderId) {
        console.log(`  Could not create folder for gallery "${jsonData.title}", skipping...\n`)
        errors++
        continue
      }

      // Process all images and upload to gallery folder
      let uploadedCount = 0
      console.log(`  Uploading ${jsonData.images.length} images...`)

      for (const imagePath of jsonData.images) {
        const mediaId = await findOrCreateMedia(
          payload,
          imagePath,
          jsonData.title,
          slug,
          galleryFolderId,
          folder,
        )
        if (mediaId) {
          uploadedCount++
        }
      }

      if (uploadedCount === 0) {
        console.log(`  No valid images for gallery "${jsonData.title}", skipping...\n`)
        skipped++
        continue
      }

      // Create gallery data - link to the folder, not individual images
      const galleryData: any = {
        title: jsonData.title,
        slug,
        images: galleryFolderId, // Link to the folder containing all images
        publishedAt: new Date(),
        _status: 'published',
        meta: {
          title: jsonData.title,
          description: `Gallery: ${jsonData.title}`,
        },
      }

      // Create the gallery (disable revalidation during import)
      const result = await payload.create({
        collection: 'gallery',
        depth: 0,
        context: {
          disableRevalidate: true,
        },
        data: galleryData,
      })

      console.log(`Created gallery: "${jsonData.title}"`)
      console.log(`   Slug: ${result.slug}`)
      console.log(`   Images: ${uploadedCount} of ${jsonData.images.length}`)
      console.log(`   Folder ID: ${galleryFolderId}`)
      console.log(`   Published: ${new Date().toISOString()}\n`)

      imported++
    } catch (error) {
      console.error(`Error processing ${folder}/${file}:`, error)
      console.error('')
      errors++
    }
  }

  console.log('=======================================')
  console.log('Gallery Import Summary:')
  console.log(`   Imported: ${imported}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Processed: ${filesToImport.length}`)
  if (startIndex > 0 || limitCount !== null) {
    console.log(`   Total Available: ${jsonFiles.length}`)
    console.log(
      `   Range: ${startIndex}-${Math.min(startIndex + filesToImport.length - 1, jsonFiles.length - 1)}`,
    )
  }
  console.log('=======================================\n')

  // Write image issues log if any
  if (imageIssues.length > 0) {
    const logFilePath = path.resolve(__dirname, '../logs/gallery-image-issues.log')
    const logDir = path.dirname(logFilePath)

    // Create logs directory if it doesn't exist
    await fs.mkdir(logDir, { recursive: true })

    // Create log content
    const logContent = [
      '# Gallery Image Issues Log',
      `# Generated: ${new Date().toISOString()}`,
      `# Total issues: ${imageIssues.length}`,
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
    ]

    // Group by reason
    const notFound = imageIssues.filter((i) => i.reason === 'not_found')
    const corrupted = imageIssues.filter((i) => i.reason === 'corrupted')
    const other = imageIssues.filter((i) => i.reason === 'error')

    if (notFound.length > 0) {
      logContent.push('## IMAGES NOT FOUND')
      logContent.push('')
      notFound.forEach((issue) => {
        logContent.push(`Gallery: ${issue.galleryTitle}`)
        logContent.push(`Slug: ${issue.gallerySlug}`)
        logContent.push(`Image: ${issue.imagePath}`)
        logContent.push(`Admin URL: /admin/collections/gallery/${issue.gallerySlug}`)
        logContent.push('---')
        logContent.push('')
      })
    }

    if (corrupted.length > 0) {
      logContent.push('## CORRUPTED/INVALID IMAGES')
      logContent.push('')
      corrupted.forEach((issue) => {
        logContent.push(`Gallery: ${issue.galleryTitle}`)
        logContent.push(`Slug: ${issue.gallerySlug}`)
        logContent.push(`Image: ${issue.imagePath}`)
        logContent.push(`Error: ${issue.error}`)
        logContent.push(`Admin URL: /admin/collections/gallery/${issue.gallerySlug}`)
        logContent.push('---')
        logContent.push('')
      })
    }

    if (other.length > 0) {
      logContent.push('## OTHER ERRORS')
      logContent.push('')
      other.forEach((issue) => {
        logContent.push(`Gallery: ${issue.galleryTitle}`)
        logContent.push(`Slug: ${issue.gallerySlug}`)
        logContent.push(`Image: ${issue.imagePath}`)
        logContent.push(`Error: ${issue.error}`)
        logContent.push(`Admin URL: /admin/collections/gallery/${issue.gallerySlug}`)
        logContent.push('---')
        logContent.push('')
      })
    }

    // Write to file
    await fs.writeFile(logFilePath, logContent.join('\n'), 'utf-8')

    console.log('Gallery Image Issues Detected:')
    console.log(`   Not Found: ${notFound.length}`)
    console.log(`   Corrupted: ${corrupted.length}`)
    console.log(`   Other Errors: ${other.length}`)
    console.log(`   Log file: ${logFilePath}\n`)
  }

  process.exit(0)
}

// Run the import
importGalleries().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
