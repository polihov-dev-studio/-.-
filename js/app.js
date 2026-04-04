const SIMPLE_PASSWORD = '1234';
const STORAGE_KEY = 'polihov-products-data-v3';
const AUTH_KEY = 'polihov-products-auth-v3';
const SETTINGS_KEY = 'polihov-products-github-v4';
const GITHUB_OWNER = 'polihov-rf';
const GITHUB_REPO = 'товары';
const GITHUB_BRANCH = 'main';
const GITHUB_DATA_PATH = 'data/items.json';
const DEFAULT_DATA_PATH = 'data/items.json';

let state = null;
let githubSettings = loadGithubSettings();
let editingItem = null;
let editingListId = null;
let dragItemId = null;

const el = {
  loginScreen: document.getElementById('loginScreen'),
  app: document.getElementById('app'),
  passwordInput: document.getElementById('passwordInput'),
  loginBtn: document.getElementById('loginBtn'),
  loginMessage: document.getElementById('loginMessage'),
  logoutBtn: document.getElementById('logoutBtn'),
  topbarAddItemBtn: document.getElementById('topbarAddItemBtn'),
  toggleFiltersBtn: document.getElementById('toggleFiltersBtn'),
  closeFiltersBtn: document.getElementById('closeFiltersBtn'),
  filtersPanel: document.getElementById('filtersPanel'),

  listsContainer: document.getElementById('listsContainer'),
  addListBtn: document.getElementById('addListBtn'),
  currentListTitle: document.getElementById('currentListTitle'),
  currentListMeta: document.getElementById('currentListMeta'),
  cardsSection: document.getElementById('cardsSection'),
  countBadge: document.getElementById('countBadge'),
  doneBadge: document.getElementById('doneBadge'),
  priceBadge: document.getElementById('priceBadge'),
  searchInput: document.getElementById('searchInput'),
  filterCategory: document.getElementById('filterCategory'),
  filterSubcategory: document.getElementById('filterSubcategory'),
  filterStatus: document.getElementById('filterStatus'),
  sortSelect: document.getElementById('sortSelect'),
  clearDoneFilterBtn: document.getElementById('clearDoneFilterBtn'),

  openCreateItemBtn: document.getElementById('openCreateItemBtn'),
  itemModal: document.getElementById('itemModal'),
  itemModalTitle: document.getElementById('itemModalTitle'),
  closeItemModalBtn: document.getElementById('closeItemModalBtn'),
  itemTitle: document.getElementById('itemTitle'),
  itemPrice: document.getElementById('itemPrice'),
  itemCategory: document.getElementById('itemCategory'),
  itemSubcategory: document.getElementById('itemSubcategory'),
  itemPlatform: document.getElementById('itemPlatform'),
  itemBuyUrl: document.getElementById('itemBuyUrl'),
  itemImage: document.getElementById('itemImage'),
  itemNote: document.getElementById('itemNote'),
  itemDone: document.getElementById('itemDone'),
  saveItemBtn: document.getElementById('saveItemBtn'),
  deleteItemBtn: document.getElementById('deleteItemBtn'),

  listModal: document.getElementById('listModal'),
  listModalTitle: document.getElementById('listModalTitle'),
  closeListModalBtn: document.getElementById('closeListModalBtn'),
  listNameInput: document.getElementById('listNameInput'),
  saveListBtn: document.getElementById('saveListBtn'),
  deleteListBtn: document.getElementById('deleteListBtn'),

  exportBtn: document.getElementById('exportBtn'),
  importBtn: document.getElementById('importBtn'),
  importFileInput: document.getElementById('importFileInput'),

  ghToken: document.getElementById('ghToken'),
  loadGithubBtn: document.getElementById('loadGithubBtn'),
  saveGithubBtn: document.getElementById('saveGithubBtn'),
  syncMessage: document.getElementById('syncMessage')
};

document.addEventListener('DOMContentLoaded', boot);

async function boot() {
  state = await loadState();
  normalizeState();
  applyGithubSettingsToForm();
  initCustomSelects();
  bindEvents();
  toggleAuth(sessionStorage.getItem(AUTH_KEY) === '1');
  render();
}

function bindEvents() {
  el.loginBtn.addEventListener('click', handleLogin);
  el.passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  if (el.logoutBtn) el.logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    toggleAuth(false);
  });

  if (el.addListBtn) el.addListBtn.addEventListener('click', () => openListModal());
  if (el.openCreateItemBtn) el.openCreateItemBtn.addEventListener('click', () => openItemModal());
  if (el.topbarAddItemBtn) el.topbarAddItemBtn.addEventListener('click', () => openItemModal());
  if (el.toggleFiltersBtn) el.toggleFiltersBtn.addEventListener('click', toggleFiltersPanel);
  if (el.closeFiltersBtn) el.closeFiltersBtn.addEventListener('click', closeFiltersPanel);
  el.closeItemModalBtn.addEventListener('click', closeItemModal);
  el.closeListModalBtn.addEventListener('click', closeListModal);
  el.saveItemBtn.addEventListener('click', saveItemFromModal);
  el.deleteItemBtn.addEventListener('click', deleteEditingItem);
  el.saveListBtn.addEventListener('click', saveListFromModal);
  el.deleteListBtn.addEventListener('click', deleteEditingList);

  el.searchInput.addEventListener('input', renderCards);
  el.filterCategory.addEventListener('change', () => {
    syncSubcategoryOptions();
    renderCards();
  });
  el.filterSubcategory.addEventListener('change', renderCards);
  el.filterStatus.addEventListener('change', renderCards);
  el.sortSelect.addEventListener('change', renderCards);
  el.clearDoneFilterBtn.addEventListener('click', () => {
    el.filterStatus.value = 'all';
    el.filterCategory.value = '';
    syncSubcategoryOptions();
    el.filterSubcategory.value = '';
    el.searchInput.value = '';
    renderCards();
  });

  el.exportBtn.addEventListener('click', exportJsonFile);
  el.importBtn.addEventListener('click', () => el.importFileInput.click());
  el.importFileInput.addEventListener('change', importJsonFile);

  el.saveGithubBtn.addEventListener('click', saveToGithub);
  el.loadGithubBtn.addEventListener('click', loadFromGithub);
  if (el.ghToken) {
    el.ghToken.addEventListener('input', persistGithubSettingsFromForm);
  }

  [el.itemModal, el.listModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (modal === el.itemModal) closeItemModal();
        if (modal === el.listModal) closeListModal();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeItemModal();
      closeListModal();
      closeAllDropdowns();
      closeFiltersPanel();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) closeAllDropdowns();
    if (!e.target.closest('.custom-select')) document.querySelectorAll('.custom-select.is-open').forEach(closeCustomSelect);
  });

  document.querySelectorAll('[data-dropdown-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menuId = btn.dataset.dropdownToggle;
      toggleDropdown(menuId, btn);
    });
  });
}



function toggleFiltersPanel() {
  if (!el.filtersPanel) return;
  const willOpen = el.filtersPanel.classList.contains('hidden');
  if (willOpen) {
    openFiltersPanel();
  } else {
    closeFiltersPanel();
  }
}

function openFiltersPanel() {
  if (!el.filtersPanel) return;
  el.filtersPanel.classList.remove('hidden');
  if (el.toggleFiltersBtn) el.toggleFiltersBtn.classList.add('is-active');
}

function closeFiltersPanel() {
  if (!el.filtersPanel) return;
  el.filtersPanel.classList.add('hidden');
  if (el.toggleFiltersBtn) el.toggleFiltersBtn.classList.remove('is-active');
}

function initCustomSelects() {
  document.querySelectorAll('.custom-select').forEach(setupCustomSelect);
}

function setupCustomSelect(wrapper) {
  const select = wrapper.querySelector('select');
  if (!select) return;

  let trigger = wrapper.querySelector('.custom-select-trigger');
  let menu = wrapper.querySelector('.custom-select-menu');

  if (!trigger) {
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.innerHTML = `
      <span class="custom-select-label"></span>
      <svg class="select-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    `;
    wrapper.appendChild(trigger);
  }

  if (!menu) {
    menu = document.createElement('div');
    menu.className = 'custom-select-menu glass hidden';
    menu.setAttribute('role', 'listbox');
    wrapper.appendChild(menu);
  }

  function renderCustomSelectOptions() {
    const selectedOption = select.options[select.selectedIndex];
    trigger.querySelector('.custom-select-label').textContent = selectedOption ? selectedOption.textContent : 'Выбрать';
    menu.innerHTML = '';
    Array.from(select.options).forEach((option, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'custom-select-option';
      if (option.selected) btn.classList.add('is-selected');
      btn.setAttribute('role', 'option');
      btn.dataset.value = option.value;
      btn.dataset.index = String(index);
      btn.innerHTML = `
        <span>${escapeHtml(option.textContent)}</span>
        ${option.selected ? '<span class="custom-select-option-mark"></span>' : ''}
      `;
      btn.addEventListener('click', () => {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        closeCustomSelect(wrapper);
      });
      menu.appendChild(btn);
    });
  }

  renderCustomSelectOptions();

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = wrapper.classList.contains('is-open');
    closeAllDropdowns();
    document.querySelectorAll('.custom-select.is-open').forEach(closeCustomSelect);
    if (!isOpen) openCustomSelect(wrapper);
  });

  select.addEventListener('change', () => {
    renderCustomSelectOptions();
  });

  wrapper._renderCustomSelectOptions = renderCustomSelectOptions;
}

function openCustomSelect(wrapper) {
  wrapper.classList.add('is-open');
  const menu = wrapper.querySelector('.custom-select-menu');
  if (menu) menu.classList.remove('hidden');
}

function closeCustomSelect(wrapper) {
  wrapper.classList.remove('is-open');
  const menu = wrapper.querySelector('.custom-select-menu');
  if (menu) menu.classList.add('hidden');
}

function refreshCustomSelect(selectOrId) {
  const select = typeof selectOrId === 'string' ? document.getElementById(selectOrId) : selectOrId;
  if (!select) return;
  const wrapper = select.closest('.custom-select');
  if (wrapper && typeof wrapper._renderCustomSelectOptions === 'function') {
    wrapper._renderCustomSelectOptions();
  }
}

async function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.lists?.length) return parsed;
    }
  } catch {}

  try {
    const response = await fetch(DEFAULT_DATA_PATH, { cache: 'no-store' });
    if (response.ok) {
      const parsed = await response.json();
      if (parsed?.lists?.length) return parsed;
    }
  } catch {}

  return createFallbackDefaultData();
}

function createFallbackDefaultData() {
  const homeId = crypto.randomUUID();
  const autoId = crypto.randomUUID();
  const now = new Date().toISOString();
  return {
    version: 3,
    currentListId: autoId,
    lists: [
      {
        id: homeId,
        name: 'Дом',
        createdAt: now,
        items: []
      },
      {
        id: autoId,
        name: 'Автомобиль',
        createdAt: now,
        items: [
          {
            id: crypto.randomUUID(),
            title: 'Пример: задние амортизаторы',
            category: 'Подвеска',
            subcategory: 'Задняя подвеска',
            price: '12 500 ₽',
            platform: 'Exist',
            image: '',
            buyUrl: 'https://example.com',
            note: 'Тестовая карточка. Ее можно отредактировать или удалить.',
            done: false,
            createdAt: now,
            updatedAt: now,
            order: 0
          }
        ]
      }
    ]
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeState() {
  if (!state || typeof state !== 'object') state = createFallbackDefaultData();
  if (!Array.isArray(state.lists)) state.lists = [];
  state.version = 3;

  state.lists.forEach((list) => {
    if (!list.id) list.id = crypto.randomUUID();
    if (!list.name) list.name = 'Без названия';
    if (!Array.isArray(list.items)) list.items = [];
    list.items.forEach((item, index) => {
      if (!item.id) item.id = crypto.randomUUID();
      item.title = item.title || 'Без названия';
      item.category = item.category || '';
      item.subcategory = item.subcategory || '';
      item.price = item.price || '';
      item.platform = item.platform || '';
      item.image = item.image || '';
      item.buyUrl = item.buyUrl || '';
      item.note = item.note || '';
      item.done = Boolean(item.done);
      item.createdAt = item.createdAt || new Date().toISOString();
      item.updatedAt = item.updatedAt || item.createdAt;
      if (typeof item.order !== 'number') item.order = index;
    });
    list.items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    reindexOrders(list);
  });

  if (!state.currentListId || !state.lists.some(list => list.id === state.currentListId)) {
    state.currentListId = state.lists[0]?.id || null;
  }
  saveState();
}

function handleLogin() {
  if (el.passwordInput.value === SIMPLE_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, '1');
    el.loginMessage.textContent = '';
    toggleAuth(true);
  } else {
    el.loginMessage.textContent = 'Неверный пароль';
  }
}

function toggleAuth(isAuthed) {
  el.loginScreen.classList.toggle('hidden', isAuthed);
  el.app.classList.toggle('hidden', !isAuthed);
  if (isAuthed) {
    setTimeout(() => {
      if (getCurrentList()) el.searchInput.focus();
      else el.addListBtn.focus();
    }, 50);
  } else {
    el.passwordInput.value = '';
    setTimeout(() => el.passwordInput.focus(), 50);
  }
}

function loadGithubSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { token: parsed?.token || '' };
  } catch {
    return { token: '' };
  }
}

function persistGithubSettingsFromForm() {
  githubSettings = { token: el.ghToken.value.trim() };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(githubSettings));
  setSyncMessage('GitHub token сохранён на этом устройстве.', 'helper');
}

function applyGithubSettingsToForm() {
  el.ghToken.value = githubSettings.token || '';
}

function getCurrentList() {
  return state.lists.find(list => list.id === state.currentListId) || state.lists[0] || null;
}

function render() {
  renderLists();
  renderHeader();
  renderFilters();
  refreshCustomSelect(el.sortSelect);
  renderCards();
}

function renderLists() {
  el.listsContainer.innerHTML = '';
  if (!state.lists.length) {
    el.listsContainer.innerHTML = '<div class="empty">Списков пока нет</div>';
    return;
  }

  state.lists.forEach((list) => {
    const doneCount = list.items.filter(item => item.done).length;
    const menuId = `list-menu-${list.id}`;
    const node = document.createElement('div');
    node.className = `list-item ${list.id === state.currentListId ? 'active' : ''}`;
    node.innerHTML = `
      <div class="list-item-head">
        <div class="list-item-title">${escapeHtml(list.name)}</div>
        <div class="dropdown">
          <button class="menu-trigger" aria-label="Меню списка" data-title="Меню списка" data-dropdown-toggle="${menuId}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5h.01M12 12h.01M12 19h.01"/></svg>
          </button>
          <div id="${menuId}" class="dropdown-menu glass hidden" data-align="left" role="menu">
            <button class="dropdown-item" data-action="edit" data-title="Изменить список" role="menuitem">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
              <span>Изменить список</span>
            </button>
            <button class="dropdown-item is-danger" data-action="remove" data-title="Удалить список" role="menuitem">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"/></svg>
              <span>Удалить список</span>
            </button>
          </div>
        </div>
      </div>
      <div class="row">
        <span class="badge">${list.items.length} шт.</span>
        <span class="badge success">Куплено: ${doneCount}</span>
      </div>
    `;

    node.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      state.currentListId = list.id;
      saveState();
      render();
    });

    const menuBtn = node.querySelector(`[data-dropdown-toggle="${menuId}"]`);
    const editBtn = node.querySelector('[data-action="edit"]');
    const removeBtn = node.querySelector('[data-action="remove"]');

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown(menuId, menuBtn);
    });
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDropdowns();
      openListModal(list.id);
    });
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDropdowns();
      deleteList(list.id);
    });

    el.listsContainer.appendChild(node);
  });
}

function renderHeader() {
  const list = getCurrentList();
  if (!list) {
    el.currentListTitle.textContent = 'Список не выбран';
    el.currentListMeta.textContent = 'Создай список слева и начни добавлять товары.';
    el.countBadge.textContent = '0 товаров';
    el.doneBadge.textContent = 'Куплено: 0';
    el.priceBadge.textContent = 'Сумма: —';
    return;
  }

  const total = list.items.reduce((sum, item) => sum + parsePrice(item.price), 0);
  const doneCount = list.items.filter(item => item.done).length;
  const categoriesCount = collectCategories(list.items).length;
  el.currentListTitle.textContent = list.name;
  el.currentListMeta.textContent = `${list.items.length} карточек • ${categoriesCount} категорий • ${doneCount} куплено`;
  el.countBadge.textContent = `${list.items.length} товаров`;
  el.doneBadge.textContent = `Куплено: ${doneCount}`;
  el.priceBadge.textContent = `Сумма: ${total ? formatMoney(total) : '—'}`;
}

function renderFilters() {
  const list = getCurrentList();
  const categories = collectCategories(list?.items || []);
  const currentCategory = el.filterCategory.value;
  el.filterCategory.innerHTML = '<option value="">Все категории</option>';
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    el.filterCategory.appendChild(option);
  });
  el.filterCategory.value = categories.includes(currentCategory) ? currentCategory : '';
  refreshCustomSelect(el.filterCategory);
  syncSubcategoryOptions();
}

function syncSubcategoryOptions() {
  const list = getCurrentList();
  const category = el.filterCategory.value;
  const subcategories = collectSubcategories(list?.items || [], category);
  const currentSubcategory = el.filterSubcategory.value;
  el.filterSubcategory.innerHTML = '<option value="">Все подкатегории</option>';
  subcategories.forEach((subcategory) => {
    const option = document.createElement('option');
    option.value = subcategory;
    option.textContent = subcategory;
    el.filterSubcategory.appendChild(option);
  });
  el.filterSubcategory.value = subcategories.includes(currentSubcategory) ? currentSubcategory : '';
  refreshCustomSelect(el.filterSubcategory);
}

function getFilteredItems(list) {
  const query = el.searchInput.value.trim().toLowerCase();
  const category = el.filterCategory.value;
  const subcategory = el.filterSubcategory.value;
  const status = el.filterStatus.value;
  const sortMode = el.sortSelect.value;

  let items = list.items.filter((item) => {
    const matchesCategory = !category || item.category === category;
    const matchesSubcategory = !subcategory || item.subcategory === subcategory;
    const matchesStatus = status === 'all' || (status === 'done' ? item.done : !item.done);
    const hay = [item.title, item.category, item.subcategory, item.platform, item.note].join(' ').toLowerCase();
    const matchesSearch = !query || hay.includes(query);
    return matchesCategory && matchesSubcategory && matchesStatus && matchesSearch;
  });

  items = [...items];
  switch (sortMode) {
    case 'newest':
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'oldest':
      items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'title':
      items.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
      break;
    case 'priceAsc':
      items.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      break;
    case 'priceDesc':
      items.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      break;
    default:
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      break;
  }
  return items;
}

function renderCards() {
  const list = getCurrentList();
  el.cardsSection.innerHTML = '';
  if (!list) {
    el.cardsSection.innerHTML = '<div class="empty">Нет активного списка</div>';
    return;
  }

  const items = getFilteredItems(list);
  if (!items.length) {
    el.cardsSection.innerHTML = '<div class="empty">По этому фильтру ничего не найдено</div>';
    return;
  }

  items.forEach((item) => {
    const menuId = `item-menu-${item.id}`;
    const card = document.createElement('article');
    card.className = `card ${item.done ? 'is-done' : ''}`;
    card.draggable = el.sortSelect.value === 'manual';
    card.dataset.id = item.id;
    card.innerHTML = `
      <div class="card-menu-wrap dropdown">
        <button class="menu-trigger" aria-label="Меню товара" data-title="Меню товара" data-dropdown-toggle="${menuId}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5h.01M12 12h.01M12 19h.01"/></svg>
        </button>
        <div id="${menuId}" class="dropdown-menu glass hidden" role="menu">
          <button class="dropdown-item" data-action="edit" data-title="Изменить список" role="menuitem">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
            <span>Изменить карточку</span>
          </button>
          <button class="dropdown-item is-danger" data-action="delete" data-title="Удалить товар" role="menuitem">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"/></svg>
            <span>Удалить карточку</span>
          </button>
        </div>
      </div>
      <div class="card-inner">
        <div class="card-image">
          ${item.image
            ? `<img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.title)}" onerror="this.parentNode.innerHTML='<div class=&quot;img-placeholder&quot;>Фото недоступно</div>'">`
            : '<div class="img-placeholder">Нет фото</div>'}
        </div>
        <div class="card-body">
          <div class="card-top">
            <div class="card-title">
              <span class="card-title-text ${item.done ? 'done' : ''}">${escapeHtml(item.title)}</span>
              <span class="badge">↕</span>
            </div>
            <div class="inline-actions">
              ${item.category ? `<span class="meta-chip">${escapeHtml(item.category)}</span>` : ''}
              ${item.subcategory ? `<span class="meta-chip">${escapeHtml(item.subcategory)}</span>` : ''}
              ${item.platform ? `<span class="meta-chip">${escapeHtml(item.platform)}</span>` : ''}
              ${item.done ? `<span class="meta-chip success">Куплено</span>` : ''}
            </div>
          </div>

          <div class="price ${item.done ? 'done' : ''}">${escapeHtml(item.price || '—')}</div>
          ${item.note ? `<div class="muted">${escapeHtml(item.note)}</div>` : ''}

          <label class="done-line"><input type="checkbox" data-action="toggle-done" ${item.done ? 'checked' : ''} /> Уже куплено</label>

          <div class="inline-actions">
            ${item.buyUrl ? `<a class="buy-link" data-title="Открыть товар" href="${escapeAttribute(item.buyUrl)}" target="_blank" rel="noopener noreferrer"><button class="btn-small btn-primary" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>Открыть товар</button></a>` : ''}
          </div>
        </div>
      </div>
    `;

    const menuBtn = card.querySelector(`[data-dropdown-toggle="${menuId}"]`);
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown(menuId, menuBtn);
    });
    card.querySelector('[data-action="edit"]').addEventListener('click', () => {
      closeAllDropdowns();
      openItemModal(item.id);
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      closeAllDropdowns();
      deleteItem(item.id);
    });
    card.querySelector('[data-action="toggle-done"]').addEventListener('change', (e) => toggleItemDone(item.id, e.target.checked));

    if (el.sortSelect.value === 'manual') {
      card.addEventListener('dragstart', () => {
        dragItemId = item.id;
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => {
        dragItemId = null;
        card.classList.remove('dragging');
        card.classList.remove('drag-over');
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (dragItemId && dragItemId !== item.id) card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (!dragItemId || dragItemId === item.id) return;
        moveItemBefore(dragItemId, item.id);
      });
    }

    el.cardsSection.appendChild(card);
  });
}

function openItemModal(itemId = null) {
  const list = getCurrentList();
  if (!list) {
    alert('Сначала создай список.');
    return;
  }
  editingItem = itemId;
  const item = itemId ? list.items.find(x => x.id === itemId) : null;
  el.itemModalTitle.textContent = item ? 'Изменить товар' : 'Новый товар';
  el.itemTitle.value = item?.title || '';
  el.itemPrice.value = item?.price || '';
  el.itemCategory.value = item?.category || '';
  el.itemSubcategory.value = item?.subcategory || '';
  el.itemPlatform.value = item?.platform || '';
  el.itemBuyUrl.value = item?.buyUrl || '';
  el.itemImage.value = item?.image || '';
  el.itemNote.value = item?.note || '';
  el.itemDone.checked = Boolean(item?.done);
  el.deleteItemBtn.classList.toggle('hidden', !item);
  el.itemModal.classList.remove('hidden');
  setTimeout(() => el.itemTitle.focus(), 50);
}

function closeItemModal() {
  el.itemModal.classList.add('hidden');
  editingItem = null;
}

function saveItemFromModal() {
  const list = getCurrentList();
  if (!list) return;
  const title = el.itemTitle.value.trim();
  if (!title) {
    alert('Заполни название товара.');
    el.itemTitle.focus();
    return;
  }

  const payload = {
    title,
    price: el.itemPrice.value.trim(),
    category: el.itemCategory.value.trim(),
    subcategory: el.itemSubcategory.value.trim(),
    platform: el.itemPlatform.value.trim(),
    buyUrl: el.itemBuyUrl.value.trim(),
    image: el.itemImage.value.trim(),
    note: el.itemNote.value.trim(),
    done: el.itemDone.checked,
    updatedAt: new Date().toISOString()
  };

  if (editingItem) {
    const item = list.items.find(x => x.id === editingItem);
    if (!item) return;
    Object.assign(item, payload);
  } else {
    list.items.unshift({
      id: crypto.randomUUID(),
      ...payload,
      createdAt: new Date().toISOString(),
      order: -1
    });
    reindexOrders(list);
  }

  saveState();
  render();
  closeItemModal();
}

function deleteEditingItem() {
  if (!editingItem) return;
  deleteItem(editingItem);
  closeItemModal();
}

function deleteItem(itemId) {
  const list = getCurrentList();
  if (!list) return;
  const item = list.items.find(x => x.id === itemId);
  if (!item) return;
  if (!confirm(`Удалить товар «${item.title}»?`)) return;
  list.items = list.items.filter(x => x.id !== itemId);
  reindexOrders(list);
  saveState();
  render();
}

function toggleItemDone(itemId, done) {
  const list = getCurrentList();
  const item = list?.items.find(x => x.id === itemId);
  if (!item) return;
  item.done = Boolean(done);
  item.updatedAt = new Date().toISOString();
  saveState();
  render();
}

function openListModal(listId = null) {
  editingListId = listId;
  const list = listId ? state.lists.find(x => x.id === listId) : null;
  el.listModalTitle.textContent = list ? 'Изменить список' : 'Новый список';
  el.listNameInput.value = list?.name || '';
  el.deleteListBtn.classList.toggle('hidden', !list);
  el.listModal.classList.remove('hidden');
  setTimeout(() => el.listNameInput.focus(), 50);
}

function closeListModal() {
  el.listModal.classList.add('hidden');
  editingListId = null;
}

function saveListFromModal() {
  const name = el.listNameInput.value.trim();
  if (!name) {
    alert('Укажи название списка.');
    el.listNameInput.focus();
    return;
  }

  if (editingListId) {
    const list = state.lists.find(x => x.id === editingListId);
    if (!list) return;
    list.name = name;
  } else {
    const list = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      items: []
    };
    state.lists.unshift(list);
    state.currentListId = list.id;
  }
  saveState();
  render();
  closeListModal();
}

function deleteEditingList() {
  if (!editingListId) return;
  deleteList(editingListId);
  closeListModal();
}

function deleteList(listId) {
  const list = state.lists.find(x => x.id === listId);
  if (!list) return;
  if (!confirm(`Удалить список «${list.name}» вместе со всеми товарами?`)) return;
  state.lists = state.lists.filter(x => x.id !== listId);
  state.currentListId = state.lists[0]?.id || null;
  saveState();
  render();
}

function moveItemBefore(sourceId, targetId) {
  const list = getCurrentList();
  if (!list) return;
  const sourceIndex = list.items.findIndex(item => item.id === sourceId);
  const targetIndex = list.items.findIndex(item => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
  const [moved] = list.items.splice(sourceIndex, 1);
  const nextTargetIndex = list.items.findIndex(item => item.id === targetId);
  list.items.splice(nextTargetIndex, 0, moved);
  reindexOrders(list);
  saveState();
  renderCards();
  renderHeader();
}

function reindexOrders(list) {
  list.items.forEach((item, index) => {
    item.order = index;
  });
}

function collectCategories(items) {
  return [...new Set(items.map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
}

function collectSubcategories(items, category = '') {
  return [...new Set(
    items
      .filter(item => !category || item.category === category)
      .map(item => item.subcategory)
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'ru'));
}

function parsePrice(value) {
  if (!value) return 0;
  const normalized = String(value)
    .replace(/\s/g, '')
    .replace(/,/g, '.')
    .match(/[\d.]+/g);
  if (!normalized) return 0;
  return Number(normalized.join('')) || 0;
}

function formatMoney(value) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₽';
}

function exportJsonFile() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `polihov-products-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setSyncMessage('JSON экспортирован в файл.', 'success');
}

async function importJsonFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed?.lists || !Array.isArray(parsed.lists)) {
      throw new Error('У файла неверная структура. Нужен JSON со списками.');
    }
    if (!confirm('Заменить текущие локальные данные данными из файла?')) {
      event.target.value = '';
      return;
    }
    state = parsed;
    normalizeState();
    saveState();
    render();
    setSyncMessage('JSON импортирован из файла.', 'success');
  } catch (error) {
    console.error(error);
    setSyncMessage(error.message || 'Ошибка импорта JSON.', 'error');
  } finally {
    event.target.value = '';
  }
}

function setSyncMessage(message, type = 'helper') {
  el.syncMessage.className = type;
  el.syncMessage.textContent = message;
}

async function githubRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${githubSettings.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let details = '';
    try {
      const data = await response.json();
      details = data.message || '';
    } catch {}
    throw new Error(`GitHub API: ${response.status} ${details}`.trim());
  }
  return response.json();
}

function validateGithubSettings() {
  persistGithubSettingsFromForm();
  if (!githubSettings.token) {
    throw new Error('Введи GitHub token.');
  }
}



async function saveToGithub() {
  try {
    validateGithubSettings();
    setSyncMessage('Сохранение в GitHub...', 'helper');
    const base = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(GITHUB_DATA_PATH).replace(/%2F/g, '/')}`;
    let sha;
    try {
      const existing = await githubRequest(`${base}?ref=${encodeURIComponent(GITHUB_BRANCH)}`);
      sha = existing.sha;
    } catch (error) {
      if (!String(error.message).includes('404')) throw error;
    }
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(state, null, 2))));
    await githubRequest(base, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'Update products data from GitHub Pages',
        content,
        branch: GITHUB_BRANCH,
        sha
      })
    });
    setSyncMessage('Готово. JSON сохранен в репозиторий.', 'success');
  } catch (error) {
    console.error(error);
    setSyncMessage(error.message || 'Ошибка сохранения в GitHub.', 'error');
  }
}

async function loadFromGithub() {
  try {
    validateGithubSettings();
    setSyncMessage('Загрузка из GitHub...', 'helper');
    const base = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(GITHUB_DATA_PATH).replace(/%2F/g, '/')}`;
    const file = await githubRequest(`${base}?ref=${encodeURIComponent(GITHUB_BRANCH)}`);
    if (!file.content) throw new Error('Файл найден, но содержимое пустое.');
    const decoded = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));
    const parsed = JSON.parse(decoded);
    if (!parsed?.lists || !Array.isArray(parsed.lists)) throw new Error('JSON имеет неверную структуру.');
    state = parsed;
    normalizeState();
    saveState();
    render();
    setSyncMessage('Готово. Данные загружены из GitHub.', 'success');
  } catch (error) {
    console.error(error);
    setSyncMessage(error.message || 'Ошибка загрузки из GitHub.', 'error');
  }
}

function toggleDropdown(menuId, triggerBtn) {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  const isOpen = !menu.classList.contains('hidden');
  closeAllDropdowns();
  if (!isOpen) {
    menu.classList.remove('hidden');
    triggerBtn.classList.add('is-open');
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach((menu) => menu.classList.add('hidden'));
  document.querySelectorAll('.dropdown-toggle, .menu-trigger').forEach((btn) => btn.classList.remove('is-open'));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
