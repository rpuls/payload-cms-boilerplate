import { webpackBundler } from '@payloadcms/bundler-webpack'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloud } from '@payloadcms/plugin-cloud'
import nestedDocs from '@payloadcms/plugin-nested-docs'
import redirects from '@payloadcms/plugin-redirects'
import seo from '@payloadcms/plugin-seo'
import type { GenerateTitle } from '@payloadcms/plugin-seo/types'
import { slateEditor } from '@payloadcms/richtext-slate'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { buildConfig } from 'payload/config'

import Categories from './collections/Categories'
import Comments from './collections/Comments'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import Users from './collections/Users'
import BeforeDashboard from './components/BeforeDashboard'
import BeforeLogin from './components/BeforeLogin'
import { seed } from './endpoints/seed'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { Settings } from './globals/Settings'

const generateTitle: GenerateTitle = () => {
  return 'My Website'
}

dotenv.config({
  path: path.resolve(__dirname, '../../.env')
})

export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    components: {
      beforeLogin: [BeforeLogin],
      beforeDashboard: [BeforeDashboard]
    },
    webpack: config => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          dotenv: path.resolve(__dirname, './dotenv.js'),
          [path.resolve(__dirname, './endpoints/seed')]: path.resolve(
            __dirname,
            './emptyModuleMock.js'
          )
        }
      }
    })
  },
  editor: slateEditor({}),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI
    }
  }),
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  collections: [Pages, Posts, Projects, Media, Categories, Users, Comments],
  globals: [Settings, Header, Footer],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts')
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql')
  },
  cors: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  csrf: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  endpoints: [
    // The seed endpoint is used to populate the database with some example data
    // You should delete this endpoint before deploying your site to production
    {
      path: '/scan-filesystem',
      method: 'get',
      handler: async (req, res) => {
        const startDir = '/app' // Start scanning from /app or change to '/' for root

        const scanDirectory = (dirPath: string): string[] => {
          let results = []
          const list = fs.readdirSync(dirPath)
          list.forEach(file => {
            const filePath = path.join(dirPath, file)
            const stat = fs.statSync(filePath)
            if (stat && stat.isDirectory()) {
              // Recursively scan subdirectories
              results = results.concat(scanDirectory(filePath))
            } else {
              // Add file to results
              results.push(filePath)
            }
          })
          return results
        }

        try {
          const files = scanDirectory(startDir) // Scan starting from /app
          return res.json({ files })
        } catch (err: unknown) {
          if (err instanceof Error) {
            return res.status(500).json({ error: `Unable to scan directory: ${err.message}` })
          }
          return res.status(500).json({ error: 'Unable to scan directory' })
        }
      }
    },
    {
      path: '/seed',
      method: 'get',
      handler: seed
    },
    // Health check endpoint
    {
      path: '/health',
      method: 'get',
      handler: (req, res) => {
        res.status(200).send('OK')
      }
    }
  ],
  plugins: [
    redirects({
      collections: ['pages', 'posts']
    }),
    nestedDocs({
      collections: ['categories']
    }),
    seo({
      collections: ['pages', 'posts', 'projects'],
      generateTitle,
      uploadsCollection: 'media'
    }),
    payloadCloud()
  ]
})
