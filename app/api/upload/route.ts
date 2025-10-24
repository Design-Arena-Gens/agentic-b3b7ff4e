import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { videoUrl, clip } = await request.json();

    if (!videoUrl || !clip) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Extract video ID
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // In a real implementation, this would:
    // 1. Use yt-dlp or similar to download the video segment
    // 2. Use FFmpeg to:
    //    - Crop/resize to 9:16 vertical format
    //    - Burn in subtitles with styling
    //    - Optimize for mobile viewing
    // 3. Use YouTube Data API v3 to upload with OAuth2
    //
    // For this demo, we'll simulate the process and return instructions

    const uploadInstructions = {
      status: 'ready',
      videoId,
      clip,
      steps: [
        '1. Download video segment using yt-dlp',
        '2. Generate subtitle file (SRT) from transcript',
        '3. Process video with FFmpeg to add subtitles and format for Shorts',
        '4. Authenticate with YouTube OAuth2',
        '5. Upload using YouTube Data API v3'
      ],
      commands: {
        download: `yt-dlp -f "best[height<=1080]" --download-sections "*${clip.startTime}-${clip.endTime}" -o "clip_${Date.now()}.mp4" "https://www.youtube.com/watch?v=${videoId}"`,
        process: `ffmpeg -i input.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920,subtitles=subtitles.srt:force_style='Alignment=2,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2'" -c:v libx264 -preset fast -crf 23 -c:a aac output.mp4`,
        subtitleStyle: 'Bold, white text with black outline, bottom-centered'
      },
      youtubeMetadata: {
        title: clip.title,
        description: `${clip.description}\n\n${clip.hashtags.join(' ')}\n\nFull video: https://www.youtube.com/watch?v=${videoId}`,
        tags: clip.hashtags.map((h: string) => h.replace('#', '')),
        categoryId: '22', // People & Blogs
        privacyStatus: 'public'
      }
    };

    // Check if YouTube credentials are configured
    const hasYouTubeAuth = !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET
    );

    if (!hasYouTubeAuth) {
      return NextResponse.json({
        ...uploadInstructions,
        message: 'YouTube API credentials not configured. Set up OAuth2 credentials to enable automatic uploads.',
        setupGuide: 'https://developers.google.com/youtube/v3/getting-started'
      });
    }

    // In production, you would:
    // 1. Download the video segment
    // 2. Generate SRT subtitle file
    // 3. Process with FFmpeg
    // 4. Upload via YouTube Data API
    // 5. Return the uploaded video URL

    return NextResponse.json({
      success: true,
      message: 'Upload simulation complete',
      ...uploadInstructions,
      note: 'This is a demonstration. Full implementation requires server-side video processing (yt-dlp, FFmpeg) and YouTube Data API OAuth2 authentication.'
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
