import { DrumMachineProvider } from '../../context/DrumMachineContext';
import { TutorialProvider, useTutorial } from '../../context/TutorialContext';
import { Grid } from '../Grid';
import { Transport } from '../Transport';
import { PatternBank } from '../PatternBank';
import { GeneratePanel } from '../GeneratePanel';
import { UserMenu, MigrationBanner } from '../Auth';
import { TutorialOverlay, TutorialPrompt } from '../Tutorial';
import './App.css';

function HelpButton() {
  const { resetTutorial, isCompleted, isSkipped } = useTutorial();

  // Only show help button if tutorial was completed or skipped
  if (!isCompleted && !isSkipped) {
    return null;
  }

  return (
    <button
      className="help-button"
      onClick={resetTutorial}
      aria-label="Show tutorial"
      title="Show tutorial"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
      </svg>
    </button>
  );
}

export function App() {
  return (
    <DrumMachineProvider>
      <TutorialProvider>
        <div className="app">
          <header className="app-header">
            <div className="header-left">
              <h1>808 Drum Machine</h1>
              <span className="subtitle">Web Audio + Markov Chain Pattern Generation</span>
            </div>
            <div className="header-right">
              <HelpButton />
              <UserMenu />
            </div>
          </header>

          <main className="app-main">
            <div className="sequencer-section">
              <Transport />
              <Grid />
            </div>

            <aside className="sidebar">
              <MigrationBanner />
              <GeneratePanel />
              <PatternBank />
            </aside>
          </main>
        </div>
        <TutorialPrompt />
        <TutorialOverlay />
      </TutorialProvider>
    </DrumMachineProvider>
  );
}
