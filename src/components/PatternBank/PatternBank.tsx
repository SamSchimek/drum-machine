import React, { useState } from 'react';
import { useDrumMachine } from '../../context/DrumMachineContext';
import { useTutorial } from '../../context/TutorialContext';
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
  const { patterns, savePattern, loadPattern, deletePattern, renamePattern, patternsLoading, patternError } = useDrumMachine();
  const { isSaveStep, isShareStep, onPatternSaved } = useTutorial();
  const { user } = useAuth();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [patternName, setPatternName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Pre-fill "My First Beat" when opening save dialog during tutorial
  const handleOpenSaveDialog = () => {
    if (isSaveStep) {
      setPatternName('My First Beat');
    }
    setShowSaveDialog(true);
  };

  const handleSave = async () => {
    if (patternName.trim() && !isSaving) {
      setIsSaving(true);
      try {
        await savePattern(patternName.trim());
        setPatternName('');
        setShowSaveDialog(false);
        // Notify tutorial that pattern was saved
        onPatternSaved();
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

  const handleStartRename = (pattern: Pattern) => {
    setEditingId(pattern.id);
    setEditingName(pattern.name);
  };

  const handleRename = async () => {
    if (editingId && editingName.trim()) {
      try {
        await renamePattern(editingId, editingName.trim());
      } catch (error) {
        console.error('Failed to rename pattern:', error);
      }
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingName('');
    }
  };

  return (
    <div className="pattern-bank">
      <div className="panel-screws" aria-hidden="true">
        <span className="screw screw-tl" />
        <span className="screw screw-tr" />
        <span className="screw screw-bl" />
        <span className="screw screw-br" />
      </div>
      <div className="pattern-bank-header">
        <h3>Patterns ({patterns.length})</h3>
        <button
          className="save-button"
          onClick={handleOpenSaveDialog}
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
        <div className={`save-dialog ${isSaveStep ? 'tutorial-highlight' : ''}`}>
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
          patterns.map((pattern, index) => (
            <div key={pattern.id} className={`pattern-item ${index === 0 && isShareStep ? 'tutorial-share-target' : ''}`}>
              <div className="pattern-info" onClick={() => editingId !== pattern.id && handleLoad(pattern.id)}>
                <div className="pattern-name-row">
                  {editingId === pattern.id ? (
                    <input
                      type="text"
                      className="pattern-name-input"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={handleRenameKeyDown}
                      onBlur={handleRename}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span className="pattern-name">{pattern.name}</span>
                      <button
                        className="rename-button"
                        onClick={(e) => { e.stopPropagation(); handleStartRename(pattern); }}
                        aria-label={`Rename ${pattern.name}`}
                        title="Rename"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                <span className="pattern-tempo">{pattern.tempo} BPM</span>
                <PatternPreview grid={pattern.grid} />
              </div>
              <div className="pattern-actions">
                {(user || isShareStep) && <ShareButton pattern={pattern} />}
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
