'use client';

import { Tweet } from '@/types';

interface TweetCardProps {
  tweet: Tweet;
  selected: boolean;
  onToggle: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function TweetCard({ tweet, selected, onToggle }: TweetCardProps) {
  const m = tweet.public_metrics;
  const isRetweet = !!tweet.retweet;
  const displayText = isRetweet ? tweet.retweet!.original_text : tweet.text;

  return (
    <div className={`tweet-card ${selected ? 'tweet-card--selected' : ''}`}>
      <label className="tweet-card__checkbox">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
        />
      </label>
      <div className="tweet-card__content">
        {isRetweet && (
          <div className="tweet-card__retweet-label">
            Retweeted @{tweet.retweet!.original_author_username}
          </div>
        )}
        <p className="tweet-card__text">{displayText}</p>
        <div className="tweet-card__meta">
          <time>{formatDate(tweet.created_at)}</time>
          <span>{m.like_count} likes</span>
          <span>{m.retweet_count} RT</span>
          <span>{m.reply_count} replies</span>
        </div>
      </div>
    </div>
  );
}
