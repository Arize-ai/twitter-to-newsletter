'use client';

import { Tweet } from '@/types';
import TweetCard from './TweetCard';

interface TweetListProps {
  tweets: Tweet[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export default function TweetList({
  tweets,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: TweetListProps) {
  if (tweets.length === 0) {
    return null;
  }

  return (
    <div className="tweet-list">
      <div className="tweet-list__header">
        <span>{tweets.length} tweets found, {selectedIds.size} selected</span>
        <div className="tweet-list__actions">
          <button className="text-button" onClick={onSelectAll}>
            Select All
          </button>
          <button className="text-button" onClick={onDeselectAll}>
            Deselect All
          </button>
        </div>
      </div>
      <div className="tweet-list__items">
        {tweets.map((tweet) => (
          <TweetCard
            key={tweet.id}
            tweet={tweet}
            selected={selectedIds.has(tweet.id)}
            onToggle={() => onToggle(tweet.id)}
          />
        ))}
      </div>
    </div>
  );
}
