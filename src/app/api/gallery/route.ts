import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

interface GithubFileResponse {
    content: string;
    sha: string;
}

interface CacheStore {
    data: ImageData[];
    timestamp: number;
}

const galleryCache = new Map<string, CacheStore>();
const CACHE_TTL = 30 * 1000;

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

async function getGalleryData(): Promise<{ images: ImageData[]; sha?: string }> {
    const response = await fetch(
        `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/content.json`,
        {
            headers: {
                'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'NextJS-Gallery-App',
            },
            cache: 'no-store',
        }
    );

    if (response.status === 404) return { images: [], sha: undefined };
    if (!response.ok) throw new Error(`GitHub Fetch Error: ${response.status}`);

    const file: GithubFileResponse = await response.json();
    const content = Buffer.from(file.content, 'base64').toString('utf-8');
    const data = JSON.parse(content) as { images: ImageData[] };

    return {
        images: Array.isArray(data.images) ? data.images : [],
        sha: file.sha,
    };
}

async function updateGalleryData(images: ImageData[], sha: string | undefined, message: string): Promise<void> {
    // FIX 4: Build body explicitly — omit sha key entirely when undefined (required by GitHub for new files)
    const bodyPayload: Record<string, unknown> = {
        message,
        content: Buffer.from(JSON.stringify({ images }, null, 2)).toString('base64'),
    };
    if (sha !== undefined) bodyPayload.sha = sha;

    const response = await fetch(
        `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/content.json`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'NextJS-Gallery-App', // FIX 1: added missing header
            },
            body: JSON.stringify(bodyPayload),
        }
    );

    if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message || 'Failed to update GitHub');
    }

    galleryCache.delete('images');
}

export async function GET() {
    try {
        const cacheEntry = galleryCache.get('images');
        if (cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TTL) {
            return NextResponse.json({ images: cacheEntry.data });
        }

        const { images } = await getGalleryData();
        galleryCache.set('images', { data: images, timestamp: Date.now() });

        return NextResponse.json({ images });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as { image?: Partial<ImageData> };
        const image = body.image;

        if (!image?.url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

        const { images, sha } = await getGalleryData();

        const newImage: ImageData = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2),
            url: image.url,
            title: image.title || 'Untitled',
            description: image.description || '',
            category: image.category || 'general',
            tags: image.tags || [],
            uploadedAt: new Date().toISOString(),
        };

        await updateGalleryData([...images, newImage], sha, `Add image: ${newImage.title}`);

        return NextResponse.json({ success: true, image: newImage });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json() as { imageId?: string; imageData?: Partial<ImageData> };
        const { imageId, imageData } = body;

        // FIX 2: validate both fields before hitting the DB
        if (!imageId || !imageData) {
            return NextResponse.json({ error: 'imageId and imageData are required' }, { status: 400 });
        }

        const { images, sha } = await getGalleryData();

        const index = images.findIndex(img => img.id === imageId);
        if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // FIX 3: build a new array instead of mutating in place
        const updatedImages = images.map((img, i) =>
            i === index
                ? { ...img, ...imageData, id: img.id, updatedAt: new Date().toISOString() }
                : img
        );

        await updateGalleryData(updatedImages, sha, `Update image: ${imageId}`);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { images, sha } = await getGalleryData();
        const filtered = images.filter(img => img.id !== id);

        await updateGalleryData(filtered, sha, `Delete image: ${id}`);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}