import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ImageData {
    id: string;
    title: string;
    description: string;
    cloudinaryUrl: string;
    publicId: string;
    tags: string[];
    uploadedAt: string;
    uploadedBy: string;
    dimensions?: {
        width: number;
        height: number;
    };
    fileSize?: string;
    isVisible: boolean;
    featured: boolean;
}

interface CategoryData {
    category: string;
    lastUpdated: string;
    totalImages: number;
    images: ImageData[];
}

function validateEnvVars(): void {
    const required = ['GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_TOKEN'];
    const missing = required.filter(env => !process.env[env]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

function getGitHubHeaders(): Record<string, string> {
    return {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'NextJS-Gallery-CMS',
        'X-GitHub-Api-Version': '2022-11-28'
    };
}

// GET - Fetch portrait images
export async function GET(): Promise<NextResponse> {
    try {
        validateEnvVars();

        const response = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/portrait.json`,
            {
                headers: getGitHubHeaders(),
                cache: 'no-store'
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                const emptyData: CategoryData = {
                    category: 'portrait',
                    lastUpdated: new Date().toISOString(),
                    totalImages: 0,
                    images: []
                };
                return NextResponse.json({
                    success: true,
                    data: emptyData
                });
            }
            throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
        }

        const file = await response.json();
        const contentJson: CategoryData = JSON.parse(Buffer.from(file.content, 'base64').toString());

        const portraitData: CategoryData = {
            category: 'portrait',
            lastUpdated: contentJson.lastUpdated || new Date().toISOString(),
            totalImages: contentJson.images?.length || 0,
            images: contentJson.images || []
        };

        return NextResponse.json({
            success: true,
            data: portraitData
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        console.error('Portrait API error:', error);

        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}

// POST - Add new portrait image
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        validateEnvVars();

        let requestData: { imageData: Partial<ImageData> };
        try {
            requestData = await request.json();
        } catch {
            return NextResponse.json({
                success: false,
                error: 'Invalid JSON in request body'
            }, { status: 400 });
        }

        const { imageData } = requestData;

        if (!imageData || !imageData.title || !imageData.cloudinaryUrl || !imageData.publicId) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: title, cloudinaryUrl, publicId'
            }, { status: 400 });
        }

        let currentData: CategoryData;
        let sha: string | undefined;

        const getResponse = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/portrait.json`,
            {
                headers: getGitHubHeaders(),
                cache: 'no-store'
            }
        );

        if (getResponse.ok) {
            const currentFile = await getResponse.json();
            sha = currentFile.sha;
            currentData = JSON.parse(Buffer.from(currentFile.content, 'base64').toString());
        } else if (getResponse.status === 404) {
            currentData = {
                category: 'portrait',
                lastUpdated: new Date().toISOString(),
                totalImages: 0,
                images: []
            };
        } else {
            throw new Error(`Failed to get current portraits: ${getResponse.status}`);
        }

        const newImage: ImageData = {
            id: `portrait_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: imageData.title,
            description: imageData.description || '',
            cloudinaryUrl: imageData.cloudinaryUrl,
            publicId: imageData.publicId,
            tags: imageData.tags || [],
            uploadedAt: new Date().toISOString(),
            uploadedBy: 'admin',
            dimensions: imageData.dimensions,
            fileSize: imageData.fileSize,
            isVisible: imageData.isVisible !== false,
            featured: imageData.featured || false
        };

        const updatedData: CategoryData = {
            ...currentData,
            lastUpdated: new Date().toISOString(),
            images: [newImage, ...currentData.images],
            totalImages: currentData.images.length + 1
        };

        const updatePayload: any = {
            message: `Add new portrait: ${newImage.title} - ${new Date().toISOString()}`,
            content: Buffer.from(JSON.stringify(updatedData, null, 2)).toString('base64'),
            branch: process.env.GITHUB_BRANCH || 'main'
        };

        if (sha) updatePayload.sha = sha;

        const updateResponse = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/portrait.json`,
            {
                method: 'PUT',
                headers: {
                    ...getGitHubHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatePayload)
            }
        );

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`GitHub update error: ${updateResponse.status} - ${errorData.message}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Portrait added successfully',
            image: newImage
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        console.error('Portrait POST error:', error);

        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}

// PUT - Update portrait
export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        validateEnvVars();

        let requestData: { imageData: Partial<ImageData> & { id: string } };
        try {
            requestData = await request.json();
        } catch {
            return NextResponse.json({
                success: false,
                error: 'Invalid JSON in request body'
            }, { status: 400 });
        }

        const { imageData } = requestData;

        if (!imageData || !imageData.id) {
            return NextResponse.json({
                success: false,
                error: 'Missing imageData or id in request'
            }, { status: 400 });
        }

        const getResponse = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/portrait.json`,
            {
                headers: getGitHubHeaders(),
                cache: 'no-store'
            }
        );

        if (!getResponse.ok) {
            throw new Error(`Failed to get current portraits: ${getResponse.status}`);
        }

        const currentFile = await getResponse.json();
        const { sha } = currentFile;
        const currentData: CategoryData = JSON.parse(Buffer.from(currentFile.content, 'base64').toString());

        const imageIndex = currentData.images.findIndex(img => img.id === imageData.id);

        if (imageIndex === -1) {
            return NextResponse.json({
                success: false,
                error: 'Portrait not found'
            }, { status: 404 });
        }

        currentData.images[imageIndex] = {
            ...currentData.images[imageIndex],
            ...imageData,
            id: imageData.id,
            uploadedAt: currentData.images[imageIndex].uploadedAt,
        };

        currentData.lastUpdated = new Date().toISOString();

        const updateResponse = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/portrait.json`,
            {
                method: 'PUT',
                headers: {
                    ...getGitHubHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update portrait: ${currentData.images[imageIndex].title} - ${new Date().toISOString()}`,
                    content: Buffer.from(JSON.stringify(currentData, null, 2)).toString('base64'),
                    sha: sha,
                    branch: process.env.GITHUB_BRANCH || 'main'
                })
            }
        );

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`GitHub update error: ${updateResponse.status} - ${errorData.message}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Portrait updated successfully',
            image: currentData.images[imageIndex]
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        console.error('Portrait PUT error:', error);

        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}

// DELETE - Delete portrait
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        validateEnvVars();

        const { searchParams } = new URL(request.url);
        const imageId = searchParams.get('id');

        if (!imageId) {
            return NextResponse.json({
                success: false,
                error: 'Missing image ID'
            }, { status: 400 });
        }

        const getResponse = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/portrait.json`,
            {
                headers: getGitHubHeaders(),
                cache: 'no-store'
            }
        );

        if (!getResponse.ok) {
            throw new Error(`Failed to get current portraits: ${getResponse.status}`);
        }

        const currentFile = await getResponse.json();
        const { sha } = currentFile;
        const currentData: CategoryData = JSON.parse(Buffer.from(currentFile.content, 'base64').toString());

        const imageIndex = currentData.images.findIndex(img => img.id === imageId);

        if (imageIndex === -1) {
            return NextResponse.json({
                success: false,
                error: 'Portrait not found'
            }, { status: 404 });
        }

        const deletedImage = currentData.images[imageIndex];
        currentData.images.splice(imageIndex, 1);
        currentData.totalImages = currentData.images.length;
        currentData.lastUpdated = new Date().toISOString();

        const updateResponse = await fetch(
            `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/portrait.json`,
            {
                method: 'PUT',
                headers: {
                    ...getGitHubHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Delete portrait: ${deletedImage.title} - ${new Date().toISOString()}`,
                    content: Buffer.from(JSON.stringify(currentData, null, 2)).toString('base64'),
                    sha: sha,
                    branch: process.env.GITHUB_BRANCH || 'main'
                })
            }
        );

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`GitHub update error: ${updateResponse.status} - ${errorData.message}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Portrait deleted successfully'
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        console.error('Portrait DELETE error:', error);

        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}
