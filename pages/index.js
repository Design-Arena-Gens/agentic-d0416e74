import { useState } from 'react'
import Head from 'next/head'

export default function Home() {
  const [copied, setCopied] = useState(false)
  const [ffmpegUrl, setFfmpegUrl] = useState('http://your-ffmpeg-server:port')
  const [n8nUrl, setN8nUrl] = useState('http://your-n8n-server:5678')

  const generatePrompt = () => {
    return `You are an expert n8n workflow architect. Create a COMPLETE, PRODUCTION-READY n8n workflow (in JSON format) for automated YouTube video generation that meets these EXACT specifications:

## CRITICAL REQUIREMENTS:
- The workflow MUST be 100% FREE - only use free APIs and tools (no paid services)
- Docker-hosted n8n environment
- FFmpeg server available at: ${ffmpegUrl}
- n8n instance at: ${n8nUrl}
- Videos MUST be 20+ minutes in length
- MUST include automated YouTube upload with full metadata

## WORKFLOW INPUT:
- Single input parameter: "topic" (text string)

## WORKFLOW STEPS (Implement ALL of these):

### 1. SCRIPT GENERATION NODE
- Use FREE LLM API (choose ONE):
  * Hugging Face Inference API (free tier) - Recommended models: mistralai/Mistral-7B-Instruct-v0.2 or meta-llama/Llama-2-7b-chat-hf
  * Google Gemini API (free tier) - 60 requests/minute free
  * Groq API (free tier) - Very fast, free tier available
- Prompt structure: "Create a detailed 20-25 minute video script about {{topic}}. Include: introduction (2 min), main content with 5-7 key sections (15-20 min), and conclusion (2-3 min). Write the full narration text, making it engaging and informative. Format as plain text paragraphs suitable for text-to-speech."
- Output: Full script text (3000-4000 words for 20+ minutes)
- Store script in workflow variable: {{ $json.script }}

### 2. TEXT-TO-SPEECH NODE (Audio Generation)
- Use FREE TTS service (choose ONE):
  * ElevenLabs Free Tier (10,000 characters/month)
  * Google Cloud TTS Free Tier (0-4 million characters free per month)
  * OpenAI TTS Free Trial
  * Coqui TTS (self-hosted, fully free)
- If script exceeds API limits, split into chunks and concatenate
- Voice settings: Natural, medium pace, clear pronunciation
- Output format: MP3 or WAV
- Store audio file path: {{ $json.audioPath }}

### 3. BACKGROUND MUSIC NODE
- Source FREE royalty-free music (choose ONE method):
  * Use Free Music Archive API (https://freemusicarchive.org/api) - No API key needed for basic access
  * Use YouTube Audio Library via yt-dlp (free, legal)
  * Use Incompetech API (free, royalty-free: https://incompetech.com/music/royalty-free/music.html)
  * Use Pixabay Music API (free, no attribution: https://pixabay.com/api/docs/)
- Search criteria: Instrumental, 20+ minutes OR loop shorter tracks
- Download background track
- Store music file path: {{ $json.musicPath }}

### 4. IMAGE/VIDEO BACKGROUND GENERATION NODE
- Use FREE stock media APIs (choose ONE):
  * Pexels API (free, 200 requests/hour) - https://www.pexels.com/api/
  * Pixabay API (free) - https://pixabay.com/api/docs/
  * Unsplash API (free, 50 requests/hour) - https://unsplash.com/developers
- Search for 10-15 relevant images based on topic keywords
- Download images (1920x1080 resolution minimum)
- Store image paths array: {{ $json.imagePaths }}

### 5. FFMPEG VIDEO COMPOSITION NODE (HTTP Request to FFmpeg Server)
- Make HTTP POST request to: ${ffmpegUrl}/render
- Request body should include:
  * audioPath: {{ $json.audioPath }}
  * musicPath: {{ $json.musicPath }}
  * imagePaths: {{ $json.imagePaths }}
  * duration: {{ $json.audioDuration }}

- FFmpeg command structure (for reference):
\`\`\`bash
ffmpeg -loop 1 -t 5 -i image1.jpg -loop 1 -t 5 -i image2.jpg ... \\
  -i narration.mp3 -i background_music.mp3 \\
  -filter_complex "[0:v]scale=1920:1080,fade=t=in:st=0:d=1,fade=t=out:st=4:d=1[v0]; \\
    [1:v]scale=1920:1080,fade=t=in:st=0:d=1,fade=t=out:st=4:d=1[v1]; \\
    [v0][v1]concat=n=15:v=1:a=0[v]; \\
    [3:a]volume=0.3[music]; \\
    [2:a][music]amix=inputs=2:duration=longest[a]" \\
  -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 192k \\
  -movflags +faststart output.mp4
\`\`\`

- Each image displays for: (total duration / number of images) seconds
- Audio mixing: Narration at 100% volume, music at 30% volume
- Video settings: 1920x1080, 30fps, H.264 codec, AAC audio
- Add fade transitions between images (1 second each)
- Output: video.mp4
- Store video file path: {{ $json.videoPath }}

### 6. VIDEO METADATA GENERATION NODE
- Use same LLM from Step 1
- Generate:
  * Title (60 chars max): Engaging, SEO-optimized
  * Description (5000 chars max): Detailed, keyword-rich, with timestamps
  * Tags (15-20 tags): Relevant keywords
  * Thumbnail ideas: Description for manual creation or auto-generation
- Prompt: "Based on this video script about {{topic}}, generate: 1) A catchy YouTube title (under 60 characters), 2) A detailed description with timestamps (300-500 words), 3) 20 relevant tags for SEO"
- Store: {{ $json.title }}, {{ $json.description }}, {{ $json.tags }}

### 7. THUMBNAIL GENERATION NODE (Optional but Recommended)
- Use FREE design APIs:
  * Canva API (limited free tier) OR
  * Pillow/PIL via Python node (fully free) OR
  * Cloudinary free tier (transformations)
- Create 1280x720 thumbnail using:
  * First image from video
  * Add text overlay with title
  * High contrast, readable font
- Store: {{ $json.thumbnailPath }}

### 8. YOUTUBE UPLOAD NODE
- Use YouTube Data API v3 (FREE - 10,000 quota units/day)
- Authentication: OAuth 2.0 (provide setup instructions)
- API endpoint: POST https://www.googleapis.com/upload/youtube/v3/videos
- Upload parameters:
  * file: {{ $json.videoPath }}
  * title: {{ $json.title }}
  * description: {{ $json.description }}
  * tags: {{ $json.tags }}
  * categoryId: "22" (People & Blogs) or "27" (Education)
  * privacyStatus: "public" (or "private"/"unlisted")
  * thumbnail: {{ $json.thumbnailPath }} (separate API call after upload)
- Handle upload in chunks (resumable upload for 20+ min videos)
- Store video ID: {{ $json.youtubeVideoId }}

### 9. ERROR HANDLING & NOTIFICATIONS
- Add error handling nodes after EACH step
- If any step fails:
  * Log error details
  * Send notification (choose FREE option):
    - Email via SMTP (Gmail SMTP free)
    - Discord webhook (free)
    - Telegram bot (free)
  * Stop workflow
- Success notification: Include YouTube video URL

### 10. WORKFLOW VARIABLES & DATA FLOW
- Use n8n's workflow variables to pass data between nodes
- Set up proper node connections (no orphaned nodes)
- Add "Set" nodes to store intermediate results
- Use expressions: {{ $json.fieldName }} for data access

## OUTPUT FORMAT:
Provide the complete n8n workflow as:
1. JSON workflow file (ready to import into n8n)
2. Step-by-step setup instructions including:
   - Required API keys (all FREE tier)
   - Environment variables needed
   - FFmpeg server setup command (Docker)
   - YouTube OAuth 2.0 setup guide
   - How to import workflow into n8n
   - Testing procedure

## CONFIGURATION FLEXIBILITY:
The workflow MUST be easily modifiable. Include clear comments/notes in the JSON showing:
- Where to change API endpoints
- Where to modify video duration logic
- Where to customize prompts
- Where to adjust video quality settings
- How to swap between different free API providers

## ADDITIONAL REQUIREMENTS:
- Workflow should complete in 15-30 minutes for a 20-minute video
- Must handle failures gracefully (retry logic)
- Must validate video output before upload (check duration, file size)
- Must clean up temporary files after upload
- Include a "test mode" variable that skips YouTube upload

## FREE API KEYS SETUP GUIDE:
Include links and instructions for:
1. Hugging Face API token: https://huggingface.co/settings/tokens
2. Pexels API key: https://www.pexels.com/api/
3. Pixabay API key: https://pixabay.com/api/docs/
4. YouTube Data API: https://console.cloud.google.com/
5. Free Music Archive: No key needed
6. Gemini API: https://makersuite.google.com/app/apikey

## DELIVERABLES:
1. Complete n8n workflow JSON (ready to import)
2. FFmpeg Docker command for setup
3. Environment variables template (.env file)
4. Setup guide (markdown format)
5. Troubleshooting section
6. Example API responses for testing

START YOUR RESPONSE WITH THE COMPLETE N8N WORKFLOW JSON. Make it production-ready, thoroughly tested logic, and 100% implementable immediately.`
  }

  const copyToClipboard = async () => {
    const prompt = generatePrompt()
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      alert('Failed to copy to clipboard')
    }
  }

  const downloadPrompt = () => {
    const prompt = generatePrompt()
    const blob = new Blob([prompt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'n8n-video-workflow-prompt.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <Head>
        <title>n8n Video Workflow Prompt Generator</title>
        <meta name="description" content="Generate AI prompt for n8n video automation workflow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">
          n8n Video Workflow Prompt Generator
        </h1>

        <p className="description">
          Generate a comprehensive prompt for AI models to create your complete n8n workflow
        </p>

        <div className="card-config">
          <h2>Configuration</h2>
          <div className="form-group">
            <label htmlFor="ffmpeg">FFmpeg Server URL:</label>
            <input
              id="ffmpeg"
              type="text"
              value={ffmpegUrl}
              onChange={(e) => setFfmpegUrl(e.target.value)}
              placeholder="http://your-ffmpeg-server:port"
            />
          </div>
          <div className="form-group">
            <label htmlFor="n8n">n8n Server URL:</label>
            <input
              id="n8n"
              type="text"
              value={n8nUrl}
              onChange={(e) => setN8nUrl(e.target.value)}
              placeholder="http://your-n8n-server:5678"
            />
          </div>
        </div>

        <div className="features">
          <div className="feature-card">
            <h3>✅ Free Tools Only</h3>
            <p>Uses only free APIs and open-source tools</p>
          </div>
          <div className="feature-card">
            <h3>🎬 20+ Minute Videos</h3>
            <p>Generates complete long-form video content</p>
          </div>
          <div className="feature-card">
            <h3>🚀 Auto YouTube Upload</h3>
            <p>Uploads with full metadata automatically</p>
          </div>
          <div className="feature-card">
            <h3>🎵 Background Music</h3>
            <p>Royalty-free music integration</p>
          </div>
          <div className="feature-card">
            <h3>🔧 Fully Customizable</h3>
            <p>Easy to modify and adapt workflow</p>
          </div>
          <div className="feature-card">
            <h3>🐳 Docker Ready</h3>
            <p>Works with Docker-hosted n8n and FFmpeg</p>
          </div>
        </div>

        <div className="button-group">
          <button onClick={copyToClipboard} className="btn btn-primary">
            {copied ? '✓ Copied!' : '📋 Copy Prompt to Clipboard'}
          </button>
          <button onClick={downloadPrompt} className="btn btn-secondary">
            💾 Download Prompt as Text File
          </button>
        </div>

        <div className="info-section">
          <h2>What This Prompt Does:</h2>
          <ul>
            <li>Generates a complete n8n workflow JSON ready to import</li>
            <li>Includes all setup instructions and API keys (free tier)</li>
            <li>Creates 20+ minute videos from a single topic input</li>
            <li>Handles script generation, TTS, background music, video composition, and YouTube upload</li>
            <li>Provides error handling and notifications</li>
            <li>100% free tools and APIs - no paid services required</li>
            <li>Includes modification guidelines for easy customization</li>
          </ul>

          <h2>How to Use:</h2>
          <ol>
            <li>Configure your FFmpeg and n8n server URLs above</li>
            <li>Click "Copy Prompt to Clipboard"</li>
            <li>Paste into any AI model (ChatGPT, Claude, Gemini, Llama, etc.)</li>
            <li>The AI will generate your complete n8n workflow JSON</li>
            <li>Import the JSON into your n8n instance</li>
            <li>Follow the setup instructions provided by the AI</li>
            <li>Start generating videos automatically!</li>
          </ol>

          <h2>Supported AI Models:</h2>
          <p>This prompt works with: ChatGPT, Claude, Google Gemini, Llama, Mistral, and any other instruction-following LLM</p>
        </div>
      </main>
    </div>
  )
}
