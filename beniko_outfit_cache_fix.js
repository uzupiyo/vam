/* Beniko outfit cache/path fix - forces Origin portrait and Beniko default dot cache refresh */
(function () {
  const CACHE = 'beniko-default-dot-v1';
  const BENIKO_DEFAULT_DOT = `assets/player/beniko/Beniko Default.png?v=${CACHE}`;
  const NORMAL = {
    id: 'normal',
    label: 'Normal',
    version: 'Star Mage',
    portrait: `assets/player/beniko/portrait.png?v=${CACHE}`,
  };
  const ORIGIN = {
    id: 'origin',
    label: 'Origin',
    version: 'Origin ver',
    portrait: `assets/player/beniko/outfits/origin/portrait.png?v=${CACHE}`,
  };
  const outfits = [NORMAL, ORIGIN];
  let outfitIndex = 0;

  function isCharacterSelectOpen() {
    const overlay = document.getElementById('characterOverlay');
    return !!overlay && overlay.classList.contains('show');
  }

  function selectedCharacterId() {
    const selected = document.querySelector('#characterGrid .character-cell.selected');
    return selected?.dataset?.character || window.selectedCharacter || 'rin';
  }

  function currentOutfit() {
    return outfits[outfitIndex] || NORMAL;
  }

  function applyBenikoDefaultDot() {
    const img = document.querySelector('#characterGrid .character-cell[data-character="beniko"] img');
    if (!img) return;
    img.onerror = () => console.error('[BenikoOutfitFix] failed to load Beniko default dot:', BENIKO_DEFAULT_DOT);
    img.removeAttribute('srcset');
    img.src = BENIKO_DEFAULT_DOT;
    img.alt = 'Beniko default dot';
    img.style.display = 'block';
    img.style.visibility = 'visible';
    img.style.opacity = '1';
    img.style.objectFit = 'contain';
    img.style.objectPosition = 'center center';
    img.style.maxWidth = '86%';
    img.style.maxHeight = '86%';
    img.style.width = '86%';
    img.style.height = '86%';
    img.style.margin = 'auto';
  }

  function setPortrait(src, label) {
    const portrait = document.getElementById('characterPortrait');
    if (!portrait) return;
    portrait.onerror = () => console.error('[BenikoOutfitFix] failed to load portrait:', src);
    portrait.removeAttribute('srcset');
    portrait.src = src;
    portrait.alt = `Beniko ${label} portrait`;
    portrait.style.display = 'block';
    portrait.style.visibility = 'visible';
    portrait.style.opacity = '1';
    portrait.style.objectFit = 'contain';
    portrait.style.objectPosition = 'center center';
    portrait.style.width = '100%';
    portrait.style.height = '100%';
  }

  function applyBenikoDetail() {
    applyBenikoDefaultDot();
    if (selectedCharacterId() !== 'beniko') return;
    const outfit = currentOutfit();
    setPortrait(outfit.portrait, outfit.label);
    const version = document.getElementById('characterVersion');
    const desc = document.getElementById('characterDesc');
    if (version) version.textContent = outfit.version;
    if (desc) desc.textContent = `ゲームコントローラーを媒体に、青い星形エネルギー弾を撃つ狐娘。 / 衣装: ${outfit.label}`;
    window.selectedBenikoOutfit = outfit.id;
  }

  function cycleBenikoOutfit() {
    if (selectedCharacterId() !== 'beniko') return;
    outfitIndex = (outfitIndex + 1) % outfits.length;
    applyBenikoDetail();
  }

  function applyHudPortraitIfNeeded() {
    if (window.selectedCharacter !== 'beniko' && selectedCharacterId() !== 'beniko') return;
    const outfit = currentOutfit();
    const hudPortrait = document.querySelector('.hud-rin-portrait');
    if (!hudPortrait) return;
    hudPortrait.onerror = () => console.error('[BenikoOutfitFix] failed to load HUD portrait:', outfit.portrait);
    hudPortrait.removeAttribute('srcset');
    hudPortrait.src = outfit.portrait;
    hudPortrait.style.objectFit = 'contain';
  }

  function bind() {
    const grid = document.getElementById('characterGrid');
    applyBenikoDefaultDot();
    grid?.addEventListener('click', () => setTimeout(applyBenikoDetail, 0), true);
    document.addEventListener('keydown', (event) => {
      if (!isCharacterSelectOpen()) return;
      if (event.key.toLowerCase() !== 'c') return;
      if (selectedCharacterId() !== 'beniko') return;
      event.preventDefault();
      cycleBenikoOutfit();
    }, true);
    document.getElementById('confirmCharacterButton')?.addEventListener('click', () => setTimeout(applyHudPortraitIfNeeded, 100), true);
    grid?.addEventListener('dblclick', () => setTimeout(applyHudPortraitIfNeeded, 100), true);
    window.benikoOutfitCacheFix = {
      cache: CACHE,
      defaultDot: BENIKO_DEFAULT_DOT,
      applyBenikoDefaultDot,
      applyBenikoDetail,
      cycleBenikoOutfit,
      getCurrentOutfit: () => currentOutfit().id,
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
