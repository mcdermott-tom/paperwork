// lib/logger.ts
import { db } from '@/lib/db'
import { headers } from 'next/headers'

// Helper to get the user's IP (via Vercel/Next.js headers)
async function getIpAddress() {
    // FIX: You must await headers() in Next.js 15+
    const headersList = await headers();
    
    // Vercel standard header for real IP
    return headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown';
}

interface LogData {
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    oldData?: any;
    newData?: any;
}

export async function createAuditLog({ userId, action, entity, entityId, oldData, newData }: LogData) {
    // FIX: Await the async IP helper
    const ipAddress = await getIpAddress();
    
    await db.auditLog.create({
        data: {
            userId,
            action,
            entity,
            entityId,
            ipAddress,
            oldData: oldData, 
            newData: newData, 
        }
    });
}