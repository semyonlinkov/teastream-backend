//! Настройка проекта
1 - настройка .prettierrc
    trailingComma - нужно ли ставить зпт после последнего элемента объектах/массивах
    useTabs - табы вместо пробелов в отступах
    semi - точка с запятой в конце строки
    singleQuote - одинарные кавычки вместо двойных
    jsxSingleQuote - одинарные кавычки в JSX
    arrowParents - убирает круглые скобки в стрел функц

2 - .prettierignore
    node_modules
    dist

3 - tsconfig.json
	"paths": {
		"@/*": ["src/*"],
		"@prisma/generated": ["prisma/generated"],
		"@prisma/generated/*": ["prisma/generated/*"]
	}, - настройка для аллиасов

4 - docker-compose.yaml

5 - .env

//! комманды инициализации проекта
yarn add -D @trivago/prettier-plugin-sort-imports - сортирует импорты

docker compose up -d - запуск докера

yarn add prisma @prisma/client - установка призмы
yarn prisma init - инициализация призмы

//! prisma
yarn prisma db push - пушим созданные модели в призму
yarn prisma studio - запуск prisma studio

//! nest
nest g res core/prisma --no-spec - создает сущность res

//! graphql
yarn add @nestjs/graphql @nestjs/apollo @apollo/server graphql @nestjs/config - установка пакетов

//! пакеты для авторизации через сессии и реддиса
yarn add cookie-parser express-session connect-redis ioredis


