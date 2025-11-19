import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import obfuscator from 'rollup-plugin-obfuscator';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // obfuscator({
    // global: true,
    // options: {
    // compact: true,
    // controlFlowFlattening: true,
    // deadCodeInjection: true,
    // debugProtection: false,
    // disableConsoleOutput: true,
    // identifierNamesGenerator: 'hexadecimal',
    // log: false,
    // numbersToExpressions: true,
    // renameGlobals: false,
    // selfDefending: true,
    // simplify: true,
    // splitStrings: true,
    // stringArray: true,
    // stringArrayCallsTransform: true,
    // stringArrayEncoding: ['rc4'],
    // stringArrayIndexShift: true,
    // stringArrayRotate: true,
    // stringArrayShuffle: true,
    // stringArrayWrappersCount: 1,
    // stringArrayWrappersChainedCalls: true,
    // stringArrayWrappersParametersMaxCount: 2,
    // stringArrayWrappersType: 'variable',
    // stringArrayThreshold: 0.75,
    // unicodeEscapeSequence: false
    // }
    // })
  ],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  base: './',
})
