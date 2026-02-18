# Twitter to Newsletter

A web application that allows users to authorize with Twitter, fetch their own tweets within a specified date range, select tweets, and compose a monthly content roundup newsletter with a live markdown editor.

## Features

1. **Twitter OAuth Authentication** -- OAuth 2.0 with PKCE, session stored in encrypted cookies via iron-session.
2. **Tweet Retrieval** -- Fetch your tweets (including full-length extended tweets) within a date range, displayed with timestamps and engagement metrics (likes, retweets, replies).
3. **Newsletter Composition** -- Select tweets via checkboxes, hit "Compose Newsletter" to generate a pre-formatted monthly roundup in Markdown, then edit the markdown in a side-by-side editor with live preview and download.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router) with TypeScript
- **Authentication**: Twitter OAuth 2.0 with PKCE via [twitter-api-v2](https://www.npmjs.com/package/twitter-api-v2)
- **Sessions**: [iron-session](https://www.npmjs.com/package/iron-session) (encrypted cookie-based, no database required)
- **Markdown Rendering**: [marked](https://www.npmjs.com/package/marked) (client-side markdown to HTML)
- **Styling**: Plain CSS

## Project Structure

```
app/
  layout.tsx                          Root layout
  page.tsx                            Main page (renders AppShell)
  globals.css                         All styles
  api/
    auth/
      twitter/route.ts                GET  - Initiate OAuth PKCE flow
      callback/route.ts               GET  - Handle OAuth callback
      status/route.ts                 GET  - Check auth status
      logout/route.ts                 POST - Destroy session
    tweets/route.ts                   GET  - Fetch tweets by date range
    newsletter/
      preview/route.ts                POST - Generate newsletter markdown
  components/
    AppShell.tsx                      Client component orchestrating all state
    LoginButton.tsx                   "Connect with Twitter" button
    AuthStatus.tsx                    Logged-in header with username + logout
    TweetFetcher.tsx                  Date range picker form
    TweetList.tsx                     Scrollable tweet list with select all/none
    TweetCard.tsx                     Single tweet display with checkbox
    MarkdownEditor.tsx                Side-by-side markdown editor with live preview
lib/
  session.ts                          iron-session config and helpers
  twitter.ts                          Twitter OAuth + tweet fetching wrapper
  newsletter.ts                       Monthly roundup newsletter template
types/
  index.ts                            Tweet, SessionData, AuthStatusResponse interfaces
```

## Setup

### Prerequisites

- Node.js 18+
- A [Twitter Developer](https://developer.twitter.com/) account with an app that has OAuth 2.0 enabled
- Twitter API **Basic** tier or higher (the free tier does not support reading tweets)

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

1. **Login** -- Click "Connect with Twitter" to authenticate via OAuth 2.0 PKCE.
2. **Fetch Tweets** -- Pick a date range and fetch your tweets. Full-length tweet text is retrieved (including extended tweets via the `note_tweet` field).
3. **Select Tweets** -- Use checkboxes to pick which tweets to include. Select all / deselect all buttons are provided.
4. **Compose** -- Click "Compose Newsletter" to generate a monthly content roundup in Markdown using a fixed template format.
5. **Edit & Preview** -- The markdown editor opens with a side-by-side view: editable markdown on the left, live HTML preview on the right.
6. **Download** -- Click "Download Markdown" to save the newsletter as a `.md` file.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/twitter` | Redirects to Twitter OAuth authorization page |
| GET | `/api/auth/callback` | Exchanges auth code for token, stores session, redirects to `/` |
| GET | `/api/auth/status` | Returns `{ authenticated: boolean, username?: string }` |
| POST | `/api/auth/logout` | Destroys the session |
| GET | `/api/tweets?start_date&end_date&max_results` | Fetches authenticated user's tweets |
| POST | `/api/newsletter/preview` | Accepts `{ tweets }`, returns `{ markdown }` |

## Architecture Notes

- **Sessions** are stored entirely in encrypted cookies (iron-session). No database is needed. The cookie uses `sameSite: 'lax'` to survive the OAuth redirect flow.
- **Newsletter template** is a fixed monthly roundup format. Each tweet is rendered as a blockquote with date and engagement metrics. The template includes placeholder sections for links, updates, and events.
- **Markdown preview** uses the `marked` library on the client side to render the markdown as HTML in real time as you edit.
- **Extended tweets** are fetched using the Twitter API v2 `note_tweet` field, so tweets longer than 280 characters are returned in full.
- **All client state** lives in the `AppShell` component: fetched tweets, selected tweet IDs, editor markdown. No state management library is used.
- **Two-phase UI**: The app has two views -- tweet selection (fetch, browse, select tweets) and the markdown editor (edit, preview, download). Clicking "Back to tweets" returns to the selection view.
- **Tweet fetching** returns up to 100 tweets per request (Twitter API v2 limit). The response includes pagination metadata for future "load more" support.

## Future Enhancements

- Pagination / "load more" for large date ranges
- Refresh token handling for longer sessions
- Save/load newsletter drafts
- Email integration for direct sending
- Support for tweet threads and media attachments
- Additional export formats (HTML, PDF)
