# Twitter to Newsletter

Turn your tweets into genuinely useful newsletters. Pull your recent tweets, pick the highlights, and let AI compose a polished monthly roundup — ready to send in minutes, not hours.

## Features

- **Fetch & Filter** — Pull tweets from any date range and cherry-pick the ones worth sharing.
- **AI-Powered Drafts** — One click generates a structured newsletter that aggregates your content intelligently, powered by Claude.
- **Edit & Export** — Fine-tune in the live markdown editor with side-by-side preview, then download the Markdown.
- **Engagement-Aware** — AI puts your most successful content first so readers see what resonated.
- **Custom Templates** — Save a per-account newsletter template so every roundup matches your style.
- **Prompt Injection Guardrails** — Tweet text is sanitized and the system prompt is hardened against adversarial content.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router) with TypeScript
- **AI**: [Claude](https://www.anthropic.com/) via the Anthropic SDK (`claude-sonnet-4-20250514`)
- **Authentication**: Twitter OAuth 2.0 with PKCE via [twitter-api-v2](https://www.npmjs.com/package/twitter-api-v2)
- **Sessions**: [iron-session](https://www.npmjs.com/package/iron-session) (encrypted cookie-based, no database required)
- **Template Storage**: [Upstash Redis](https://upstash.com/) for per-account newsletter templates
- **Markdown Rendering**: [marked](https://www.npmjs.com/package/marked) (client-side markdown to HTML)
- **Evals**: [Arize Phoenix](https://phoenix.arize.com/) for experiment tracking and LLM evaluation
- **Styling**: Plain CSS

## Project Structure

```
app/
  layout.tsx                          Root layout
  page.tsx                            Main page (renders AppShell)
  globals.css                         All styles
  api/
    auth/
      twitter/route.ts                GET  — Initiate OAuth PKCE flow
      callback/route.ts               GET  — Handle OAuth callback
      status/route.ts                 GET  — Check auth status
      logout/route.ts                 POST — Destroy session
    tweets/route.ts                   GET  — Fetch tweets by date range
    newsletter/
      preview/route.ts                POST — Generate newsletter via Claude
    template/route.ts                 GET/PUT — Read/write per-account template
  components/
    AppShell.tsx                      Client component orchestrating all state
    LoginButton.tsx                   Landing page with feature grid + CTA
    AuthStatus.tsx                    Logged-in header with username + logout
    TweetFetcher.tsx                  Date range picker form
    TweetList.tsx                     Scrollable tweet list with select all/none
    TweetCard.tsx                     Single tweet display with checkbox
    MarkdownEditor.tsx                Side-by-side markdown editor with live preview
lib/
  session.ts                          iron-session config and helpers
  twitter.ts                          Twitter OAuth + tweet fetching wrapper
  newsletter.ts                       Claude-powered newsletter composer + guardrails
  template.ts                         Per-account template storage (Upstash Redis)
types/
  index.ts                            Tweet, SessionData, AuthStatusResponse interfaces
evals/
  newsletter-eval.ts                  Phoenix experiment: coverage + faithfulness evals
  fetch-tweets.ts                     Utility to snapshot tweets for eval fixtures
  fixtures/arizeai-tweets.json        Fixture data for offline eval runs
```

## Setup

### Prerequisites

- Node.js 18+
- A [Twitter Developer](https://developer.twitter.com/) account with an app that has OAuth 2.0 enabled
- Twitter API **Basic** tier or higher (the free tier does not support reading tweets)
- An [Anthropic API key](https://console.anthropic.com/) for newsletter generation

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables in `.env.local`:

```
TWITTER_OAUTH2_ID=your_oauth2_client_id
TWITTER_OAUTH2_SECRET=your_oauth2_client_secret
TWITTER_CALLBACK_URL=http://localhost:3000/api/auth/callback
SESSION_SECRET=a-random-string-at-least-32-characters-long
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Optional (for per-account template persistence):

```
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_redis_token
```

### 3. Set the callback URL in Twitter

In your Twitter Developer Portal, set the OAuth 2.0 callback URL to:

```
http://localhost:3000/api/auth/callback
```

### 4. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## How It Works

1. **Login** — Click "Connect with Twitter" to authenticate via OAuth 2.0 PKCE.
2. **Fetch Tweets** — Pick a date range and fetch your tweets. Full-length tweet text is retrieved (including extended tweets via the `note_tweet` field).
3. **Select Tweets** — Use checkboxes to pick which tweets to include. Select all / deselect all buttons are provided.
4. **Compose** — Click "Compose Newsletter" to send the selected tweets to Claude, which generates a themed, engagement-aware newsletter in Markdown.
5. **Edit & Preview** — The markdown editor opens with a side-by-side view: editable markdown on the left, live HTML preview on the right.
6. **Download** — Click "Download Markdown" to save the newsletter as a `.md` file.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/twitter` | Redirects to Twitter OAuth authorization page |
| GET | `/api/auth/callback` | Exchanges auth code for token, stores session, redirects to `/` |
| GET | `/api/auth/status` | Returns `{ authenticated: boolean, username?: string }` |
| POST | `/api/auth/logout` | Destroys the session |
| GET | `/api/tweets?start_date&end_date&max_results` | Fetches authenticated user's tweets |
| POST | `/api/newsletter/preview` | Sends selected tweets to Claude, returns `{ markdown }` |
| GET | `/api/template` | Returns the saved template for the authenticated user |
| PUT | `/api/template` | Saves a custom template for the authenticated user |

## Architecture Notes

- **Sessions** are stored entirely in encrypted cookies (iron-session). No database is needed. The cookie uses `sameSite: 'lax'` to survive the OAuth redirect flow.
- **Newsletter generation** uses Claude (Sonnet) to synthesize tweets into a themed newsletter. The system prompt includes a customizable template, formatting guidelines, and security guardrails against prompt injection.
- **Prompt injection guardrails**: Tweet text is sanitized (triple backticks collapsed, role markers disrupted), wrapped in XML delimiters, and the system prompt explicitly instructs the model to ignore embedded instructions and restrict URLs to structured metadata fields only.
- **Per-account templates** are stored in Upstash Redis keyed by Twitter handle. Falls back to a default template if Redis is not configured.
- **Markdown preview** uses the `marked` library on the client side to render the markdown as HTML in real time as you edit.
- **Extended tweets** are fetched using the Twitter API v2 `note_tweet` field, so tweets longer than 280 characters are returned in full.
- **All client state** lives in the `AppShell` component: fetched tweets, selected tweet IDs, editor markdown. No state management library is used.
- **Two-phase UI**: The app has two views — tweet selection (fetch, browse, select tweets) and the markdown editor (edit, preview, download). Clicking "Back to tweets" returns to the selection view.
- **Tweet fetching** returns up to 100 tweets per request (Twitter API v2 limit). The response includes pagination metadata for future "load more" support.

## Evals

The `evals/` directory contains a Phoenix-based evaluation suite:

- **Tweet coverage** — LLM judge that checks whether each source tweet is represented in the generated newsletter.
- **Faithfulness & quality** — LLM judge that checks for hallucinated facts/URLs and overall writing quality.
- **Link accuracy** — Rule-based check that every URL in the newsletter traces back to the source tweet data.
- **Structure adherence** — Rule-based check for expected Markdown sections (headings, links section, etc.).

Run evals with:

```bash
npx tsx evals/newsletter-eval.ts
```

## Future Enhancements

- Pagination / "load more" for large date ranges
- Refresh token handling for longer sessions
- Email integration for direct sending
- Support for tweet threads and media attachments
- Additional export formats (HTML, PDF)
