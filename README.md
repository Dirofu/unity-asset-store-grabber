# Unity Asset Store Grabber

<p align="center">
  <img src="icons/icon128.png" alt="Unity Asset Store Grabber" width="128">
</p>

<p align="center">
  <b>One-click grab for free Unity Asset Store assets</b><br>
  <i>No more navigating to each asset page — grab directly from search results</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/manifest-v3-blue" alt="Manifest V3">
  <img src="https://img.shields.io/badge/chrome-compatible-brightgreen" alt="Chrome Compatible">
  <img src="https://img.shields.io/badge/yandex-compatible-brightgreen" alt="Yandex Compatible">
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="MIT License">
</p>

---

## Features

- **One-click grab** — adds a `Grab` button to every free asset card on search/category pages

https://github.com/user-attachments/assets/17b85a6e-9453-4990-9481-63b6f20f1362

- **Grab All** — floating button to grab all visible free assets at once

https://github.com/user-attachments/assets/f679633e-56d7-4d08-8e6a-044368cd1a85
  
- **Visual feedback** — button states: ready → loading → success / error
- **SPA-aware** — works with pagination, filters, and navigation without page reload
- **Lightweight** — no dependencies, pure vanilla JS, Manifest V3

## How It Works

The extension injects a `Grab` button into each free asset card on the Unity Asset Store. When clicked, it sends a GraphQL mutation (`AddToDownload`) to the Asset Store API — the same request the official "Add to My Assets" button makes on the asset detail page. Your browser cookies handle authentication automatically.

## Installation

1. Download or clone this repository
2. Open `chrome://extensions` (or `browser://extensions` in Yandex Browser)
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the project folder
5. Navigate to [Unity Asset Store](https://assetstore.unity.com) and start grabbing

## Usage

| Action | Description |
|--------|-------------|
| **Grab** | Click the blue button on any free asset card to add it to your library |
| **Grab All Free (N)** | Click the purple floating button (bottom-right) to grab all visible free assets sequentially |

### Button States

| State | Color | Meaning |
|-------|-------|---------|
| `Grab` | Blue | Ready to grab |
| `...` | Yellow | Request in progress |
| `Done` | Green | Successfully added to library |
| `Error` | Red | Failed (hover for details, retries in 3s) |

> **Note:** You must be logged in to your Unity account on [assetstore.unity.com](https://assetstore.unity.com) for the extension to work.

## Project Structure

```
unitystore-grabber/
├── manifest.json      # Extension config (Manifest V3)
├── content.js         # Core logic: card detection, button injection, GraphQL API
├── styles.css         # Grab button and Grab All button styles
├── background.js      # Service worker for badge updates
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Technical Details

- **API endpoint:** `POST https://assetstore.unity.com/api/graphql`
- **Mutation:** `AddToDownload(id: $id)`
- **Auth:** session cookies (`kharma_session`) + CSRF token (`_csrf` cookie)
- **Card detection:** `<article>` elements with `a[data-test="product-card-name"]`
- **Rate limiting:** 600ms delay between sequential grabs in "Grab All" mode

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No buttons appear | Open DevTools Console (F12) and check for `[USG]` logs. Make sure you're on `assetstore.unity.com` |
| "Error" on click | You may not be logged in — check for `_csrf` cookie in DevTools → Application → Cookies |
| Buttons appear on some cards only | The card might already be owned or the asset isn't free |
| Extension not visible | Go to `chrome://extensions`, verify it's enabled and has no errors |

## License

MIT

---

---

# Unity Asset Store Grabber (RU)

<p align="center">
  <b>Добавляйте бесплатные ассеты из Unity Asset Store в один клик</b><br>
  <i>Без перехода на страницу каждого ассета — забирайте прямо из результатов поиска</i>
</p>

---

## Возможности

- **Один клик** — кнопка `Grab` на каждой карточке бесплатного ассета в результатах поиска
- **Grab All** — плавающая кнопка для захвата всех видимых бесплатных ассетов разом
- **Визуальная обратная связь** — состояния кнопки: готов → загрузка → успех / ошибка
- **Работает с SPA** — подхватывает новые карточки при пагинации, смене фильтров и навигации
- **Легковесное** — без зависимостей, чистый JS, Manifest V3

## Как это работает

Расширение добавляет кнопку `Grab` на карточки бесплатных ассетов в Unity Asset Store. При нажатии отправляется GraphQL-запрос (`AddToDownload`) к API магазина — тот же запрос, что отправляет официальная кнопка "Add to My Assets" на странице ассета. Авторизация происходит автоматически через cookies браузера.

## Установка

1. Скачайте или клонируйте этот репозиторий
2. Откройте `chrome://extensions` (или `browser://extensions` в Яндекс Браузере)
3. Включите **Режим разработчика** (переключатель в правом верхнем углу)
4. Нажмите **Загрузить распакованное расширение** и выберите папку проекта
5. Перейдите на [Unity Asset Store](https://assetstore.unity.com) и начинайте забирать ассеты

## Использование

| Действие | Описание |
|----------|----------|
| **Grab** | Нажмите синюю кнопку на карточке бесплатного ассета — он добавится в вашу библиотеку |
| **Grab All Free (N)** | Нажмите фиолетовую кнопку в правом нижнем углу — последовательно заберёт все видимые бесплатные ассеты |

### Состояния кнопки

| Состояние | Цвет | Значение |
|-----------|------|----------|
| `Grab` | Синий | Готова к захвату |
| `...` | Жёлтый | Запрос выполняется |
| `Done` | Зелёный | Ассет добавлен в библиотеку |
| `Error` | Красный | Ошибка (наведите для деталей, повтор через 3 сек) |

> **Важно:** Вы должны быть авторизованы на [assetstore.unity.com](https://assetstore.unity.com) для работы расширения.

## Решение проблем

| Проблема | Решение |
|----------|---------|
| Кнопки не появляются | Откройте DevTools (F12) → Console и проверьте логи `[USG]`. Убедитесь что вы на `assetstore.unity.com` |
| Ошибка при нажатии | Возможно вы не авторизованы — проверьте cookie `_csrf` в DevTools → Application → Cookies |
| Кнопки есть не на всех карточках | Ассет может быть уже в библиотеке или не является бесплатным |
| Расширение не отображается | Откройте `chrome://extensions`, проверьте что оно включено и без ошибок |

## Лицензия

MIT
