import { NextRequest, NextResponse } from 'next/server';
import { getUrl } from 'aws-amplify/storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Get the signed URL from S3
    const result = await getUrl({
      path,
      options: {
        expiresIn: 3600, // 1 hour
      },
    });

    // Fetch the image from S3
    const imageResponse = await fetch(result.url.toString());
    
    if (!imageResponse.okesult.url.toString();

    // Fetch the image from S3
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.error(`Failed to fetch image from S3: ${imageResponse.status} ${imageResponse.statusText}`);
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/webp';

    // Return the image with proper headers for caching
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400', // Browser: 1h, CDN: 24h
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to load image' }, 
      { status: 500 }
    );
  }
}