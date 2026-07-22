# 08. dApp Networking Guide

**Как правильно поднимать backend для SmartNet dApp'а: CORS + HTTPS + PNA**

Этот документ - краткое руководство для авторов dApp'ов о том, как правильно
организовать сетевое взаимодействие между вашим приложением (запущенным в
SmartNet-клиенте под кастомным протоколом `sth://`) и вашим backend'ом.
Правильная настройка избавляет от «Failed to fetch», ошибок CORS и
`ERR_PRIVATE_NETWORK_ACCESS_DENIED` без каких-либо изменений в клиенте.

---

## Почему это важно

SmartNet-клиент рендерит ваш dApp в нативном WebView как страницу с origin
`sth://<app_id>/`. Это **не** HTTP и **не** HTTPS - это custom scheme. WebView
(WebView2 на Windows, WKWebView на macOS, WebKitGTK на Linux) применяет к
таким origin'ам более строгие сетевые политики:

* **CORS**: браузер отправляет preflight `OPTIONS`. Если сервер не ответил
  `Access-Control-Allow-Origin`, совместимым с `sth://...` (или `*`), - блок.
* **Private Network Access (PNA)**: запросы к приватным адресам
  (`192.168.x.x`, `10.x.x.x`, `127.0.0.1`) из non-secure origin'а
  дополнительно требуют `Access-Control-Allow-Private-Network: true` в
  preflight - иначе блок.
* **Mixed content**: `http://…` из «secure-подобного» origin блокируется.

**Клиент SmartNet НЕ проксирует ваши HTTP-запросы** - намеренно. Прокси
через нативный слой создавал бы новый attack surface (data exfiltration,
LAN reconnaissance, использование клиента как relay). Мы полагаемся на
стандартные браузерные политики + правильно настроенный backend.

---

## Три рекомендованные архитектуры

### Вариант A - Публичный HTTPS backend с CORS (proще всего)

Ваш backend поднят по публичному домену (`https://api.mydapp.com`) c
валидным сертификатом от Let's Encrypt и корректными CORS-заголовками.

**Плюсы**: обычный `fetch('https://api.mydapp.com/...')` работает без единой
строчки специального кода. Работает и в браузере, и в SmartNet-клиенте.

**Минусы**: нужен публичный хост и SSL-сертификат.

### Вариант B - Netfory-provider gateway

Вместо прямого доступа к своему backend'у используйте общий netfory-provider
gateway (`https://gw.smartholdem.io` или свой собственный). Gateway сам
проксирует HTTP-запросы в P2P-сеть.

**Плюсы**: не нужен свой публичный домен; gateway настраивается один раз для
всех dApp'ов; масштабируется горизонтально.

**Минусы**: зависимость от gateway.

### Вариант C - Локальный dev (только на своей машине)

Для разработки dApp'а на localhost (`http://localhost:5173`) вы можете
завернуть dev-сервер в HTTPS через `mkcert` + Caddy/Vite HTTPS. Тогда origin
становится `https://localhost:5173`, PNA автоматически разрешает, CORS
настраивается штатно.

---

## Готовые шаблоны

### FastAPI (Python) - минимальный CORS + PNA

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

app = FastAPI()

# Разрешаем sth:// origin И типичные HTTP-origin'ы dev-сборок.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],                     # или ["sth://SmyAppAddressXXXX...", "http://localhost:5173"]
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Private Network Access preflight (Chromium требует явного согласия
# для запросов из non-secure origin к private-network адресам).
@app.middleware("http")
async def pna_headers(request: Request, call_next):
    if request.method == "OPTIONS" and request.headers.get("access-control-request-private-network") == "true":
        resp = Response(status_code=204)
    else:
        resp = await call_next(request)
    resp.headers["Access-Control-Allow-Private-Network"] = "true"
    return resp

@app.get("/api/health")
def health():
    return {"ok": True}
```

### Express (Node.js) - то же самое

```javascript
import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors({ origin: '*', methods: '*', allowedHeaders: '*' }))
app.use((req, res, next) => {
  if (req.method === 'OPTIONS' && req.get('access-control-request-private-network') === 'true') {
    res.set('Access-Control-Allow-Private-Network', 'true')
    return res.status(204).end()
  }
  res.set('Access-Control-Allow-Private-Network', 'true')
  next()
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.listen(8022, () => console.log('listening'))
```

### Caddy - авто-HTTPS Let's Encrypt в 3 строки

`Caddyfile`:
```
api.mydapp.com {
  reverse_proxy localhost:8022
}
```
Запуск: `caddy run`. Всё - HTTPS-сертификат от LE выпускается автоматически,
обновляется, DNS-01 challenge поддерживается.

### Client (dApp) - обычный fetch

```javascript
const res = await fetch('https://api.mydapp.com/api/health', {
  method: 'GET',
  headers: { 'X-App-Id': 'my-poker' }
})
const data = await res.json()
```
**Никаких `smartholdem.fetch()`, никаких обходов.**

---

## WebSocket и `socket.io` через P2P (`ws://<nodeId>/...`)

Помимо обычного HTTP, SmartNet-клиент умеет туннелировать **WebSocket**-соединения
через Iroh/QUIC до нужного netfory-provider'а. Это позволяет DApp'ам
(например, покерным столам, чатам, live-фидам) держать полноценный duplex-канал
поверх P2P - без публичного домена и без TLS.

### Как выглядит канонический URL

```
ws://<64-hex-nodeId>/<app-path>
```

* `<64-hex-nodeId>` - Iroh NodeID провайдера, у которого крутится ваш
  WS-endpoint. Это ровно 64 hex-символа, тот же ID, что вы видите в
  `api://`-запросах и в System Console.
* `<app-path>` - обычный HTTP path на стороне провайдера
  (`/pokersth/api/socket.io/`, `/chat/ws`, и т.п.).

Клиент ловит любой `ws://<64-hex>...` в JS-полифилле, поднимает QUIC-туннель
до этого NodeID (ALPN `netfory/api/1`) и прокидывает через него сырой WS-трафик.
С точки зрения вашего backend'а это обычный входящий WebSocket-запрос.

### Правильный вызов `socket.io-client`

```js
// Пример: покерный стол на провайдере pokersth
const nodeId = 'ab12cd34…ef'; // 64 hex-символа, ID Iroh-ноды провайдера
const socket = io(`ws://${nodeId}`, {
  path: '/pokersth/api/socket.io',
  transports: ['websocket'],
});
```

**Почему именно так:**

* `socket.io-client` кладёт первый аргумент в `host` итогового URL - а
  64-hex строка выглядит как валидный host, поэтому библиотека её **не режет**.
* Опция `path` подставляется отдельно и **не смешивается** с host'ом.
  На проводе вы получите чистый
  `ws://<nodeId>/pokersth/api/socket.io/?EIO=4&transport=websocket`.
* `transports: ['websocket']` отключает long-polling fallback (по HTTP он всё
  равно пойдёт через `fetch`, лучше идти сразу в WS).

В System Console это выглядит так:

```
[sth://ws] open ws://ab12…ef/pokersth/api/socket.io/?EIO=4&transport=websocket
```

Никаких `[sth://ws] rescue` - соединение проходит по прямому пути.

### Как **не надо** (и что происходит)

```js
// ❌ Плохо: 'api' воспринимается как host
io('ws://api/pokersth', { path: '/api/socket.io' });

// ❌ Плохо: 'api://' scheme у socket.io тоже парсится криво
io('api://pokersth/...');
```

В обоих случаях `socket.io-client` считает `api` host'ом, а `pokersth` уходит в
path. NodeID **теряется**, на выходе получается `ws://api/pokersth/api/socket.io/`
- без 64-hex ключа маршрутизации, и клиент не знает, к какому провайдеру
подключаться.

Начиная с версии **1.55.35** SmartNet-клиент делает `rescueWsUrl()`:
пытается восстановить NodeID из карты провайдеров, которую он собирает по
ранее прошедшим `api://`-fetch'ам того же DApp. Если DApp хотя бы раз сходил
через `api://<nodeId>/pokersth/...`, WS-соединение будет «спасено» и в
System Console появится:

```
[sth://ws] rescue ws://api/pokersth/... → ws://ab12…ef/pokersth/...
```

**Это защитная сетка, а не контракт.** Она работает только в SmartNet-клиенте
и только когда провайдер уже был опрошен по HTTP. В браузере, headless-клиенте
или после холодного старта её не будет. Пишите канонический вариант сразу.

### Ошибка «Invalid namespace»

Транспорт при этом **полностью работает** (в System Console видно
`[sth://ws] open · … (HTTP 101)`), но socket.io-сервер отклоняет CONNECT.
Причина: если первым аргументом `io()` передать URL **с путём**, то
`socket.io-client` трактует pathname как **namespace** и шлёт CONNECT-пакет
вида `40/pokersth/api,…`. Сервер обслуживает только namespace `/` →
отвечает `Invalid namespace`.

```js
// ❌ namespace становится '/pokersth/api' → сервер: Invalid namespace
io('api://<nodeId>/pokersth/api', { transports: ['websocket'] });

// ✅ host - только nodeId, весь путь - в opts.path, namespace = '/'
io('ws://<nodeId>', {
  path: '/pokersth/api/socket.io',
  transports: ['websocket'],
});
```

Если вам действительно нужен именованный namespace - добавляйте его отдельно
и осознанно: `io('ws://<nodeId>/game', { path: '/pokersth/api/socket.io' })`
подключится к namespace `/game` того же сервера.

### Правила для авторов DApp

1. **Всегда** держите под рукой NodeID провайдера (через `api://`-discovery,
   через blockchain-резолвер `dev://`, или как константу для своего DApp).
2. Передавайте его в `io()` **как host первого аргумента**, а не как часть
   `path` и не через кастомную `api://`-схему.
3. Используйте `transports: ['websocket']`, если вам не нужен HTTP-fallback.
4. Проверяйте себя в **System Console → WS** - должно быть `open`, не `rescue`.
5. Не кладите путь провайдера в первый аргумент `io()` - он станет
   socket.io-namespace и сервер ответит `Invalid namespace` (см. выше).

### Разработка вне SmartNet-клиента

Если хочется тестировать DApp в обычном браузере, обычный `ws://` в
браузер не пойдёт (нет P2P-туннеля). Варианты:

* Поднять netfory-provider gateway в HTTPS-режиме и ходить в
  `wss://gw.smartholdem.io/<app>/ws` - это уже обычный WSS, работает везде.
* Запускать DApp внутри SmartNet-клиента (dev-сборка, Ctrl+Shift+I для DevTools).

---

## FAQ - чего делать НЕ надо

| ❌ Не делайте | ✔️ Правильно |
|---------------|--------------|
| `fetch('http://192.168.1.10:8000/api')` из production dApp'а | Поднимите backend на `https://` с LE-сертификатом |
| Просить у пользователя «разрешить всё в Settings» | Настройте CORS+PNA один раз на своей стороне |
| Использовать `Access-Control-Allow-Origin: sth://*` (звёздочка не работает как wildcard в URL scheme) | `*` или конкретный `sth://<app_id>` |
| Полагаться на клиентский обход CORS | Клиент SmartNet его **не делает**; полагайтесь на стандарты |
| Self-signed cert без trust anchor | LE или платный CA |
| `io('ws://api/pokersth', { path: '/api/socket.io' })` - NodeID теряется | `io('ws://<64-hex-nodeId>', { path: '/pokersth/api/socket.io' })` |

---

## Отладка

* **Failed to fetch без деталей**: откройте DevTools в dApp-webview (Ctrl+Shift+I
  на dev-сборках SmartNet). В Network tab preflight-запрос покажет причину.
* **`ERR_FAILED` в console**: скорее всего preflight упал. Проверьте, что
  ваш сервер отвечает на `OPTIONS /<path>` с CORS-заголовками.
* **`ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOrigin`**:
  включите `Access-Control-Allow-Private-Network: true` на backend'е.
* **CORS работает в браузере, не работает в клиенте**: убедитесь, что
  `Access-Control-Allow-Origin` содержит `*` **или** буквально
  `sth://<ваш-app-id>` - не `sth://*` и не regex.
* **WS-соединение не открывается / `[sth://ws] passthrough native WS: ws://api/...`
  в System Console**: у вас в `io()` потерян NodeID. Смотрите раздел
  «WebSocket и `socket.io` через P2P» выше и переходите на канонический вызов
  `io('ws://<64-hex-nodeId>', { path: '/...' })`.

---

## Итого

* SmartNet-клиент **уважает стандартные браузерные политики** - специально
  для безопасности пользователей.
* Ваша задача как автора dApp'а - **правильно настроить backend**: HTTPS +
  CORS + PNA-хедер. Это ~10 строк middleware.
* После этого стандартный `fetch()` работает **везде** одинаково - и в
  браузере во время разработки, и в клиенте SmartNet при релизе.
