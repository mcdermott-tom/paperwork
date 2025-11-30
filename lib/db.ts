// lib/prisma.ts

import { PrismaClient } from '@prisma/client'

// 1. Declare the global variable (used by the singleton pattern)
declare global {
  var prisma: PrismaClient | undefined
}

// 2. Export the globally stored instance as 'db' if it exists, otherwise create a new one.
export const db = global.prisma || new PrismaClient()

// 3. Store the client on the global object in development mode
if (process.env.NODE_ENV !== 'production') {
  global.prisma = db
}