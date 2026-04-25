const EMOJI_DATA = {
  'Smileys': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐'],
  'Gestures': ['👋','🤚','🖐','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏'],
  'Hearts': ['❤','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤‍🔥','❤‍🩹','❣','💕','💞','💓','💗','💖','💘','💝'],
  'Objects': ['⭐','🌟','✨','💫','🔥','💥','⚡','🎉','🎊','🏆','🥇','🎯','🚀','💡','📌','📎','🔗','📐','✏','🖊','📝','💻','🖥','📱','📷','🎵','🎶','🔔','💡','🔑','🔒','🔓'],
  'Nature': ['☀','🌤','⛅','🌥','🌦','🌧','⛈','🌩','❄','🌊','🌈','🌸','🌺','🌻','🌹','🍀','🌲','🌳','🌴','🌵','🐾','🦋','🐝','🐛','🦀','🐙','🐠','🐟','🐬','🐳'],
  'Food': ['🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🥝','🍅','🥑','🍕','🍔','🍟','🌭','🍿','🧁','🍰','🎂','🍩','🍪','🍫','☕','🍵','🧃','🍺','🥂','🍷'],
  'Flags': ['🏳','🏴','🏁','🚩','🎌','🏴‍☠️','🇺🇸','🇬🇧','🇯🇵','🇰🇷','🇮🇩','🇫🇷','🇩🇪','🇧🇷','🇮🇳','🇦🇺','🇨🇦','🇲🇽','🇷🇺','🇨🇳'],
  'Symbols': ['✅','❌','⚠','❓','❗','♻','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','⬛','⬜','🔶','🔷','🔸','🔹','➕','➖','➗','♾','💲','💱','©','®','™']
};

function initEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  const grid = document.getElementById('emojiGrid');
  const categories = document.getElementById('emojiCategories');
  const search = document.getElementById('emojiSearch');

  // Build category tabs
  const catIcons = { Smileys: '😀', Gestures: '👋', Hearts: '❤️', Objects: '⭐', Nature: '🌸', Food: '🍕', Flags: '🏁', Symbols: '✅' };
  Object.keys(EMOJI_DATA).forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'emoji-cat-btn';
    btn.textContent = catIcons[cat];
    btn.title = cat;
    btn.addEventListener('click', () => {
      categories.querySelectorAll('.emoji-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderEmojis(EMOJI_DATA[cat]);
    });
    categories.appendChild(btn);
  });
  // Default selection
  categories.querySelector('.emoji-cat-btn').classList.add('active');
  renderEmojis(EMOJI_DATA['Smileys']);

  // Search
  search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    if (!q) {
      const active = categories.querySelector('.emoji-cat-btn.active');
      const catName = active ? active.title : 'Smileys';
      renderEmojis(EMOJI_DATA[catName]);
      return;
    }
    const filtered = getAllEmojis().filter(e => {
      const names = (EMOJI_UNICODE_NAMES[e] || '').toLowerCase();
      return names.includes(q) || e.includes(q);
    });
    renderEmojis(filtered);
  });
}

function renderEmojis(list) {
  const grid = document.getElementById('emojiGrid');
  grid.innerHTML = '';
  list.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'emoji-item';
    btn.textContent = emoji;
    btn.addEventListener('click', () => {
      MDLive.insertAtCursor(emoji);
      document.getElementById('emojiPicker').classList.remove('open');
    });
    grid.appendChild(btn);
  });
}

function getAllEmojis() {
  const all = [];
  Object.values(EMOJI_DATA).forEach(arr => all.push(...arr));
  return [...new Set(all)];
}

// Minimal name map for search (extendable)
const EMOJI_UNICODE_NAMES = {
  '😀':'grinning','😃':'smiley','😄':'smile','😁':'grin','😆':'laughing','😅':'sweat smile',
  '🤣':'rofl','😂':'joy','🙂':'slightly smiling','🙃':'upside down','😉':'wink','😊':'blush',
  '😇':'innocent','🥰':'smiling heart','😍':'heart eyes','🤩':'star struck','😘':'kissing heart',
  '🤔':'thinking','😐':'neutral','🙄':'rolling eyes','😏':'smirk','😴':'sleeping','🤮':'vomit',
  '🔥':'fire','⭐':'star','✨':'sparkles','💯':'hundred','❤️':'red heart','👍':'thumbs up',
  '👎':'thumbs down','🎉':'party','🚀':'rocket','💻':'computer','📱':'phone','☕':'coffee',
  '🇺🇸':'usa flag','🇯🇵':'japan flag','🇰🇷':'korea flag','🇮🇩':'indonesia flag','🇬🇧':'uk flag',
  '✅':'check','❌':'cross','⚠':'warning','❓':'question','❗':'exclamation'
};
