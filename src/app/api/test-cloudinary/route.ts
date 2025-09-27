import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
    try {
        // Test Cloudinary connection
        const result = await cloudinary.api.ping();

        return NextResponse.json({
            success: true,
            cloudinary: {
                connected: true,
                status: result.status
            },
            config: {
                cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                has_api_key: !!process.env.CLOUDINARY_API_KEY,
                has_api_secret: !!process.env.CLOUDINARY_API_SECRET
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            config: {
                cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                has_api_key: !!process.env.CLOUDINARY_API_KEY,
                has_api_secret: !!process.env.CLOUDINARY_API_SECRET
            }
        });
    }
}
