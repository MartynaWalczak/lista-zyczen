// script.js
(() => {
  const form = document.getElementById('wishForm');
  const nameInput = document.getElementById('name');
  const linkInput = document.getElementById('link');
  const imageInput = document.getElementById('image');
  const previewImg = document.getElementById('preview');
  const listEl = document.getElementById('wishList');
  const emptyMsg = document.getElementById('emptyMsg');
  const listTitle = document.querySelector('[id="list-title"]');

  const STORAGE_KEY = 'wishlist_items_v1';

  let items = loadItems();

  // initial render
  render();

  // preview when image selected
  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) { previewImg.style.display = 'none'; previewImg.src = ''; return; }
    const dataUrl = await readAndResizeImage(file, 900); // limit width to 900
    previewImg.src = dataUrl;
    previewImg.style.display = 'inline-block';
  });

  // submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const link = linkInput.value.trim();
    if (!name) return alert('Podaj nazwę przed dodaniem.');

    let imageData = null;
    if (imageInput.files && imageInput.files[0]) {
      imageData = await readAndResizeImage(imageInput.files[0], 900);
    }

    const item = {
      id: Date.now().toString(),
      name,
      link: link || '',
      image: imageData
};

    items.unshift(item);
    saveItems(items);
    render();
    form.reset();
    previewImg.style.display = 'none';
  });

  // clear button
  document.getElementById('clearBtn').addEventListener('click', () => {
    form.reset();
    previewImg.style.display = 'none';
  });

  // helper: read image and resize with canvas to limit size (keeps localStorage smaller)
  function readAndResizeImage(file, maxWidth = 800) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Błąd odczytu pliku'));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const ratio = img.width / img.height;
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            width = maxWidth;
            height = Math.round(width / ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          // compress to jpeg (0.85) to save space; fallback to png if has transparency
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Błąd wczytywania obrazu'));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function saveItems(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Błąd zapisu do localStorage', e);
      alert('Nie udało się zapisać — lokalne miejsce może być pełne.');
    }
  }

  function loadItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error('Błąd odczytu localStorage', e);
      return [];
    }
}

  function render() {
    listEl.innerHTML = '';
    if (!items || items.length === 0) {
      emptyMsg.style.display = 'block';
    } else {
emptyMsg.style.display = 'none';
      items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'wish-item';
        li.dataset.id = item.id;

        const thumb = document.createElement('img');
        thumb.className = 'wish-thumb';
        thumb.alt = item.name;
        thumb.src = item.image || fallbackImage(item.name);

        const body = document.createElement('div');
        body.className = 'wish-body';

        const title = document.createElement('p');
        title.className = 'wish-title';
        title.textContent = item.name;

        const link = document.createElement('a');
        link.className = 'wish-link';
        link.textContent = item.link ? item.link : 'Brak linku';
        if (item.link) {
          link.href = item.link;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        } else {
          link.href = '#';
          link.addEventListener('click', (ev) => ev.preventDefault());
        }

        const meta = document.createElement('div');
        meta.className = 'wish-meta';

        const actions = document.createElement('div');
        actions.className = 'item-actions';

        const openBtn = document.createElement('button');
        openBtn.className = 'open';
        openBtn.textContent = 'Otwórz';
        openBtn.addEventListener('click', () => {
          if (item.link) window.open(item.link, '_blank', 'noopener');
          else alert('Brak linku do otwarcia.');
        });

        const removeBtn = document.createElement('button');
removeBtn.className = 'remove';
        removeBtn.textContent = 'Usuń';
        removeBtn.addEventListener('click', () => {
          if (!confirm('Usunąć tę pozycję?')) return;
          items = items.filter(x => x.id !== item.id);
          saveItems(items);
          render();
        });

        actions.appendChild(openBtn);
        actions.appendChild(removeBtn);

        meta.appendChild(actions);

        body.appendChild(title);
        body.appendChild(link);
        body.appendChild(meta);

        li.appendChild(thumb);
        li.appendChild(body);

        listEl.appendChild(li);
      });
    }

    listTitle.textContent = Twoja lista (${items.length});
  }

  function fallbackImage(text) {
    // generate small placeholder with initials using dataURL (canvas)
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#eef2ff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#3730a3';
    ctx.font = 'bold 40px sans-serif';
    const initials = getInitials(text);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, canvas.width/2, canvas.height/2);
    return canvas.toDataURL('image/png');
  }

  function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).slice(0,2);
    return parts.map(p => p[0]?.toUpperCase() ?? '').join('');
  }

})();
