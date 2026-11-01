const REACTIONS = Object.freeze({
  hi: ['👋', 'Hi!'], heart: ['💛', 'A little love'], wave: ['🙋', 'A wave'],
  tea: ['🍵', 'Tea?'], coffee: ['☕', 'Coffee?'], thanks: ['🙏', 'Thank you'],
  cheer: ['📣', 'Cheering you on'], hug: ['🫂', 'A hug'], highfive: ['🙌', 'High five!'],
  sparkle: ['✨', 'A little sparkle'], thinking: ['💭', 'Thinking of you'], celebrate: ['🎉', 'Celebrate!']
});
const hello = document.getElementById('hello');
window.pokiOverlay?.onHello(value => {
  const reaction = Object.hasOwn(REACTIONS, value.reaction ?? 'hi') ? REACTIONS[value.reaction ?? 'hi'] : REACTIONS.hi;
  document.getElementById('caption').textContent = value.from;
  document.getElementById('reaction-icon').textContent = reaction[0];
  document.getElementById('reaction-label').textContent = reaction[1];
  const avatar = document.getElementById('avatar'), monogram = document.getElementById('monogram');
  avatar.hidden = !value.avatar; monogram.hidden = !!value.avatar;
  avatar.alt = `${value.from}’s chosen avatar`;
  if (value.avatar) avatar.src = value.avatar; else avatar.removeAttribute('src');
  monogram.textContent = value.from.slice(0, 1).toUpperCase();
  hello.classList.remove('arrive'); void hello.offsetWidth; hello.classList.add('arrive');
});

document.getElementById('avatar').addEventListener('error', () => { document.getElementById('avatar').hidden = true; document.getElementById('monogram').hidden = false; });
