import { ArrowUpRight, Play } from 'lucide-react';
import { assets } from '../siteData.js';

// Episodes come from the database (api.episodes()), not siteData — this
// card reads the live field names (episode_number, guest_name,
// cover_image_url, youtube_url, publish_date), not the old static-data
// shape. Falls back to a generic studio photo if an episode has no cover.
export function EpisodeCard({ episode, featured = false }) {
  const dateLabel = episode.publish_date
    ? new Date(episode.publish_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return (
    <article className={`episode-card ${featured ? 'featured-episode' : ''}`}>
      <div className="episode-image">
        <img src={episode.cover_image_url || assets.studio} alt={`${episode.title} cover`} loading="lazy" decoding="async" />
        <span className="episode-number">Episode {episode.episode_number}</span>
      </div>
      <div className="episode-body">
        <p className="eyebrow">
          {episode.category}
          {dateLabel && ` · ${dateLabel}`}
        </p>
        <h3>{episode.guest_name}</h3>
        <p>{episode.description}</p>
        <a className="episode-link" href={episode.youtube_url} target="_blank" rel="noreferrer">
          <Play size={15} fill="currentColor" /> Watch on YouTube <ArrowUpRight size={15} />
        </a>
      </div>
    </article>
  );
}
