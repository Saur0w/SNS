import { NextResponse } from 'next/server';

// Force dynamic API behavior
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// TypeScript interfaces
interface ImageData {
    id: number;
    title: string;
    description: string;
    url: string;
}

interface CacheEntry {
    data: ImageData[];
    timestamp: number;
}

interface ApiResponse {
    success: boolean;
    images?: ImageData[];
    error?: string;
}

// Cache for real-time updates
const contentCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 1000; // 30 seconds for real-time feel

// Helper function to validate environment variables
function validateEnvVars(): void {
    const required = ['GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_TOKEN'];
    const missing = required.filter(env => !process.env[env]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

// Helper function to get GitHub headers for API calls
function getGitHubHeaders(): Record<string, string> {
    return {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'NextJS-Gallery-App',
        'X-GitHub-Api-Version': '2022-11-28'
    };
}

// Helper function to get raw GitHub headers
function getRawGitHubHeaders(): Record<string, string> {
    return {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'NextJS-Gallery-App',
    };
}

// Helper function to get cache key
function getCacheKey(): string {
    return 'images';
}

// Helper function to check if cache is valid
function isCacheValid(cacheEntry: CacheEntry | undefined): boolean {
    return !!(cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TTL);
}

export async function GET(request: Request): Promise<NextResponse> {
    try {
        // Validate environment variables
        validateEnvVars();

        // For real-time updates, you might want to skip cache entirely
        const url = new URL(request.url);
        const skipCache = url.searchParams.get('fresh') === 'true';

        if (!skipCache) {
            // Check cache first
            const cacheKey = getCacheKey();
            const cachedContent = contentCache.get(cacheKey);

            if (isCacheValid(cachedContent) && cachedContent) {
                console.log('✅ Cache hit for images');
                return NextResponse.json({
                    success: true,
                    images: cachedContent.data
                }, {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                        'X-Cache': 'HIT'
                    }
                });
            }
        }

        console.log('🔍 Fetching fresh images from GitHub');

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            // Fetch from GitHub using raw URL (no base64 decoding needed)
            const response = await fetch(
                `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/contents/content.json?t=${Date.now()}`,
                {
                    headers: getRawGitHubHeaders(),
                    cache: 'no-store',
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            let images: ImageData[];

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('📄 content.json not found, returning default data');
                    images = getDefaultData();
                } else {
                    const errorText = await response.text();
                    console.error('❌ GitHub raw error:', response.status, errorText);

                    // Return cached content if available, even if expired
                    const cacheKey = getCacheKey();
                    const cachedContent = contentCache.get(cacheKey);
                    if (cachedContent) {
                        console.log('📦 Returning stale cache due to GitHub error');
                        return NextResponse.json({
                            success: true,
                            images: cachedContent.data
                        }, {
                            headers: { 'X-Cache': 'STALE' }
                        });
                    }

                    throw new Error(`GitHub raw API error: ${response.status}`);
                }
            } else {
                // Direct JSON parsing (no base64 decoding needed with raw URL!)
                try {
                    images = await response.json() as ImageData[];
                    console.log('✅ Images loaded from GitHub:', images.length, 'images');

                    // Validate content structure
                    if (!Array.isArray(images)) {
                        console.warn('⚠️ Content is not an array, using default data');
                        images = getDefaultData();
                    }
                } catch (parseError) {
                    console.error('❌ Error parsing JSON content:', parseError);
                    images = getDefaultData();
                }
            }

            // Store in cache
            if (!skipCache && images.length > 0) {
                const cacheKey = getCacheKey();
                contentCache.set(cacheKey, {
                    data: images,
                    timestamp: Date.now()
                });
                console.log('💾 Images cached successfully');
            }

            return NextResponse.json({
                success: true,
                images: images
            }, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'X-Cache': 'MISS'
                }
            });

        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
        }

    } catch (error) {
        console.error('❌ Error in GET /api/images:', error);

        // Try to return cached content as fallback
        const cacheKey = getCacheKey();
        const cachedContent = contentCache.get(cacheKey);

        if (cachedContent) {
            console.log('📦 Returning cached content due to error');
            return NextResponse.json({
                success: true,
                images: cachedContent.data
            }, {
                headers: { 'X-Cache': 'ERROR_FALLBACK' }
            });
        }

        // Last resort: return error
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}

export async function PUT(request: Request): Promise<NextResponse> {
    try {
        // Validate environment variables
        validateEnvVars();

        // Parse and validate request body
        let requestData: { action: string; image: Partial<ImageData> };
        try {
            requestData = await request.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        const { action, image } = requestData;

        // Validate request structure
        if (!action || !image) {
            return NextResponse.json(
                { error: 'Missing action or image in request' },
                { status: 400 }
            );
        }

        // Validate required fields
        if (!image.title || !image.description || !image.url) {
            return NextResponse.json(
                { error: 'Missing required fields: title, description, url' },
                { status: 400 }
            );
        }

        console.log('🔄 Attempting to save images to GitHub');

        // Get current file SHA and content with retry logic
        let sha: string | null = null;
        let currentImages: ImageData[] = [];
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                try {
                    // Use GitHub API for getting SHA (required for updates)
                    const getResponse = await fetch(
                        `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/contents/content.json`,
                        {
                            headers: getGitHubHeaders(),
                            cache: 'no-store',
                            signal: controller.signal
                        }
                    );

                    clearTimeout(timeoutId);

                    if (getResponse.ok) {
                        const currentFile = await getResponse.json();
                        sha = currentFile.sha;
                        const cleanedContent = currentFile.content.replace(/\s/g, '');
                        currentImages = JSON.parse(Buffer.from(cleanedContent, 'base64').toString()) as ImageData[];
                        console.log('✅ Got existing file SHA:', sha);
                        break;
                    } else if (getResponse.status === 404) {
                        console.log('📄 File does not exist, will create new file');
                        break;
                    } else {
                        throw new Error(`Failed to get file SHA: ${getResponse.status}`);
                    }
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    throw fetchError;
                }
            } catch (error) {
                retryCount++;
                console.error(`❌ Retry ${retryCount} failed:`, error);

                if (retryCount === maxRetries) {
                    throw error;
                }

                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
        }

        // Perform the requested action
        let updatedImages: ImageData[];

        if (action === 'create') {
            const newImage: ImageData = {
                id: image.id || Date.now(),
                title: image.title,
                description: image.description,
                url: image.url
            };
            updatedImages = [newImage, ...currentImages];
        } else if (action === 'update') {
            const index = currentImages.findIndex(img => img.id === image.id);
            if (index === -1) {
                return NextResponse.json({ error: 'Image not found for update' }, { status: 404 });
            }
            updatedImages = [...currentImages];
            updatedImages[index] = { ...updatedImages[index], ...image } as ImageData;
        } else if (action === 'delete') {
            updatedImages = currentImages.filter(img => img.id !== image.id);
        } else {
            return NextResponse.json({ error: 'Invalid action. Must be "create", "update", or "delete"' }, { status: 400 });
        }

        // Prepare update payload
        const updatePayload = {
            message: `${action === 'create' ? 'Add' : action === 'update' ? 'Update' : 'Delete'} image: ${image.title} - ${new Date().toISOString()}`,
            content: Buffer.from(JSON.stringify(updatedImages, null, 2)).toString('base64'),
            branch: process.env.GITHUB_BRANCH || 'main',
            ...(sha && { sha })
        };

        // Update file with retry logic (still use API endpoint for updates)
        retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                try {
                    const updateResponse = await fetch(
                        `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/contents/content.json`,
                        {
                            method: 'PUT',
                            headers: {
                                ...getGitHubHeaders(),
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(updatePayload),
                            signal: controller.signal
                        }
                    );

                    clearTimeout(timeoutId);

                    if (!updateResponse.ok) {
                        const errorData = await updateResponse.json();
                        console.error('❌ GitHub PUT error:', updateResponse.status, errorData);
                        throw new Error(`GitHub API error: ${updateResponse.status} - ${errorData.message || 'Unknown error'}`);
                    }

                    console.log('✅ Successfully saved to GitHub');
                    break;
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    throw fetchError;
                }
            } catch (error) {
                retryCount++;
                console.error(`❌ Update retry ${retryCount} failed:`, error);

                if (retryCount === maxRetries) {
                    throw error;
                }

                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
        }

        // Clear ALL cache entries to ensure fresh data
        contentCache.clear();
        console.log('🗑️ All cache cleared after updating images');

        return NextResponse.json({
            success: true,
            message: `Image ${action}d successfully`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error in PUT /api/images:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

function getDefaultData(): ImageData[] {
    return [
        {
            id: 1,
            title: "Sample Image",
            description: "Default placeholder image",
            url: "/images/placeholder.jpg"
        }
    ];
}
