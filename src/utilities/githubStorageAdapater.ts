import { Octokit } from '@octokit/rest'
import type {
  Adapter as GenericAdapter,
  GeneratedAdapter,
  HandleUpload,
  HandleDelete,
  StaticHandler,
  GenerateURL,
  Adapter,
} from '@payloadcms/plugin-cloud-storage/types'

interface GithubAdapterOptions {
  owner: string
  repo: string
  branch?: string
  token: string
  basePath?: string
}

// The adapter function matches your Adapter type
export const githubStorageAdapter = (options: GithubAdapterOptions): GenericAdapter => {
  const { owner, repo, token, branch = 'main', basePath = 'media' } = options
  const octokit = new Octokit({ auth: token })

  return ({ collection, prefix }) => {
    const handleUpload: HandleUpload = async ({ file }) => {
      const path = `${basePath}/${file.filename}`
      const content = file.buffer.toString('base64')

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `upload ${file.filename}`,
        content,
        branch,
      })

      return { filename: file.filename }
    }

    const handleDelete: HandleDelete = async ({ filename }) => {
      const path = `${basePath}/${filename}`

      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      })

      if (!('sha' in data)) return

      await octokit.repos.deleteFile({
        owner,
        repo,
        path,
        message: `delete ${filename}`,
        sha: data.sha,
        branch,
      })
    }

    const generateURL: GenerateURL = ({ filename }) =>
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${basePath}/${filename}`

    const staticHandler: StaticHandler = async (req) => {
      if (!req.url) return new Response('Invalid request', { status: 400 })

      const url = new URL(req.url)
      const filename = url.pathname.split('/').pop()
      if (!filename) return new Response('File not found', { status: 404 })

      return Response.redirect(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${basePath}/${filename}`,
        302,
      )
    }

    const adapterObject: GeneratedAdapter = {
      name: 'github-storage', // required
      handleUpload,
      handleDelete,
      generateURL,
      staticHandler,
      onInit: () => console.log('GitHub storage adapter initialized'),
    }

    return adapterObject
  }
}
