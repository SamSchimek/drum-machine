import { DrumMachineProvider } from '../../context/DrumMachineContext';
import { Grid } from '../Grid';
import { Transport } from '../Transport';
import { PatternBank } from '../PatternBank';
import { GeneratePanel } from '../GeneratePanel';
import { UserMenu, MigrationBanner } from '../Auth';
import './App.css';

export function App() {
  return (
    <DrumMachineProvider>
      <div className="app">
        <header className="app-header">
          <div className="header-left">
            <h1>808 Drum Machine</h1>
            <span className="subtitle">Web Audio + Markov Chain Pattern Generation</span>
          </div>
          <div className="header-right">
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
    </DrumMachineProvider>
  );
}
