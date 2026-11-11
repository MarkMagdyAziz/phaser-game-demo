export const AUDIO_KEYS = {
  ambient: 'ambient-wind',
  skiLoop: 'ski-loop',
  jump: 'jump',
  landing: 'landing',
  crash: 'crash',
  coin: 'coin',
  combo: 'combo',
  uiClick: 'ui-click',
} as const;

export const AUDIO_FILES: Record<keyof typeof AUDIO_KEYS, string> = {
  ambient: 'sounds/wind.mp3',
  skiLoop: 'sounds/ski_loop.wav',
  jump: 'sounds/jump.wav',
  landing: 'sounds/landing.wav',
  crash: 'sounds/crash.wav',
  coin: 'sounds/coin.wav',
  combo: 'sounds/combo.wav',
  uiClick: 'sounds/ui_click.wav',
};
