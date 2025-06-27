// src/utils/randomNickname.js
const adjectives = [
  "cool", "fast", "lucky", "funny", "silent", "happy", "smart", "brave", "quick", "chill",
  "lazy", "kind", "shy", "wild", "fresh", "tiny", "big", "fancy", "crazy", "fierce"
];
const animals = [
  "cat", "dog", "fox", "owl", "bear", "wolf", "lion", "duck", "panda", "tiger",
  "eagle", "koala", "rabbit", "deer", "shark", "whale", "horse", "sheep", "mouse", "otter"
];

export function generateRandomNickname() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adj}${animal}${number}`;
}
