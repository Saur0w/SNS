import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
    bytes: number;
    format: string;
    resource_type: string;
    created_at: string;
}

export async function POST(request: NextRequest) {
    console.log('🚀 Upload API called');

    try {
        // Check environment variables
        if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET) {
            console.error('❌ Missing Cloudinary environment variables');
            return NextResponse.json({
                success: false,
                error: 'Cloudinary configuration missing'
            }, { status: 500 });
        }

        console.log('✅ Environment variables present');

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const tags = formData.get('tags') as string;
        const category = formData.get('category') as string;

        console.log('📝 Form data:', {
            hasFile: !!file,
            title,
            category,
            fileSize: file?.size,
            fileName: file?.name
        });

        if (!file) {
            return NextResponse.json({
                success: false,
                error: 'No file provided'
            }, { status: 400 });
        }

        if (!['portrait', 'landscape', 'bw'].includes(category)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid category'
            }, { status: 400 });
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({
                success: false,
                error: 'File size must be less than 10MB'
            }, { status: 400 });
        }

        console.log('✅ Validation passed, converting file...');

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log('📤 Uploading to Cloudinary...');

        // Upload to Cloudinary
        const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: `sns-gallery/${category}`,
                    public_id: `${Date.now()}-${file.name.split('.')[0]}`,
                    resource_type: 'auto',
                    context: {
                        title: title || '',
                        description: description || '',
                        category: category
                    },
                    tags: [
                        category,
                        'sns-gallery',
                        ...(tags ? tags.split(',').map(tag => tag.trim()) : [])
                    ]
                },
                (error, result) => {
                    if (error) {
                        console.error('❌ Cloudinary error:', error);
                        reject(error);
                    } else if (result) {
                        console.log('✅ Cloudinary upload successful:', result.public_id);
                        resolve(result as CloudinaryUploadResult);
                    } else {
                        reject(new Error('Upload result is undefined'));
                    }
                }
            ).end(buffer);
        });

        // Prepare image data for GitHub
        const imageData = {
            title: title || 'Untitled',
            description: description || '',
            cloudinaryUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            dimensions: {
                width: uploadResult.width,
                height: uploadResult.height
            },
            fileSize: `${(uploadResult.bytes / 1024 / 1024).toFixed(1)}MB`
        };

        console.log('📝 Saving to GitHub...');

        // Add to GitHub via the category API
        const githubResponse = await fetch(`${request.nextUrl.origin}/api/admin/${category}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageData })
        });

        const githubData = await githubResponse.json();
        console.log('GitHub response:', githubData);

        if (!githubResponse.ok) {
            console.error('❌ GitHub API error:', githubData);
            throw new Error(`GitHub API error: ${githubData.error || 'Unknown error'}`);
        }

        console.log('✅ Upload completed successfully');

        return NextResponse.json({
            success: true,
            message: 'Upload completed successfully',
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            imageData: imageData
        });

    } catch (error) {
        console.error('❌ Upload error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Upload failed';

        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}

// Handle other methods
export async function GET() {
    return NextResponse.json({
        success: false,
        error: 'Method not allowed'
    }, { status: 405 });
}
