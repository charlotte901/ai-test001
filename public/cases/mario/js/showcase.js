// Presentation-only controller. Open index.html without ?showcase=1 to play normally.
if (new URLSearchParams(location.search).has("showcase")) {
  document.documentElement.classList.add("showcase");
  window.showcaseStep = () => {
    if (["title", "gameover", "win"].includes(G.state)) {
      newGame();
      startLevel("overworld", false);
      G.state = "play";
    }
    if (G.state !== "play") return;
    const p = G.player;
    input.right = true;
    input.run = true;
    const enemyAhead = G.enemies.some((enemy) => !enemy.dead && enemy.x > p.x && enemy.x - p.x < 50);
    const tileX = Math.floor((p.x + p.w + 22) / TILE);
    const tileY = Math.floor((p.y + p.h - 2) / TILE);
    const obstacle = tileSolid(G.level.tiles[tileY]?.[tileX] || 0);
    const gap = !tileSolid(G.level.tiles[13]?.[tileX] || 0);
    input.jumpPressed = p.onGround && (obstacle || gap || enemyAhead || G.frame % 75 === 0);
    input.jump = input.jumpPressed || !p.onGround;
  };
}
