import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useDrumMachine } from '../../context/DrumMachineContext';
import './MigrationBanner.css';

export function MigrationBanner() {
  const { user } = useAuth();
  const { hasLocalPatterns, migrateToCloud } = useDrumMachine();
  const [showBanner, setShowBanner] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    uploaded: number;
    failed: number;
    skipped: number;
  } | null>(null);

  useEffect(() => {
    // Show banner when user logs in and has local patterns
    if (user && hasLocalPatterns()) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
      setMigrationResult(null);
    }
  }, [user, hasLocalPatterns]);

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateToCloud();
      setMigrationResult({
        uploaded: result.uploaded.length,
        failed: result.failed.length,
        skipped: result.skipped.length,
      });

      // Auto-hide banner after successful migration
      if (result.failed.length === 0) {
        setTimeout(() => {
          setShowBanner(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="migration-banner">
      {migrationResult ? (
        <div className="migration-result">
          {migrationResult.failed === 0 ? (
            <span className="migration-success">
              Migrated {migrationResult.uploaded} pattern{migrationResult.uploaded !== 1 ? 's' : ''} to cloud
              {migrationResult.skipped > 0 && ` (${migrationResult.skipped} already existed)`}
            </span>
          ) : (
            <span className="migration-partial">
              Migrated {migrationResult.uploaded} pattern{migrationResult.uploaded !== 1 ? 's' : ''}.
              {' '}{migrationResult.failed} failed - still saved locally.
            </span>
          )}
        </div>
      ) : (
        <>
          <span className="migration-message">
            You have local patterns. Would you like to sync them to your account?
          </span>
          <div className="migration-actions">
            <button
              className="migration-button migrate"
              onClick={handleMigrate}
              disabled={isMigrating}
            >
              {isMigrating ? 'Migrating...' : 'Sync to Cloud'}
            </button>
            <button
              className="migration-button dismiss"
              onClick={handleDismiss}
              disabled={isMigrating}
            >
              Keep Local
            </button>
          </div>
        </>
      )}
    </div>
  );
}
