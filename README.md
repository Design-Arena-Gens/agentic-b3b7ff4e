# 🎬 YouTube Shorts Clipper

Automatically extract viral-worthy short clips from podcast videos and upload them to YouTube with AI-generated captions, hashtags, and burned-in subtitles.

## ✨ Features

- **🤖 AI-Powered Analysis**: Automatically identifies engaging moments with high viral potential
- **📝 Smart Captions**: Generates compelling titles, descriptions, and trending hashtags
- **🎯 Viral Scoring**: Ranks clips by engagement potential (hooks, emotions, clarity)
- **📱 Shorts-Ready**: Optimized for YouTube Shorts format (9:16, <60s)
- **🎥 Auto-Subtitles**: Burns subtitles directly into the video
- **☁️ One-Click Upload**: Automatically uploads to YouTube with metadata

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Required for AI captions:
- `OPENAI_API_KEY` - OpenAI API key (recommended)
- OR `GEMINI_API_KEY` - Google Gemini API key (alternative)

Optional for YouTube upload:
- `GOOGLE_CLIENT_ID` - Google OAuth2 Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth2 Client Secret
- `YOUTUBE_API_KEY` - YouTube Data API key

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📖 How It Works

1. **Paste YouTube URL**: Enter any podcast or long-form video URL
2. **AI Analysis**: Extracts transcript and identifies viral moments using:
   - Hook detection (attention-grabbing openings)
   - Emotional resonance (engaging content)
   - Clarity scoring (complete thoughts)
3. **Review Clips**: See ranked clips with titles, descriptions, and hashtags
4. **Upload**: One-click upload to YouTube (or download instructions)

## 🛠️ Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **OpenAI API** - Caption generation
- **youtube-transcript** - Transcript extraction
- **YouTube Data API v3** - Video upload

## 🎥 Video Processing (Full Implementation)

For complete functionality, implement these server-side tools:

### Download Video Segment
```bash
yt-dlp -f "best[height<=1080]" --download-sections "*START-END" -o "clip.mp4" "VIDEO_URL"
```

### Add Subtitles with FFmpeg
```bash
ffmpeg -i input.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920,subtitles=subtitles.srt:force_style='Alignment=2,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2'" -c:v libx264 -preset fast -crf 23 -c:a aac output.mp4
```

## 🔐 YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback`
6. Copy Client ID and Client Secret to `.env`

## 📊 Viral Detection Algorithm

The system analyzes transcript segments for:

- **Hook Phrases**: "you won't believe", "secret", "revealed", etc.
- **Questions**: Opens with why/how/what
- **Emotional Words**: Strong sentiment indicators
- **Clarity**: Complete thoughts and sentence structure
- **Duration**: Optimal 15-60 second clips

## 🌐 Deployment

### Deploy to Vercel

```bash
npm run build
vercel deploy --prod
```

Add environment variables in Vercel dashboard.

## 📝 License

MIT

## 🤝 Contributing

Pull requests welcome! For major changes, please open an issue first.

## ⚠️ Legal Notice

This tool is for educational purposes. Always respect copyright laws and YouTube's Terms of Service. Only process videos you own or have permission to use.
