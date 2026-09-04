import { defineConfig } from 'tsup'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { Server as SocketIO } from 'socket.io'
import { globby } from 'globby'
import commonjsPlugin from '@chialab/esbuild-plugin-commonjs'

// Add this GLSL loader plugin
const glslLoader = {
  name: 'glsl-loader',
  setup(build) {
    build.onLoad({ filter: /\.(glsl|vs|fs|vert|frag)$/ }, async (args) => {
      const contents = await fs.promises.readFile(args.path, 'utf8')
      return {
        contents: `export default ${JSON.stringify(contents)};`,
        loader: 'js',
      }
    })
  },
}

export default defineConfig(async (options) => {
  const isDev = options.watch
  let io: SocketIO | null = null

  if (isDev) {
    // Create socket server
    const socketServer = http.createServer()
    io = new SocketIO(socketServer, {
      cors: {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
      },
    })
    socketServer.listen(8001, '0.0.0.0')
  }

  const basePath = path.join(process.cwd(), 'src')

  // react-reconciler (a @react-three/fiber dep) is CJS-only and ships a dev/prod split via index.js.
  // - esbuild alone can't convert its `require("react")` to an import (-> "Dynamic require not supported")
  // - @chialab/esbuild-plugin-commonjs converts the require, but always picks the DEV build (overrides
  //   our `define`) which crashes against Framer's production react, and corrupts the prod.min build.
  // So we resolve react-reconciler straight to its production file and wrap it ourselves: provide a tiny
  // `require` shim backed by real ESM imports of react/scheduler. commonjsPlugin still handles zustand/scheduler.
  const [reconcilerProd] = await globby([
    path.join(
      process.cwd(),
      '../../node_modules/.pnpm/react-reconciler@*/node_modules/react-reconciler/cjs/react-reconciler.production.min.js'
    ),
    path.join(
      process.cwd(),
      'node_modules/.pnpm/react-reconciler@*/node_modules/react-reconciler/cjs/react-reconciler.production.min.js'
    ),
  ])

  // scheduler has the same dev/prod split + commonjs interop issue. react-reconciler calls
  // scheduler.unstable_scheduleCallback on unmount (removeChild); when scheduler is wrapped as a
  // lazy/getter commonjs module its export is undefined at call time -> "__export16 is not a function".
  const [schedulerProd] = await globby([
    path.join(
      process.cwd(),
      '../../node_modules/.pnpm/scheduler@*/node_modules/scheduler/cjs/scheduler.production.min.js'
    ),
    path.join(
      process.cwd(),
      'node_modules/.pnpm/scheduler@*/node_modules/scheduler/cjs/scheduler.production.min.js'
    ),
  ])

  // Wrap a CJS file as an eager ESM module: provide module/exports (and a require shim), inline the
  // source, then `export default module.exports`. Eager evaluation means consumers see a fully
  // initialized export immediately (no lazy/getter indirection).
  const cjsWrap = (code: string, requireShim: string) =>
    [
      requireShim,
      'var module = { exports: {} };',
      'var exports = module.exports;',
      code,
      'export default module.exports;',
    ].join('\n')

  const reconcilerProdPlugin = {
    name: 'react-prod-cjs-wrap',
    setup(build: any) {
      if (reconcilerProd) {
        build.onResolve({ filter: /^react-reconciler$/ }, () => ({
          path: reconcilerProd,
          namespace: 'rr-prod',
        }))
        build.onLoad({ filter: /.*/, namespace: 'rr-prod' }, async () => {
          const code = await fs.promises.readFile(reconcilerProd, 'utf8')
          return {
            contents: [
              'import * as __react from "react";',
              'import * as __scheduler from "scheduler";',
              cjsWrap(
                code,
                'var require = (id) => id === "react" ? (__react.default || __react)' +
                  ' : id === "scheduler" ? (__scheduler.default || __scheduler)' +
                  ' : (() => { throw new Error("react-reconciler unexpected require: " + id) })();'
              ),
            ].join('\n'),
            loader: 'js',
            resolveDir: path.dirname(reconcilerProd),
          }
        })
      }
      if (schedulerProd) {
        build.onResolve({ filter: /^scheduler$/ }, () => ({
          path: schedulerProd,
          namespace: 'sched-prod',
        }))
        build.onLoad({ filter: /.*/, namespace: 'sched-prod' }, async () => {
          const code = await fs.promises.readFile(schedulerProd, 'utf8')
          // fiber imports scheduler with named imports (unstable_scheduleCallback, unstable_IdlePriority, ...).
          // Re-export every `exports.X` from the inlined module as a named ESM export (eager snapshot).
          const names = [
            ...new Set(
              [...code.matchAll(/exports\.([A-Za-z_0-9$]+)\s*=/g)].map((m) => m[1])
            ),
          ]
          const named = names
            .map((n) => `export var ${n} = module.exports.${n};`)
            .join('\n')
          return {
            contents:
              cjsWrap(
                code,
                'var require = (id) => { throw new Error("scheduler unexpected require: " + id) };'
              ) +
              '\n' +
              named,
            loader: 'js',
            resolveDir: path.dirname(schedulerProd),
          }
        })
      }
    },
  }

  return {
    entry: await globby([`${basePath}/**/*.(t|j)s*`, `!${basePath}/**/*.d.ts`]),
    platform: 'browser',
    format: ['esm'],
    dts: {
      entry: 'src/index.ts',
    },
    minify: false, // disable minify for framer (minified build has react-reconciler error)
    clean: true,
    // Force the production build of react-reconciler (bundled via @react-three/fiber). Without this its
    // index.js dev/prod branch resolves to the DEV build, whose act-environment / DEV-warning code
    // (warnIfUpdatesNotWrappedWithActDEV, isConcurrentActEnvironment) reads React internals that Framer's
    // production react doesn't expose -> "Cannot read properties of undefined (reading 'current')".
    // NOTE: do NOT add @chialab/esbuild-plugin-commonjs here — it overrides this define (re-introducing the
    // DEV build) and corrupts react-reconciler.production.min.js (__exportNN is not a function). esbuild's
    // native CJS interop bundles three/react-reconciler/zustand fine on its own.
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },

    // internal bundles
    // ['@react-spring/three', '@react-three/fiber', '@react-three/drei', 'three']

    // Framer's canvas sandbox import map only resolves react / react-dom / framer.
    // Everything else (three, @react-three/fiber and its react-reconciler dep incl. 'react-reconciler/constants')
    // must be bundled, otherwise the sandbox throws "Unable to resolve specifier".
    external: ['react', 'framer'],
    noExternal: ['three', '@react-three/fiber', 'react-reconciler'],
    esbuildPlugins: [glslLoader, reconcilerProdPlugin, commonjsPlugin()],
    async onSuccess() {
      if (!isDev) return

      io?.emit('build')

      // Create the HTTP server
      const server = http.createServer((req, res) => {
        // Construct the file path
        let filePath = path.join(
          __dirname,
          'dist',
          req.url === '/' || !req.url ? 'index.html' : req.url
        )
        let extname = String(path.extname(filePath)).toLowerCase()
        // need to remove query from extname
        extname = extname.split('?')[0]
        filePath = filePath.split('?')[0]

        console.log('extname', extname)
        console.log('filePath', filePath)

        // Map file extensions to Content-Type
        const mimeTypes = {
          '.js': 'text/javascript',
          '.mjs': 'application/javascript',
          '.css': 'text/css',
          '.html': 'text/html',
        }

        let contentType = mimeTypes[extname] || 'application/octet-stream'

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*') // Adjust as necessary for security

        // Check if the file exists and serve it, otherwise serve a 404 page
        fs.readFile(filePath, (error, content) => {
          if (error) {
            if (error.code === 'ENOENT') {
              // File not found
              res.writeHead(404, { 'Content-Type': 'text/html' })
              res.end('<h1>404 Not Found</h1>', 'utf-8')
            } else {
              // Some server error
              res.writeHead(500)
              res.end(`Server error: ${error.code}`, 'utf-8')
            }
          } else {
            // If no error, serve the file
            res.writeHead(200, { 'Content-Type': contentType })
            res.end(content, 'utf-8')
          }
        })
      })
      server.listen(8000)
      return () => {
        server.close()
      }
    },
  }
})
