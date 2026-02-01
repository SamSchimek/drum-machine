import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useDrumMachine } from '../../context/DrumMachineContext';
import type { Pattern } from '../../types';
import './ShareButton.css';

interface ShareButtonProps {
  pattern: Pattern;
}

export function ShareButton({ pattern }: ShareButtonProps) {
  const { user } = useAuth();
  const { makePatternPublic, makePatternPrivate } = useDrumMachine();
  const [isLoading, setIsLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentShareSlug, setCurrentShareSlug] = useState<string | null>(pattern.shareSlug ?? null);
  const [copied, setCopied] = useState(false);

  if (!user) {
    return null;
  }

  const handleShareClick = async () => {
    if (currentShareSlug) {
      // Already shared - just show the modal to re-copy link
      setShowShareModal(true);
      setCopied(false);
    } else {
      // Not shared yet - make it public
      setIsLoading(true);
      try {
        const slug = await makePatternPublic(pattern.id);
        if (slug) {
          setCurrentShareSlug(slug);
          setShowShareModal(true);
          setCopied(false);
        }
      } catch (error) {
        console.error('Error sharing:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMakePrivate = async () => {
    setIsLoading(true);
    try {
      const success = await makePatternPrivate(pattern.id);
      if (success) {
        setCurrentShareSlug(null);
        setShowShareModal(false);
      }
    } catch (error) {
      console.error('Error making private:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const shareUrl = currentShareSlug ? `${window.location.origin}/p/${currentShareSlug}` : null;

  const handleCopyLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  return (
    <>
      <button
        className={`share-button ${currentShareSlug ? 'shared' : ''}`}
        onClick={handleShareClick}
        disabled={isLoading}
        title={currentShareSlug ? 'Click to copy share link' : 'Click to share'}
      >
        {isLoading ? '...' : currentShareSlug ? 'Shared' : 'Share'}
      </button>

      {showShareModal && shareUrl && (
        <div className="share-modal-backdrop" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Pattern Shared!</h3>
            <p>Anyone with this link can view your pattern:</p>
            <div className="share-link-container">
              <input
                type="text"
                value={shareUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button onClick={handleCopyLink}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button className="share-modal-close" onClick={() => setShowShareModal(false)}>
              Done
            </button>

            <div className="share-modal-divider" />

            <div className="share-modal-make-private-section">
              <p className="share-modal-warning">
                Making this pattern private will prevent anyone with the link from accessing it.
              </p>
              <button
                className="share-modal-make-private"
                onClick={handleMakePrivate}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Make Private'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
