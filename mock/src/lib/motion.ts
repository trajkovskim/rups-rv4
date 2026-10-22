// Če ima uporabnik v sistemu vklopljeno manj gibanja, animacije v JS preskočimo
export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const motionMs = (ms: number) => (reducedMotion() ? 0 : ms);
