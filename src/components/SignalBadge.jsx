import React from 'react';
import { SIGNAL_META, buildSuburbSignals } from '../utils/metricSignals';

export function SignalDot({ level, title }) {
  const meta = SIGNAL_META[level] || SIGNAL_META.amber;
  return (
    <span
      className={`signal-dot signal-${meta.id}`}
      title={title || meta.label}
      aria-label={title || meta.label}
    />
  );
}

export function SignalBadge({ level, label }) {
  const meta = SIGNAL_META[level] || SIGNAL_META.amber;
  return (
    <span className={`signal-badge signal-${meta.id}`}>
      <span className="signal-dot" />
      <span>{label || meta.label}</span>
    </span>
  );
}

export function SignalBoard({ suburb, compact = false, print = false }) {
  const snapshot = buildSuburbSignals(suburb);
  if (!snapshot.items.length) return null;

  return (
    <div className={`signal-board ${compact ? 'compact' : ''} ${print ? 'print' : ''}`}>
      <div className="signal-board-header">
        <div>
          <h3 className="signal-board-title">Decision signals</h3>
          <p className="signal-board-sub">
            Green supports the case, amber needs context, red deserves a closer look.
          </p>
        </div>
        <div className="signal-count-pills">
          <span className="signal-count green">{snapshot.counts.green} strong</span>
          <span className="signal-count amber">{snapshot.counts.amber} watch</span>
          <span className="signal-count red">{snapshot.counts.red} caution</span>
        </div>
      </div>

      <div className="signal-board-grid">
        {snapshot.items.map((item) => (
          <div key={item.key} className={`signal-chip signal-${item.level}`} title={item.why}>
            <div className="signal-chip-top">
              <span className="signal-chip-label">{item.label}</span>
              <SignalBadge level={item.level} />
            </div>
            <div className="signal-chip-value">{item.display}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
