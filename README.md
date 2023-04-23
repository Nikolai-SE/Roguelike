# Roguelike


## Общие сведения о системе

Roguelike — это довольно популярный жанр компьютерных игр, назван в честь игры Rogue, 1980 года выхода.

* персонаж игрока, способный перемещаться по карте, управляемый с клавиатуры;
* карта обычно генерируется, но для некоторых уровней грузится из файла;
* характеристики персонажа — здоровье, сила атаки;
* у персонажа есть инвентарь, состоящий из вещей, которые он носит с собой;
* вещи из инвентаря можно надеть и снять, надетые вещи влияют на характеристики персонажа;
* вещи изначально находятся на карте, их можно поднять, чтобы добавить в инвентарь;
* снятые вещи находятся в инвентаре, их можно надеть в дальнейшем;
консольная графика, традиционная для этого жанра игр.


## Architectural drivers

## Роли и случаи использования

![](images/Диаграмма%20случаев%20использования.drawio.svg)

### Роли

* *Gamer*
    Игрок. Является единственным пользователем системы в силу синглплеерности проекта.

### Случаи использования

* *Start new game*
    Старт новой игры. Позволяет начать новую игру. Точкой расширения является возможность завершения игровой сессии.

## Описание типичного пользователя

## Композиция (диаграмма компонентов и её текстовое описание)

![](images/Диаграмма%20компонентов.drawio.png)

### Компонентами системы являются

 * *MainMenu*

    Отвечает за приветствие пользователя при старте приложения.
    Предлагает пользователю начать новую игру.

 * Подсистема *"In game state"*



  1. Компонент *GameWorld* содержит логическое представление состояния игры.
  2. Подсистема *Drawer* отвечает за отрисовку текущего состояния игрового поля и *Head-Up Display (HUD)*.
     * *Camera* отрисовывает изменения на игровом поле.
     * *HUD* отображает актуальное состояние характеристик игрового персонажа и инвентаря.

 * *UserListener*

    Считывает пользовательский ввод, интерпретирует его. Передает результат интерпретации в компоненты MainMenu или подсистему "In game state".


## Логическая структура (диаграмма классов и её текстовое описание)

![Диаграмма классов](images/Диаграмма%20классов.drawio.svg)

### Camera

Класс реализует интерфейс для отображением игрового мира. Достигается это за счет использования `Canvas`.

Поля:

> `center: Vector`, координаты центра камеры.

> `game: GamePage`, класс для управления отрисовкой.

> `world : World`, игровой мир.

> `player : Player`, персонаж, которым управляет пользователь.

> `units : Unit[]`, персонажи, которые населяют игровой мир.

Методы:

> `update(number, number)` - обновляет позицию, на которую наведена камера.

> `calcWorldBounds(Vector): Rectangle` - вычисляет границы игрового мира.

> `render(CanvasRenderingContext2D, Vector)` - отрисовывает игровой мир, главного героя, персонажей.

### Page

Интерфейс содержит минимальный набор методов, которые должны реализовавывать класс для того, чтобы его объекты могли быть отрисованы.

Методы:

> `update(number, number): Page`, обновляет объект.
        
> `onKeyDown(KeyboardEvent): Page`, выполняет действия при нажатии определенных клавиш.

> `render(CanvasRenderingContext2D, Vector)`, выполняет отрисовку объекта класса, который реализует этот интерфейс, на экране пользователя.

### GamePage

Класс реализует интерфейс для обновления камеры, `HUD`, а также управления игровым персонажем.

Поля:

> `world : World`, игровой мир.

> `camera : Camera`, камера, которая отрисовывает игровой мир.

> `hud : HUD`, элементы визуального интерфейса.

Методы:

> `update(number, number): Page`, обновляет объект класса `GamePage`.

> `render(CanvasRenderingContext2D, Vector)`, выполняет отрисовку.

> `onKeyDown(KeyboardEvent): Page`, выполняет отрисовку объекта класса `GamePage`.

### MainMenuPage

Класс отвечает за приветствие пользователя при старте приложения Предлагает пользователю начать новую игру.

Методы:

> `update(number, number): Page`, обновляет объект класса `MainMenu`.

> `render(CanvasRenderingContext2D, Vector)`, выполняет отрисовку.

> `onKeyDown(KeyboardEvent): Page`, выполняет отрисовку объекта класса `GamePage`.

### HUD

Класс реализует отображение элеменетов визуального интерфейса игрока, к ним относятся: здоровье, сила атаки, инвентарь.

Поля:

> `game : GamePage`, объект класса `GamePage`.

> `world : World`, игровой мир.

> `player : Player`, игровой персонаж.

Методы:

> `update(number, number): Page`, обновляет `HUD`.

> `render(CanvasRenderingContext2D, Vector)`, отображает `HUD` на экране пользователя.

### CellType

Абстрактный класс ячеек. Ячейки занимают важную роль в игровом мире, так как все объекты построены из ячеек.

> `isWalkable: boolean`, возвращает `true`, если игрок может проходить через ячейку, `false` в противном случае.

> `render(CanvasRenderingContext2D, Vector): void`, отрисовывает ячейку.


### SolidCell

Представляет реализацию абстрактного класс ячеек, является элементов игрового мира. Объекты этого класса способны оторбражаться на экране пользователя, а также взаимодействовать с персонажем.

Поля:

> `isWalkable : boolean`, `true`, если по ячейке можно ходить, `false` в противном случае.

> `color : string`, цвет, в который окрашивается ячейка при отрисовке.

Методы:

> `render(CanvasRenderingContext2D, Vector)`, выполняет отрисовку ячейки.

### Vector

Пара координат `x`, `y`, определяют положение объекта в игровом мире.

Поля:

> `x, y : number` - пара координат, местоположение объекта в игровом мире.

Методы:

> `eq(Vector, Vector): boolean`, сравнивает два объекта класса `Vector`.

> `add(Vector, Vector): Vector`, складывает два объекта класса `Vector`.

> `sub(Vector, Vector): Vector`, находит разность двух объектов класса `Vector`.

> `mul(number, Vector): Vector`, перемножает два объекта класса `Vector`.

> `div(Vector, number): Vector`, находит частное от деления объекта класса `Vector` на число.

### Unit

Базовый класс для классов, объекты которых могут отрисовываться в игровом мире.

Поля:

> `world : World`, игровой мир

Методы:

> `pos(): Vector`, возвращает текущую позицию объекта на экране

> `tryMoveTo(Vector): boolean`, выполняет перемещение к координатам, переданным в качестве первого параметра. Возвращает `true`, если удалось совершить перемещение, в противном случае `false`.

> `render(CanvasRenderingContext2D)`, отрисовывает объект

### Enemy

Класс представляет собой вражескую единицу. Объекты этого класса способны отображаться в игровом мире и наность урон по персонажу.

> `enemyStrategy` - стратегия, которая определяет поведения врежеской единицы

### AbstractEnemyStrategy

Стратегия, поведение врежской единицы.

> `doBadThings()` - действие вражеской единицы

### Player

Класс персонажа, которым управляет игрок.

Поля:

> `world: World`,  игровой мир

> `pos: Vector`, позиция игрока в игровом мире

> `hp: number`, текущий уровень здоровья игрока

> `maxHp: number`, максимальный уровень здоровья игрока

> `damage: number`, урон наносимый игроком

> `inventory: Inventory`, инвентарь игрока

Методы:

> `take(Equipment eqpmnt)`, добавляет экипировку в инвентарь.

> `putOn(Equipment eqpmnt)`, выбирает экипировку из инвентаря.

> `takeOff(Equipment eqpmnt)`, удаляет экипировку из инвентаря.

> `tryWalk(Vector): boolean`, попытаться сместить игрока величину смещения, переданную в первом параметре, если игрока удалось сместить, то возвращает `true`, в противном случае возвращает `false`.

> `render(CanvasRenderingContext2D)`, отрисовать игрока.

### Inventory

Класс инвентаря.

> `List<Equipment> used` - список экипировок, которые использует персонаж

> `List<Equipment> unused` - список неиспользуемых экипировок

### Equipment

Абстрактный класс экипировки.

Методы:

> `attackDecorator(Placement p, Int points)` - выполнить атаку.

> `getDamageDecorator(Int)` - получить урон, который наносит экипировка.

### Helmet

Класс, объекты которого представляют собой шлемы, с различными характеристиками. Является наследником `Equipment`.

### Sword

Класс, объекты которого представляют собой мечи, с различными характеристиками. Является наследником `Equipment`.

### SuperEquipment

Класс, объекты которого представляют собой эксклюзивную экипировку, с различными характеристиками. Является наследником `Equipment`.

## Взаимодействия и состояния (диаграммы последовательностей и конечных автоматов и их текстовое описание)

### Диаграмма последовательностей

![Диаграмма последовательностей](images/Диаграмма%20последовательностей.drawio.svg)

* *Run*
    При запуске пользователем приложения создаётся главное меню и отрисовывается.

* *Start New Game*
    При запуске новой игры главное меню прекращает свою жизнь, конструируется игровой мир и отрисовывает себя.

* *Command*
    При вводе пользователем команд игровой мир отвечает на это, фиксируя изменения и отрисовывая себя.

* *Quit*
    При желании пользователя завершить игровую сессию, игровой мир завершает свою жизнь. Конструируется главное меню и отрисовывает себя.

* *Exit*
    При команде завершения приложения, главное меню и приложение завершают свою жизнь.

### Диаграмма конечных автоматов

![Диаграмма конечных автоматов](images/Diag_Interface.svg)

При запуске игры открывается главное меню.
Игрок может начать новую игру или выйти из игры.

Если игрок начинает новую игру, то генерируется мир, и показывается игроку.

В игровом мире игрок может открыть меню (в которое входит инвентарь)
или совершать действия игрового мира (перемещение, атака, и т.д.).

В игровом меню игрок может вернуться к отображению игрового мира,
совершать действия над инвентарём, или выйти из игры.

Выйти из игры можно в главное меню или из приложения.
В обоих случаях от игрока запрашивается подтверждение,
чтобы предотвратить потерю игрового прогресса от случайного нажатия.

## Инструкции по запуску
Для разработки используется TypeScript, для сборки — Webpack.
Соответственно, для запуска нужен [Node.js](https://nodejs.org/en)
с пакетным менеджером `npm`.

Команды для запуска:
```
git clone https://github.com/Nikolai-SE/Roguelike.git
cd Roguelike

```

```shell
npm i
npx webpack s
```

Завершить работу процесса
```shell
sudo kill -9 `sudo lsof -t -i:9000`
```

После этого будет запущен локальный сервер.
Главное меню игры будет доступно прямо в браузере
по адресу [http://localhost:9000](http://localhost:9000).

Остановить сервер можно, нажав <kbd>Ctrl+C</kbd>
в терминале.

При любых изменениях исходного кода игра пересоберётся и перезапустится автоматически.

