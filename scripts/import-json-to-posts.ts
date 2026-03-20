import 'dotenv/config'
import { PayloadSDK } from '@payloadcms/sdk'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import type { Config } from '@/payload-types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface JsonPost {
  file: string
  image: string
  date: string
  title: string
  body: string
}

interface ImageIssue {
  postTitle: string
  postSlug: string
  imagePath: string
  reason: 'not_found' | 'corrupted' | 'error'
  error?: string
}

const imageIssues: ImageIssue[] = []
let postsFolderId: number | null = null

function getSdkBaseURL(): string {
  const fromEnv = process.env.PAYLOAD_API_URL || process.env.NEXT_PUBLIC_SERVER_URL

  if (!fromEnv) {
    throw new Error('Missing PAYLOAD_API_URL or NEXT_PUBLIC_SERVER_URL in environment variables.')
  }

  const normalized = fromEnv.endsWith('/') ? fromEnv.slice(0, -1) : fromEnv
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`
}

async function createSdkClient(): Promise<PayloadSDK<Config>> {
  const sdk = new PayloadSDK<Config>({
    baseURL: getSdkBaseURL(),
  })

  if (process.env.PAYLOAD_TOKEN) {
    sdk.baseInit = {
      ...sdk.baseInit,
      headers: {
        Authorization: `Bearer ${process.env.PAYLOAD_TOKEN}`,
      },
    }
    return sdk
  }

  const email = process.env.PAYLOAD_IMPORT_EMAIL
  const password = process.env.PAYLOAD_IMPORT_PASSWORD

  if (!email || !password) {
    throw new Error(
      'Authentication required. Set PAYLOAD_TOKEN or PAYLOAD_IMPORT_EMAIL and PAYLOAD_IMPORT_PASSWORD.',
    )
  }

  const loginResult = await sdk.login({
    collection: 'users',
    data: { email, password },
  })

  if (!loginResult.token) {
    throw new Error('Payload login succeeded but no token was returned.')
  }

  sdk.baseInit = {
    ...sdk.baseInit,
    headers: {
      Authorization: `Bearer ${loginResult.token}`,
    },
  }

  return sdk
}

// Get or create the "posts" folder
async function getOrCreatePostsFolder(sdk: PayloadSDK<Config>): Promise<number | null> {
  if (postsFolderId) {
    return postsFolderId
  }

  // Check if "Posts" folder already exists
  const existingFolders = await sdk.find({
    collection: 'payload-folders',
    where: {
      name: {
        equals: 'Posts',
      },
    },
    limit: 1,
  })

  if (existingFolders.docs.length > 0) {
    postsFolderId = existingFolders.docs[0].id
    console.log('Using existing "Posts" folder')
    return postsFolderId
  }

  // Create the "Posts" folder
  const newFolder = await sdk.create({
    collection: 'payload-folders',
    data: {
      name: 'Posts',
      folderType: ['media'],
    },
  })

  postsFolderId = newFolder.id
  console.log('Created new "Posts" folder')
  return postsFolderId
}

// Convert plain text to Lexical editor format
function textToLexical(text: string) {
  const paragraphs = text.split('\n\n').filter((line) => line.trim() !== '')

  const children: any[] = []

  // Add text paragraphs
  paragraphs.forEach((paragraph) => {
    const trimmedParagraph = paragraph.trim()

    children.push({
      children: [
        {
          text: trimmedParagraph,
          type: 'text',
        },
      ],
      direction: 'ltr' as const,
      format: '',
      indent: 0,
      type: 'paragraph',
      version: 1,
    })
  })

  return {
    root: {
      children,
      direction: 'ltr' as const,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

// Parse date from DD/MM/YYYY format
function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number)
  // Create date at noon UTC to avoid timezone issues
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

// Generate slug from title and date to ensure uniqueness
function generateSlug(title: string, date: Date): string {
  const baseSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen

  // Append date to make it unique (YYYY-MM-DD format)
  const dateStr = date.toISOString().split('T')[0]
  return `${baseSlug}-${dateStr}`
}

async function findOrCreateMedia(
  sdk: PayloadSDK<Config>,
  imagePath: string,
  postTitle: string,
  postSlug: string,
  postFolder: string,
) {
  // If imagePath is just a filename, look for it in the post folder
  const isRelativePath = !imagePath.includes('/')

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

  // Check if media already exists
  const existingMedia = await sdk.find({
    collection: 'media',
    where: {
      filename: {
        equals: filename,
      },
    },
    limit: 1,
  })

  if (existingMedia.docs.length > 0) {
    console.log(`Media already exists: ${filename}`)
    return existingMedia.docs[0].id
  }

  // Get the "Posts" folder
  const postsFolder = await getOrCreatePostsFolder(sdk)
  if (!postsFolder) {
    console.log(`  ⚠ Could not create or find "Posts" folder`)
    return null
  }

  // Try to find the image - first in post folder, then in data/images folder
  let dataImagePath: string
  if (isRelativePath) {
    // Image is in the same folder as data.json
    dataImagePath = path.resolve(__dirname, '../data/posts', postFolder, imagePath)
  } else {
    // Image has a path (legacy format)
    dataImagePath = path.resolve(__dirname, '../data', imagePath)
  }

  try {
    // Check if image exists in data/images
    await fs.access(dataImagePath)

    // Read the file
    const fileBuffer = await fs.readFile(dataImagePath)

    // Process image with Sharp to handle corrupted files
    const processedBuffer = await sharp(fileBuffer, { failOnError: false }).toBuffer()

    console.log(
      `Uploading image: ${filename} (${mimetype}, ${(processedBuffer.length / 1024).toFixed(1)} KB)`,
    )

    // Create media entry using Payload's upload API
    try {
      const fileBytes = Uint8Array.from(processedBuffer)

      const media = await sdk.create({
        collection: 'media',
        data: {
          alt: filename.replace(/\.[^/.]+$/, ''), // Remove extension for alt text
          folder: postsFolder, // Assign to "Posts" folder
        },
        file: new File([fileBytes], filename, { type: mimetype }),
      })

      console.log(
        `Uploaded and created media entry: ${filename} (${(processedBuffer.length / 1024).toFixed(1)} KB, in "Posts" folder)`,
      )
      return media.id
    } catch (uploadError: any) {
      // Handle image processing errors (corrupted images, etc.)
      if (
        uploadError.message?.includes('Vips') ||
        uploadError.message?.includes('JPEG') ||
        uploadError.message?.includes('image')
      ) {
        console.log(`Image is corrupted or invalid: ${filename}`)
        console.log(`Skipping image upload, post will be created without hero image`)
        imageIssues.push({
          postTitle,
          postSlug,
          imagePath,
          reason: 'corrupted',
          error: uploadError.message,
        })
      } else {
        throw uploadError // Re-throw if it's not an image processing error
      }
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`Image file not found: ${imagePath}`)
      console.log(`Searched at: ${dataImagePath}`)
      imageIssues.push({
        postTitle,
        postSlug,
        imagePath,
        reason: 'not_found',
      })
    } else if (!error.message?.includes('Vips') && !error.message?.includes('JPEG')) {
      console.log(`Error processing image: ${error.message}`)
      imageIssues.push({
        postTitle,
        postSlug,
        imagePath,
        reason: 'error',
        error: error.message,
      })
    }
  }

  return null
}

async function importPosts() {
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
      console.error('❌ Invalid --start value. Must be a positive integer.')
      process.exit(1)
    }
  }

  // Check for --limit argument
  const limitArgIndex = args.findIndex((arg) => arg === '--limit')
  if (limitArgIndex !== -1 && args[limitArgIndex + 1]) {
    limitCount = parseInt(args[limitArgIndex + 1], 10)
    if (isNaN(limitCount) || limitCount < 1) {
      console.error('❌ Invalid --limit value. Must be a positive integer.')
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
        console.error('❌ Invalid --range value. End must be greater than or equal to start.')
        process.exit(1)
      }
      limitCount = endIndex - startIndex + 1
    } else {
      console.error('❌ Invalid --range format. Use: --range START-END (e.g., --range 0-50)')
      process.exit(1)
    }
  }

  console.log('Starting post import...\n')

  // Initialize Payload
  const sdk = await createSdkClient()
  console.log('Payload SDK initialized\n')

  if (shouldDelete) {
    console.log('DELETE MODE: Deleting all posts and media in "Posts" folder...\n')

    // Initialize the "Posts" folder to get its ID
    const postsFolderId = await getOrCreatePostsFolder(sdk)

    // Get all posts
    const allPosts = await sdk.find({
      collection: 'posts',
      limit: 1500, // Adjust if you have more than 1500 posts
    })

    console.log(`Found ${allPosts.docs.length} posts to delete\n`)

    let deletedPosts = 0
    let postErrors = 0

    for (const post of allPosts.docs) {
      try {
        console.log(`Deleting post: "${post.title}" (${post.slug})`)
        await sdk.delete({
          collection: 'posts',
          id: post.id,
        })
        deletedPosts++
      } catch (error) {
        console.error(`❌ Error deleting post "${post.title}":`, error)
        postErrors++
      }
    }

    // Get all media in "Posts" folder only
    const allMedia = await sdk.find({
      collection: 'media',
      where: {
        folder: {
          equals: postsFolderId,
        },
      },
      limit: 1500, // Adjust if you have more than 1500 media files
    })

    console.log(`\nFound ${allMedia.docs.length} media files in "Posts" folder to delete\n`)

    let deletedMedia = 0
    let mediaErrors = 0

    for (const media of allMedia.docs) {
      try {
        console.log(`Deleting media: "${media.filename}" (${media.id})`)
        await sdk.delete({
          collection: 'media',
          id: media.id,
        })
        deletedMedia++
      } catch (error) {
        console.error(`❌ Error deleting media "${media.filename}":`, error)
        mediaErrors++
      }
    }

    console.log('\n=======================================')
    console.log('Delete Summary:')
    console.log(`   Posts Deleted: ${deletedPosts}`)
    console.log(`   Post Errors: ${postErrors}`)
    console.log(`   Media Deleted (Posts folder): ${deletedMedia}`)
    console.log(`   Media Errors: ${mediaErrors}`)
    console.log(`   Total Posts: ${allPosts.docs.length}`)
    console.log(`   Total Media (Posts): ${allMedia.docs.length}`)
    console.log('=======================================\n')

    process.exit(0)
  }

  // Initialize the "Posts" folder for media uploads
  await getOrCreatePostsFolder(sdk)

  // Continue with normal import logic...

  // Read all JSON files from data/posts directory (now organized in ID folders)
  const dataDir = path.resolve(__dirname, '../data/posts')
  const idFolders = await fs.readdir(dataDir)

  // Collect all data.json files from ID folders
  const jsonFiles: Array<{ folder: string; file: string }> = []
  for (const folder of idFolders) {
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

  console.log(`Found ${jsonFiles.length} JSON files to import`)

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
      const jsonData: JsonPost = JSON.parse(fileContent)

      // Parse date
      const publishedAt = parseDate(jsonData.date)

      // Generate unique slug with date
      const slug = generateSlug(jsonData.title, publishedAt)

      // Check if post already exists
      const existingPost = await sdk.find({
        collection: 'posts',
        where: {
          slug: {
            equals: slug,
          },
        },
        limit: 1,
      })

      if (existingPost.docs.length > 0) {
        console.log(`Post already exists: "${jsonData.title}" (${slug})\n`)
        skipped++
        continue
      }

      // Try to find or create media
      let heroImageId = null
      if (jsonData.image) {
        heroImageId = await findOrCreateMedia(sdk, jsonData.image, jsonData.title, slug, folder)
      }

      // Convert body text to Lexical format with image at the beginning
      const content = textToLexical(jsonData.body)

      // Extract first 100 characters for meta description
      const plainText = jsonData.body.replace(/\n\n/g, ' ').replace(/\n/g, ' ')
      const metaDescription = plainText.length > 97 ? plainText.substring(0, 97) + '...' : plainText

      // Create post data with unique slug
      const postData: any = {
        title: jsonData.title,
        slug,
        heroImage: heroImageId,
        content,
        publishedAt,
        updateDate: publishedAt, // Set updateDate same as creation
        _status: 'published',
        authors: [1],
        categories: [],
        meta: {
          title: jsonData.title,
          description: metaDescription,
          image: heroImageId,
        },
      }

      // Remove meta image if no hero image (don't include null values)
      if (!heroImageId) {
        delete postData.meta.image
      }

      // Create the post (disable revalidation during import)
      const result = await sdk.create({
        collection: 'posts',
        depth: 0,
        data: postData,
      })

      console.log(`Created post: "${jsonData.title}"`)
      console.log(`   Slug: ${result.slug}`)
      console.log(`   Published: ${publishedAt.toISOString()}`)
      console.log(`   Content Image: ${heroImageId ? 'Yes (at top)' : 'No'}\n`)

      imported++
    } catch (error) {
      console.error(`Error processing ${folder}/${file}:`, error)
      console.error('')
      errors++
    }
  }

  console.log('=======================================')
  console.log('Import Summary:')
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
    const logFilePath = path.resolve(__dirname, '../logs/image-issues.log')
    const logDir = path.dirname(logFilePath)

    // Create logs directory if it doesn't exist
    await fs.mkdir(logDir, { recursive: true })

    // Create log content
    const logContent = [
      '# Image Issues Log',
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
        logContent.push(`Post: ${issue.postTitle}`)
        logContent.push(`Slug: ${issue.postSlug}`)
        logContent.push(`Image: ${issue.imagePath}`)
        logContent.push(`Admin URL: /admin/collections/posts/${issue.postSlug}`)
        logContent.push('---')
        logContent.push('')
      })
    }

    if (corrupted.length > 0) {
      logContent.push('## CORRUPTED/INVALID IMAGES')
      logContent.push('')
      corrupted.forEach((issue) => {
        logContent.push(`Post: ${issue.postTitle}`)
        logContent.push(`Slug: ${issue.postSlug}`)
        logContent.push(`Image: ${issue.imagePath}`)
        logContent.push(`Error: ${issue.error}`)
        logContent.push(`Admin URL: /admin/collections/posts/${issue.postSlug}`)
        logContent.push('---')
        logContent.push('')
      })
    }

    if (other.length > 0) {
      logContent.push('## OTHER ERRORS')
      logContent.push('')
      other.forEach((issue) => {
        logContent.push(`Post: ${issue.postTitle}`)
        logContent.push(`Slug: ${issue.postSlug}`)
        logContent.push(`Image: ${issue.imagePath}`)
        logContent.push(`Error: ${issue.error}`)
        logContent.push(`Admin URL: /admin/collections/posts/${issue.postSlug}`)
        logContent.push('---')
        logContent.push('')
      })
    }

    // Write to file
    await fs.writeFile(logFilePath, logContent.join('\n'), 'utf-8')

    console.log('Image Issues Detected:')
    console.log(`   Not Found: ${notFound.length}`)
    console.log(`   Corrupted: ${corrupted.length}`)
    console.log(`   Other Errors: ${other.length}`)
    console.log(`   Log file: ${logFilePath}\n`)
  }

  process.exit(0)
}

// Run the import
importPosts().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
