export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  attachments?: {
    media_keys?: string[];
  };
  urls?: {
    display_url: string;
    expanded_url: string;
    title?: string;
  }[];
  retweet?: {
    original_author_username: string;
    original_author_name: string;
    original_text: string;
  };
}

export interface SessionData {
  accessToken?: string;
  userId?: string;
  username?: string;
  codeVerifier?: string;
  state?: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  username?: string;
}

export interface TweetsResponse {
  tweets: Tweet[];
  meta?: {
    next_token?: string;
    result_count: number;
  };
}
