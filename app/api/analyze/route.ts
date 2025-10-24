import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

interface TranscriptSegment {
  text: string;
  duration: number;
  offset: number;
}

interface ClipCandidate {
  startTime: number;
  endTime: number;
  transcript: string;
  hookScore: number;
  emotionalScore: number;
  clarityScore: number;
}

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    // Extract video ID
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Get transcript
    let transcript: TranscriptSegment[];
    try {
      transcript = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (error) {
      return NextResponse.json({
        error: 'Could not fetch transcript. Make sure the video has captions enabled.'
      }, { status: 400 });
    }

    // Analyze transcript and find viral moments
    const clips = await analyzeTranscriptForClips(transcript, videoId);

    return NextResponse.json({ clips });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
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

async function analyzeTranscriptForClips(
  transcript: TranscriptSegment[],
  videoId: string
): Promise<any[]> {
  const clips: ClipCandidate[] = [];
  const minClipDuration = 15; // seconds
  const maxClipDuration = 60; // seconds
  const windowSize = 20; // number of segments to analyze at once

  // Viral indicators
  const viralPhrases = [
    'you won\'t believe', 'shocked', 'amazing', 'incredible', 'secret',
    'truth about', 'exposed', 'revealed', 'changed my life', 'blew my mind',
    'game changer', 'nobody tells you', 'wish i knew', 'biggest mistake',
    'life hack', 'pro tip', 'controversial', 'unpopular opinion'
  ];

  const emotionalWords = [
    'love', 'hate', 'fear', 'angry', 'excited', 'surprised', 'shocked',
    'devastated', 'thrilled', 'terrified', 'furious', 'passionate'
  ];

  const questionWords = ['why', 'how', 'what', 'when', 'where', 'who'];

  // Sliding window analysis
  for (let i = 0; i < transcript.length - windowSize; i += 5) {
    const window = transcript.slice(i, i + windowSize);
    const startTime = window[0].offset / 1000;
    const endTime = window[window.length - 1].offset / 1000 + window[window.length - 1].duration / 1000;
    const duration = endTime - startTime;

    if (duration < minClipDuration || duration > maxClipDuration) continue;

    const text = window.map(s => s.text).join(' ').toLowerCase();

    // Calculate scores
    let hookScore = 0;
    let emotionalScore = 0;
    let clarityScore = 0;

    // Hook score (engaging opening)
    viralPhrases.forEach(phrase => {
      if (text.includes(phrase)) hookScore += 2;
    });
    questionWords.forEach(word => {
      if (text.split(' ').slice(0, 3).join(' ').includes(word)) hookScore += 1;
    });

    // Emotional score
    emotionalWords.forEach(word => {
      if (text.includes(word)) emotionalScore += 1;
    });

    // Clarity score (complete thoughts)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 2 && sentences.length <= 5) clarityScore += 2;
    if (text.includes('.') || text.includes('!') || text.includes('?')) clarityScore += 1;

    const totalScore = hookScore + emotionalScore + clarityScore;

    if (totalScore > 3) {
      clips.push({
        startTime,
        endTime,
        transcript: window.map(s => s.text).join(' '),
        hookScore,
        emotionalScore,
        clarityScore
      });
    }
  }

  // Sort by score and get top clips
  clips.sort((a, b) => {
    const scoreA = a.hookScore + a.emotionalScore + a.clarityScore;
    const scoreB = b.hookScore + b.emotionalScore + b.clarityScore;
    return scoreB - scoreA;
  });

  const topClips = clips.slice(0, 5);

  // Generate captions and hashtags for each clip using AI
  const enhancedClips = await Promise.all(
    topClips.map(async (clip) => {
      const { title, description, hashtags } = await generateCaptionsAndHashtags(clip.transcript);
      const viralScore = Math.min(10, Math.round((clip.hookScore + clip.emotionalScore + clip.clarityScore) * 1.2));

      return {
        title,
        description,
        hashtags,
        startTime: clip.startTime,
        endTime: clip.endTime,
        transcript: clip.transcript,
        viralScore
      };
    })
  );

  return enhancedClips;
}

async function generateCaptionsAndHashtags(transcript: string): Promise<{
  title: string;
  description: string;
  hashtags: string[];
}> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // Use OpenAI if available, otherwise use Gemini, otherwise generate locally
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: `Create a viral YouTube Shorts title, description, and hashtags for this clip:

"${transcript}"

Return ONLY a JSON object with this format:
{
  "title": "engaging title under 100 chars",
  "description": "compelling description under 500 chars",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

Make it attention-grabbing and optimized for virality.`
          }],
          temperature: 0.8,
          max_tokens: 300
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content.trim();

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('OpenAI error:', error);
    }
  }

  if (geminiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Create a viral YouTube Shorts title, description, and hashtags for this clip:

"${transcript}"

Return ONLY a JSON object with this format:
{
  "title": "engaging title under 100 chars",
  "description": "compelling description under 500 chars",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

Make it attention-grabbing and optimized for virality.`
            }]
          }]
        })
      });

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text.trim();

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Gemini error:', error);
    }
  }

  // Fallback: generate locally
  return generateLocalCaptions(transcript);
}

function generateLocalCaptions(transcript: string): {
  title: string;
  description: string;
  hashtags: string[];
} {
  const words = transcript.split(' ');
  const firstWords = words.slice(0, 8).join(' ');

  const title = firstWords.length > 80
    ? firstWords.substring(0, 77) + '...'
    : firstWords + '!';

  const description = transcript.length > 450
    ? transcript.substring(0, 447) + '...'
    : transcript;

  // Extract key words for hashtags
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  const keywords = words
    .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length > 4 && !commonWords.has(w))
    .slice(0, 3);

  const hashtags = [
    '#Shorts',
    '#Viral',
    '#Podcast',
    ...keywords.map(k => '#' + k.charAt(0).toUpperCase() + k.slice(1)),
    '#Trending'
  ].slice(0, 5);

  return { title, description, hashtags };
}
