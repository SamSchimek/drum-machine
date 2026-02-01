import React, { useState } from 'react';
import { useDrumMachine } from '../../context/DrumMachineContext';
import { useAuth } from '../../auth/AuthContext';
import { TRACK_IDS } from '../../types';
import { TRACK_COLORS, STEPS_PER_PATTERN } from '../../constants';
import { ShareButton } from '../Share';
import type { Pattern } from '../../types';
import './PatternBank.css';

function PatternPreview({ grid }: { grid: Pattern['grid'] }) {
  return (
    <div className="pattern-preview">
      {TRACK_IDS.slice(0, 4).map((trackId) => (
        <div key={trackId} className="preview-row">
          {Array.from({ length: STEPS_PER_PATTERN }, (_, step) => (
            <div
              key={step}
              className={`preview-cell ${grid[trackId][step] ? 'active' : ''}`}
              style={{ '--track-color': TRACK_COLORS[trackId] } as React.CSSProperties}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PatternBank() {
  const { patterns, savePattern, loadPattern, deletePattern, patternsLoading, patternError } = useDrumMachine();
  const { user } = useAuth();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [patternName, setPatternName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (patternName.trim() && !isSaving) {
      setIsSaving(true);
      try {
        await savePattern(patternName.trim());
        setPatternName('');
        setShowSaveDialog(false);
      } catch (error) {
        // Error is handled by context
        console.error('Failed to save pattern:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setShowSaveDialog(false);
      setPatternName('');
    }
  };

  const handleLoad = async (id: string) => {
    try {
      await loadPattern(id);
    } catch (error) {
      console.error('Failed to load pattern:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePattern(id);
    } catch (error) {
      console.error('Failed to delete pattern:', error);
    }
  };

  return (
    <div className="pattern-bank">
      <div className="pattern-bank-header">
        <h3>Patterns ({patterns.length})</h3>
        <button
          className="save-button"
          onClick={() => setShowSaveDialog(true)}
          disabled={isSaving}
        >
          Save Current
        </button>
      </div>

      {patternError && (
        <div className="pattern-error">
          {patternError}
        </div>
      )}

      {showSaveDialog && (
        <div className="save-dialog">
          <input
            type="text"
            value={patternName}
            onChange={(e) => setPatternName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pattern name..."
            autoFocus
            disabled={isSaving}
          />
          <button onClick={handleSave} disabled={!patternName.trim() || isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => { setShowSaveDialog(false); setPatternName(''); }} disabled={isSaving}>
            Cancel
          </button>
        </div>
      )}

      <div className="pattern-list">
        {patternsLoading && patterns.length === 0 ? (
          <div className="patterns-loading">
            Loading patterns...
          </div>
        ) : patterns.length === 0 ? (
          <div className="no-patterns">
            No saved patterns yet. Create and save some patterns to use the generator!
          </div>
        ) : (
          patterns.map((pattern) => (
            <div key={pattern.id} className="pattern-item">
              <div className="pattern-info" onClick={() => handleLoad(pattern.id)}>
                <span className="pattern-name">{pattern.name}</span>
                <span className="pattern-tempo">{pattern.tempo} BPM</span>
                <PatternPreview grid={pattern.grid} />
              </div>
              <div className="pattern-actions">
                {user && <ShareButton pattern={pattern} />}
                <button
                  className="delete-button"
                  onClick={() => handleDelete(pattern.id)}
                  aria-label={`Delete ${pattern.name}`}
                >
                  &times;
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
