'use client';

import { useState } from 'react';

interface TweetFetcherProps {
  onFetch: (startDate: string, endDate: string) => void;
  loading: boolean;
}

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function TweetFetcher({ onFetch, loading }: TweetFetcherProps) {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (new Date(startDate) >= new Date(endDate)) {
      setError('Start date must be before end date.');
      return;
    }

    // Send end date as end-of-day
    const endDateTime = `${endDate}T23:59:59Z`;
    const startDateTime = `${startDate}T00:00:00Z`;
    onFetch(startDateTime, endDateTime);
  };

  return (
    <form className="tweet-fetcher" onSubmit={handleSubmit}>
      <div className="date-fields">
        <label className="date-field">
          <span>Start Date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>
        <label className="date-field">
          <span>End Date</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="fetch-button" disabled={loading}>
          {loading ? 'Fetching...' : 'Fetch Tweets'}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
