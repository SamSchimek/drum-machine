import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { TRACK_IDS } from '../../types';
import { TRACK_COLORS, STEPS_PER_PATTERN } from '../../constants';
import { usePatternPlayer } from '../../hooks/usePatternPlayer';
import type { Pattern, GridState } from '../../types';
import './SharedPatternView.css';

// Convert Supabase row to Pattern
interface SupabasePatternRow {
  id: string;
  user_id: string;
  name: string;
  grid: GridState;
  tempo: number;
  is_public: boolean;
  share_slug: string | null;
  created_at: string;
  updated_at: string;
}

function toPattern(row: SupabasePatternRow): Pattern {
  return {
    id: row.id,
    name: row.name,
    grid: row.grid,
    tempo: row.tempo,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    userId: row.user_id,
    isPublic: row.is_public,
    shareSlug: row.share_slug,
  };
}

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
            {Array.from({ length: STEPS_PER_PATTERN }, (_, step) => (
              <div
                key={step}
                className={`shared-grid-cell ${grid[trackId][step] ? 'active' : ''} ${step % 4 === 0 ? 'downbeat' : ''} ${step === currentStep ? 'current' : ''}`}
                style={{ '--track-color': TRACK_COLORS[trackId] } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SharedPatternView() {
  const { shareSlug } = useParams<{ shareSlug: string }>();
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSharedPattern() {
      if (!shareSlug) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('patterns')
          .select('*')
          .eq('share_slug', shareSlug)
          .maybeSingle();

        if (fetchError) {
          console.error('Error loading shared pattern:', fetchError);
          setError('Failed to load pattern');
        } else if (!data) {
          setError('Pattern not found or is no longer shared');
        } else {
          setPattern(toPattern(data as SupabasePatternRow));
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to load pattern');
      } finally {
        setLoading(false);
      }
    }

    loadSharedPattern();
  }, [shareSlug]);

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

  return (
    <div className="shared-pattern-view">
      <div className="shared-pattern-container">
        <header className="shared-pattern-header">
          <h1>{pattern.name}</h1>
          <p className="shared-pattern-tempo">{pattern.tempo} BPM</p>
          <button className="shared-play-button" onClick={handlePlayClick}>
            {isPlaying ? '■ Stop' : '▶ Play Pattern'}
          </button>
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
