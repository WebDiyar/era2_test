# ERA2 — Очередь генераций

Экран **«Очередь генераций»** с «живым» мок-движком: задачи сами двигаются по статусам,
прогресс растёт, часть падает с ошибкой. Бэкенда нет — всё эмулируется на клиенте.

## Запуск (npm)

```bash
npm install
npm run dev      # http://localhost:8080  → открыть /queue
npm run build    # production-сборка
npm test         # юнит-тесты (vitest)
npm run lint     # eslint
```

> В `package.json` указан `packageManager: yarn@4`. Если используете yarn — включите corepack
> (`corepack enable`); линкер — `node-modules` (см. `.yarnrc.yml`). С npm всё работает из коробки.

Шрифт — **Geist / Geist Mono** (`@fontsource-variable/*`).

## Где что (FSD)

```
entities/generation-task    # типы домена (types.ts) + стартовый сид (seed.ts)
features/generation-queue
  model/
    queueReducer.ts          # конечный автомат статусов (чистый редьюсер)
    queueEngine.ts           # мок-движок: слоты, тики, сбои, чистка таймеров
    selectors.ts             # счётчики, фильтр/сортировка/поиск, FIFO, позиции
    QueueProvider.tsx        # Context + useReducer, загрузка, персист
    useQueue.ts              # публичный хук состояния/действий
  ui/
    TaskList.tsx             # выбор режима рендера: виртуализация / drag / анимация
    TaskRow / TaskCard       # строка (desktop) / карточка (mobile)
    TaskActions, StatusBadge, ProgressBar, QueueStats, QueueToolbar
    GenerationStatusBar.tsx  # глобальный плавающий индикатор
    states/                  # Empty / Loading / Error
  lib/                       # constants, formatEta, storage, stress
widgets/generation-queue     # композиция экрана
pages/QueuePage.tsx          # тонкая страница
```

Публичный API слайса — только `index.ts`, импорты без deep-import.

## Мок-движок

- **Лимит** `MAX_CONCURRENT = 2`: одновременно не больше двух `running`, слот освободился — берём
  следующую `queued`. Логика вынесена в чистую `selectNextToStart(tasks, max)` (покрыта тестами).
- **Прогресс** растёт тиками (`setInterval`), скорость зависит от типа: video/audio медленнее text/image
  (`TYPE_SPEED` в `constants.ts`).
- **Сбои** ~15% (`FAIL_RATE`) с понятным текстом ошибки.
- **Чистка ресурсов**: таймеры снимаются при `cancel`/`done`/`fail`/смене фазы и при размонтировании —
  без «дотиков». Движок только диспатчит экшены, состояние не мутирует (единый источник правды — редьюсер).

## Принятые решения

- **Рехидрация:** при загрузке из `localStorage` задачи в `running` переводятся в `queued`
  (прогресс сохраняется) — движок продолжит их с учётом лимита слотов. См. `lib/storage.ts`.
- **Роутинг:** лёгкий собственный роутер (`shared/routing`, history API). Индикатор и клик
  «Открыть очередь» ведут на `/queue`.
- **Единый источник правды** для очереди и статус-бара — один стор (`QueueProvider`); счётчики и
  прогресс всегда совпадают.
- **Порядок очереди = порядок `queued` в массиве `tasks`.** На нём держатся FIFO, «позиция N» и
  drag-reorder (а не на `createdAt`). Сортировка `newest/oldest/progress` влияет только на отображение
  остальных вкладок.
- **Тема:** дизайн-система содержит оба набора токенов (светлый «warm beige» / тёмный «warm coal»).
  Переключатель — в шапке. Компоненты очереди используют семантические токены и корректны в обеих темах.

## Бонусы (пункт 6 ТЗ)

| Бонус | Где |
|---|---|
| **Юнит-тесты** движка/редьюсера (переходы, лимит слотов) | `model/queueReducer.test.ts`, `model/selectors.test.ts` (36 тестов) |
| **Optimistic UI + Undo** | мгновенное обновление + тост «Отменить» на удаление / «очистить готовые» / отмену (`widgets/.../GenerationQueue.tsx`, sonner) |
| **Виртуализация** (≈1000 задач) | `ui/TaskList.tsx` (`@tanstack/react-virtual`); включается при `> VIRTUALIZE_THRESHOLD` строк. Кнопка **«+1000 (демо)»** в шапке добавляет пачку для проверки |
| **Drag-to-reorder** для `queued` | вкладка **«В очереди»**: перетаскивание за ручку (`framer-motion` `Reorder` + `dragControls`), а также **клавиатура** (стрелки ↑/↓ на ручке и пункты меню «Выше/Ниже в очереди») |
| **Доступность** | `role`/`aria` (progressbar, aria-pressed на чипах, aria-label на действиях), видимый focus-ring, клавиатурная перестановка очереди, `prefers-reduced-motion` (глобальный CSS + `MotionConfig reducedMotion="user"`) |
| **Анимации** появления/удаления | `framer-motion` `AnimatePresence` + `layout` в `TaskList`; плавное появление/скрытие статус-бара |
| **Светлая тема** | оба набора токенов в дизайн-системе; компоненты очереди адаптированы |
| **Фильтр по типу** (§4.3, бонус) | дропдаун «Тип» в тулбаре (текст/изображение/видео/аудио); `selectVisible` фильтрует по `type` |

### Как взаимодействуют виртуализация, drag и анимации

- Список **≤ `VIRTUALIZE_THRESHOLD`** строк: обычный DOM с `AnimatePresence` (плавные enter/exit),
  а на вкладке «В очереди» — `Reorder` с drag.
- Список **больше порога** (например, после «+1000»): виртуализация (окно строк). Здесь enter/exit-анимации
  и drag отключены ради производительности — это осознанный компромисс; клавиатурная перестановка очереди
  (меню «Выше/Ниже») продолжает работать.
- Перетаскивание при активном поиске переставляет только видимые задачи; скрытые остаются на местах
  (см. `REORDER_QUEUED` в редьюсере и тест на это).
