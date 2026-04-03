# POLIHOV / ТОВАРЫ

Структура проекта:

- `index.html` — разметка
- `assets/styles.css` — стили
- `assets/app.js` — логика
- `data/items.json` — стартовый JSON

## Что менять

### Пароль
В `assets/app.js`:
```js
const SIMPLE_PASSWORD = '1234';
```

### GitHub Pages
Подходит для размещения на GitHub Pages, например:
`https://полихов.рф/товары/`

### JSON
При первом запуске сайт берёт данные из `data/items.json`.
Дальше изменения сохраняются в `localStorage`.
Также можно импортировать/экспортировать JSON и синхронизировать его через GitHub API.

## Что добавлено
- разнесение по отдельным файлам
- SVG-иконки в шапке вместо текста
- кастомные dropdown-меню у списков, карточек и GitHub-действий
- стилизованный scrollbar в POLIHOV STYLE
