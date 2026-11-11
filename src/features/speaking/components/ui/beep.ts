/** Plays the 1000 Hz, 300 ms exam tone with Web Audio. */
export function playBeep() {
  if (typeof AudioContext === "undefined") return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  oscillator.frequency.value = 1000;
  oscillator.connect(context.destination);
  oscillator.onended = () => void context.close();
  oscillator.start();
  oscillator.stop(context.currentTime + 0.3);
}
