'use client';

import { useState } from 'react';

interface ClipResult {
  title: string;
  description: string;
  hashtags: string[];
  startTime: number;
  endTime: number;
  transcript: string;
  viralScore: number;
}

export default function Home() {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [clips, setClips] = useState<ClipResult[]>([]);
  const [error, setError] = useState('');
  const [uploadStatus, setUploadStatus] = useState<{[key: number]: string}>({});

  const analyzeVideo = async () => {
    if (!videoUrl) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setAnalyzing(true);
    setError('');
    setClips([]);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze video');
      }

      setClips(data.clips);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const uploadClip = async (clip: ClipResult, index: number) => {
    setUploadStatus(prev => ({ ...prev, [index]: 'processing' }));

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          clip,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadStatus(prev => ({ ...prev, [index]: 'success' }));
    } catch (err: any) {
      setUploadStatus(prev => ({ ...prev, [index]: `error: ${err.message}` }));
    }
  };

  const uploadAllClips = async () => {
    for (let i = 0; i < clips.length; i++) {
      await uploadClip(clips[i], i);
      // Wait 2 seconds between uploads to avoid rate limiting
      if (i < clips.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎬 YouTube Shorts Clipper
          </h1>
          <p className="text-gray-600 mb-6">
            Turn podcast videos into viral shorts with AI-powered analysis, captions, and auto-upload
          </p>

          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Enter YouTube video URL..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-gray-800"
              disabled={loading}
            />
            <button
              onClick={analyzeVideo}
              disabled={loading}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Analyzing...' : 'Find Clips'}
            </button>
          </div>

          {analyzing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div>
                  <p className="font-semibold text-blue-900">Analyzing video...</p>
                  <p className="text-sm text-blue-700">
                    Extracting transcript, identifying viral moments, and generating captions
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">❌ {error}</p>
            </div>
          )}

          {clips.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Found {clips.length} Viral Clips
                </h2>
                <button
                  onClick={uploadAllClips}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Upload All to YouTube
                </button>
              </div>
            </div>
          )}
        </div>

        {clips.map((clip, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{clip.title}</h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                    Viral Score: {clip.viralScore}/10
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{clip.description}</p>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {clip.hashtags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  ⏱️ {Math.floor(clip.startTime)}s - {Math.floor(clip.endTime)}s
                  ({Math.floor(clip.endTime - clip.startTime)}s duration)
                </p>
              </div>

              <button
                onClick={() => uploadClip(clip, index)}
                disabled={uploadStatus[index] === 'processing' || uploadStatus[index] === 'success'}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ml-4"
              >
                {uploadStatus[index] === 'processing' ? '⏳ Uploading...' :
                 uploadStatus[index] === 'success' ? '✅ Uploaded' :
                 uploadStatus[index]?.startsWith('error') ? '❌ Failed' :
                 '📤 Upload'}
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Transcript:</p>
              <p className="text-sm text-gray-600 italic">&quot;{clip.transcript}&quot;</p>
            </div>

            {uploadStatus[index]?.startsWith('error') && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{uploadStatus[index]}</p>
              </div>
            )}
          </div>
        ))}

        {clips.length === 0 && !loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">🎥</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to Create Viral Shorts</h3>
            <p className="text-gray-600 mb-6">
              Paste a YouTube podcast URL above to automatically:
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-3xl mb-2">🤖</div>
                <h4 className="font-bold text-gray-800 mb-1">AI Analysis</h4>
                <p className="text-sm text-gray-600">
                  Identify the most engaging and viral-worthy moments
                </p>
              </div>
              <div className="bg-pink-50 rounded-lg p-4">
                <div className="text-3xl mb-2">✨</div>
                <h4 className="font-bold text-gray-800 mb-1">Auto Captions</h4>
                <p className="text-sm text-gray-600">
                  Generate titles, descriptions, and trending hashtags
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-3xl mb-2">📱</div>
                <h4 className="font-bold text-gray-800 mb-1">Smart Upload</h4>
                <p className="text-sm text-gray-600">
                  Upload directly to YouTube with burned-in subtitles
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
