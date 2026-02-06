import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { TRACK_IDS } from '../../types';
import { TRACK_COLORS, STEPS_PER_PATTERN } from '../../constants';
import { usePatternPlayer } from '../../hooks/usePatternPlayer';
import { getSharedPatternWithCreator, hasUpvoted, addUpvote, removeUpvote, PatternWithCreator } from '../../storage/SupabaseStorage';
import { getAnonymousId } from '../../utils/anonymousId';
import type { GridState } from '../../types';
import './SharedPatternView.css';

interface PatternGridProps {
  grid: GridState;
  currentStep: number;
}

function PatternGrid({ grid, currentStep }: PatternGridProps) {
  return (
    <div className="shared-pattern-grid">
      {TRACK_IDS.map((trackId) => (
        <div key={trackId} className="shared-grid-row">
          <div className="shared-track-label">{trackId}</div>
          <div className="shared-grid-cells">
            {Array.from({ length: STEPS_PER_PATTERN }, (_, step) => {
              const isBarEnd = step === 15;
              return (
                <div
                  key={step}
                  className={`shared-grid-cell ${grid[trackId][step] ? 'active' : ''} ${step % 4 === 0 ? 'downbeat' : ''} ${step === currentStep ? 'current' : ''} ${isBarEnd ? 'bar-end' : ''}`}
                  style={{ '--track-color': TRACK_COLORS[trackId] } as React.CSSProperties}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SharedPatternView() {
  const { shareSlug } = useParams<{ shareSlug: string }>();
  const { user } = useAuth();
  const [pattern, setPattern] = useState<PatternWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [upvoteLoading, setUpvoteLoading] = useState(false);

  useEffect(() => {
    async function loadSharedPattern() {
      if (!shareSlug) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const patternData = await getSharedPatternWithCreator(shareSlug);

        if (!patternData) {
          setError('Pattern not found or is no longer shared');
        } else {
          setPattern(patternData);
          setUpvoteCount(patternData.upvoteCount);

          // Check if current user has upvoted
          const userId = user?.id ?? null;
          const anonymousId = userId ? null : getAnonymousId();
          const voted = await hasUpvoted(patternData.id, userId, anonymousId);
          setIsUpvoted(voted);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to load pattern');
      } finally {
        setLoading(false);
      }
    }

    loadSharedPattern();
  }, [shareSlug, user?.id]);

  // Use the pattern player hook (with defaults for when pattern is null)
  const { isPlaying, currentStep, play, stop } = usePatternPlayer({
    grid: pattern?.grid ?? {} as GridState,
    tempo: pattern?.tempo ?? 120,
  });

  const handlePlayClick = () => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  };

  const handleUpvoteClick = async () => {
    if (!pattern || upvoteLoading) return;

    setUpvoteLoading(true);
    const userId = user?.id ?? null;
    const anonymousId = userId ? null : getAnonymousId();

    try {
      if (isUpvoted) {
        // Only authenticated users can remove upvotes
        if (userId) {
          const success = await removeUpvote(pattern.id, userId);
          if (success) {
            setIsUpvoted(false);
            setUpvoteCount(prev => Math.max(0, prev - 1));
          }
        }
      } else {
        const success = await addUpvote(pattern.id, userId, anonymousId);
        if (success) {
          setIsUpvoted(true);
          setUpvoteCount(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error('Error toggling upvote:', err);
    } finally {
      setUpvoteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="shared-pattern-view">
        <div className="shared-pattern-loading">Loading pattern...</div>
      </div>
    );
  }

  if (error || !pattern) {
    return (
      <div className="shared-pattern-view">
        <div className="shared-pattern-error">
          <h2>Oops!</h2>
          <p>{error || 'Pattern not found'}</p>
          <Link to="/" className="shared-pattern-home-link">
            Go to Drum Machine
          </Link>
        </div>
      </div>
    );
  }

  // Determine creator display name
  let creatorDisplay: string | null = null;
  if (pattern.showCreatorName) {
    if (pattern.creatorDisplayName) {
      creatorDisplay = pattern.creatorDisplayName;
    } else if (pattern.userId) {
      // Fallback: we don't have access to email here, so just show nothing
      // The profile display_name should be set by the user
      creatorDisplay = null;
    }
  }

  return (
    <div className="shared-pattern-view">
      <div className="shared-pattern-container">
        <header className="shared-pattern-header">
          <h1>
            "{pattern.name}"
            {creatorDisplay && <span className="shared-pattern-byline">by {creatorDisplay}</span>}
          </h1>
          <p className="shared-pattern-tempo">{pattern.tempo} BPM</p>
          <div className="shared-pattern-actions">
            <button className="shared-play-button" onClick={handlePlayClick}>
              {isPlaying ? '■ Stop' : '▶ Play Pattern'}
            </button>
            <button
              className={`shared-upvote-button ${isUpvoted ? 'upvoted' : ''} ${isUpvoted && !user ? 'permanent' : ''}`}
              onClick={handleUpvoteClick}
              disabled={upvoteLoading || (isUpvoted && !user)}
              aria-label={isUpvoted ? (user ? 'Remove upvote' : 'Upvoted (sign in to remove)') : 'Upvote this pattern'}
              title={isUpvoted && !user ? 'Sign in to remove your upvote' : undefined}
            >
              <span className="upvote-icon">{isUpvoted ? '♥' : '♡'}</span>
              <span className="upvote-count">{upvoteCount}</span>
            </button>
          </div>
        </header>

        <PatternGrid grid={pattern.grid} currentStep={currentStep} />

        <footer className="shared-pattern-footer">
          <p>Created with 808 Drum Machine</p>
          <Link to="/" className="shared-pattern-cta">
            Create Your Own Pattern
          </Link>
        </footer>
      </div>
    </div>
  );
}
