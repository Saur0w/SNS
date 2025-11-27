import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CacheEntry {
    data: ImageData[];
    timestamp: number;
}

interface ImageData {
    id: string;
    url: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    uploadedAt: string;
    updatedAt?: string;
}

interface GithubFile {
    content: string;
    sha: string;
}

const galleryCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 1000; // 30 seconds

function validateEnvVars(): void {
    const required = ['GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_TOKEN'];
    const missing = required.filter(env => !process.env[env]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

function getGithubHeaders(): Record<string, string> {
    return {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'NextJS-Gallery-App',
        'X-Github-Api-Version': '2022-11-28'
    };
}

function generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export async function GET() {
    try {
        validateEnvVars();

        const cacheEntry = galleryCache.get('images');
        if (cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TTL) {
            return NextResponse.json({ images: cacheEntry.data });
        }

        const response = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/content.json`,
            {
                headers: getGithubHeaders(),
                cache: 'no-store'
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ images: [] });
            }
            throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
        }

        const file: GithubFile = await response.json();
        const contentJson = JSON.parse(Buffer.from(file.content, 'base64').toString());
        const images: ImageData[] = contentJson.images || [];

        galleryCache.set('images', { data: images, timestamp: Date.now() });

        return NextResponse.json({ images });

    } catch (error) {
        console.error('Error in GET /api/gallery:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({
            error: errorMessage
        }, { status: 500 });
    }
}

// POST - Add new image to gallery
export async function POST(request: NextRequest) {
    try {
        validateEnvVars();

        const body = await request.json();
        const { image } = body;

        if (!image || !image.url) {
            return NextResponse.json(
                { error: 'Image URL is required' },
                { status: 400 }
            );
        }

        // ALWAYS fetch the latest content and SHA
        const response = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/content.json`,
            {
                headers: getGithubHeaders(),
                cache: 'no-store'
            }
        );

        let sha: string | undefined;
        let currentImages: ImageData[] = [];

        if (response.ok) {
            const file: GithubFile = await response.json();
            sha = file.sha; // Get the LATEST SHA
            const contentJson = JSON.parse(Buffer.from(file.content, 'base64').toString());
            currentImages = contentJson.images || [];
        } else if (response.status === 404) {
            // File doesn't exist yet, create it
            sha = undefined;
        } else {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        // Add new image
        const newImage: ImageData = {
            id: generateId(),
            url: image.url,
            title: image.title || '',
            description: image.description || '',
            category: image.category || 'general',
            tags: image.tags || [],
            uploadedAt: new Date().toISOString()
        };

        currentImages.push(newImage);

        // Update GitHub with the LATEST SHA
        const updateResponse = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/content.json`,
            {
                method: 'PUT',
                headers: getGithubHeaders(),
                body: JSON.stringify({
                    message: `Add new image: ${newImage.title || newImage.id}`,
                    content: Buffer.from(JSON.stringify({ images: currentImages }, null, 2)).toString('base64'),
                    sha: sha // Use the fresh SHA we just fetched
                })
            }
        );

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.message || 'Failed to update GitHub');
        }

        // Clear cache
        galleryCache.delete('images');

        return NextResponse.json({
            success: true,
            image: newImage
        });

    } catch (error) {
        console.error('Error in POST /api/gallery:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({
            error: errorMessage
        }, { status: 500 });
    }
}



export async function PUT(request: NextRequest) {
    try {
        validateEnvVars();

        const body = await request.json();
        const { action, imageId, imageData } = body;

        const response = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/content.json`,
            {
                headers: getGithubHeaders(),
                cache: 'no-store'
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch current gallery data');
        }

        const file: GithubFile = await response.json();
        const sha = file.sha;
        const contentJson = JSON.parse(Buffer.from(file.content, 'base64').toString());
        let images: ImageData[] = contentJson.images || [];

        if (action === 'update') {
            const imageIndex = images.findIndex((img: ImageData) => img.id === imageId);
            if (imageIndex === -1) {
                return NextResponse.json(
                    { error: 'Image not found' },
                    { status: 404 }
                );
            }

            images[imageIndex] = {
                ...images[imageIndex],
                ...imageData,
                updatedAt: new Date().toISOString()
            };

        } else if (action === 'delete') {
            images = images.filter((img: ImageData) => img.id !== imageId);
        } else {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }

        const updateResponse = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/content.json`,
            {
                method: 'PUT',
                headers: getGithubHeaders(),
                body: JSON.stringify({
                    message: `${action === 'update' ? 'Update' : 'Delete'} image: ${imageId}`,
                    content: Buffer.from(JSON.stringify({ images }, null, 2)).toString('base64'),
                    sha: sha
                })
            }
        );

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.message || 'Failed to update GitHub');
        }

        galleryCache.delete('images');

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in PUT /api/gallery:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({
            error: errorMessage
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const imageId = searchParams.get('id');

        if (!imageId) {
            return NextResponse.json(
                { error: 'Image ID is required' },
                { status: 400 }
            );
        }

        return PUT(new Request(request.url, {
            method: 'PUT',
            headers: request.headers,
            body: JSON.stringify({ action: 'delete', imageId })
        }) as NextRequest);

    } catch (error) {
        console.error('Error in DELETE /api/gallery:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({
            error: errorMessage
        }, { status: 500 });
    }
}
