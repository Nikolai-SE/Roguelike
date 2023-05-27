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

Класс реализует интерфейс для отображением игрового мира.

Поля:

> `center: Vector`, координаты центра камеры.

Методы:

> `update(number, number)` - обновляет позицию, на которую наведена камера.

> `calcWorldBounds(Vector): Rectangle` - вычисляет границы игрового мира.

> `render(CanvasRenderingContext2D, Vector)` - отрисовывает игровой мир, главного героя и остальных персонажей.

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

> `worldBuilder : WorldBuilder`, класс-строитель игрового мира.

Методы:

> `update(number, number): Page`, обновляет объект класса `GamePage`.

> `render(CanvasRenderingContext2D, Vector)`, выполняет отрисовку.

> `onKeyDown(KeyboardEvent): Page`, выполняет отрисовку объекта класса `GamePage`.

### WorldBuilder

Абстрактный класс для классов-строителей игрового.

Методы:

> `build(): World`, строит мир по набору задаваемых параметров.

> `reset()`, сбрасывает параметры строителя, после чего требуется их повторное заполнение.

### RandomWorldBuilder

Класс реализует конкретного строителя игрового мира. Объекты этого класса обеспечивают полностью случайное построение игрового мира: враги, игровое поле, снаряжение генерируются случайно.

Поля:

> `width: number`, ширина игрового поля.

> `height: number`, высота игрового поля.

> `numberOfEquipment: number`, количество снаряжения на игровом поле.

> `numberOfEnemies: number`, количество врагов на игровом поле.

> `world: World`, игровой мир, с заданными параметрами.

> `enemyFactory: AbstractEnemyFactory`, фабрика для генерации вражеских единиц.

Методы:

> `boundaries(Vector)`, устанавливает размеры игрового поля.

> `equipmentNumber(number)`, устанавливает количество снаряжения, которое будет сгенерировано на игровом поле.

> `enemiesNumber(number)`, устанавливает количество врагов, которое будет сгенерировано на игровом поле.

> `enemySupplier(AbstractEnemyFactory)`, устанавливает фабрику, которая будет генерировать врагов.

### FileWorldBuilder

Класс реализует конкретного строителя игрового мира, который получает данные о игровом мире из файла.

Поля:

> `size: Vector`, размер игрового поля.

> `walls: CellType[][]`, виды клеток на игровом поле.

> `player: Player`, игровой персонаж.

> `enemies: Enemy`, враги.

> `equipment: Equipment[]`, экипировка.

> `world: World`, игровой мир, с заданными параметрами.

Методы:

> `source(String)`, парсит характеристики для игрового мира из строки, которая передается в качестве аргумента.

### AbstractEnemyFactory

Абстрактынй класс, предоставляет интерфейс для создания вражеских единиц.

Поля:

> `world: World`, игровой мир.

Методы:

> `createHardEnemy(Vector): Enemy`, созадет сильную вражескую единицу.

> `createMediumEnemy(Vector): Enemy`, созадет вражескую единицу со средними показателями: здоровья, урона.

> `createEasyEnemy(Vector): Enemy`, созадет слабую вражескую единицу.

> `createHardSlime(Vector): SlimeEnemy`, созадет сильного слизня.

> `createMediumSlime(Vector): SlimeEnemy`,  созадет слизня со средними показателями: здоровья, урона, шанса дублирования.

> `createEasySlime(Vector): SlimeEnemy`, созадет слабого слизня.

### SimpleEnemyFactory

Класс является наследником `AbstractEnemyFactory`, выполняет создание круглых врагов.

### TriangleEnemyFactory

Класс является наследником `AbstractEnemyFactory`, выполняет создание треугольных врагов.

### MainMenuPage

Класс отвечает за приветствие пользователя при старте приложения. Предлагает пользователю начать новую игру.

Методы:

> `update(number, number): Page`, обновляет объект класса `MainMenu`.

> `render(CanvasRenderingContext2D, Vector)`, выполняет отрисовку.

> `onKeyDown(KeyboardEvent): Page`, отвечает за управление над игоровым процессом.

### HUD

Класс реализует отображение элеменетов визуального интерфейса игрока, к ним относятся: здоровье, сила атаки, инвентарь.

Поля:

> `world : World`, игровой мир.

> `player : Player`, игровой персонаж.

> `inventory : Inventory`, инвентарь игрока.

Методы:

> `update(number, number): Page`, обновляет `HUD`.

> `render(CanvasRenderingContext2D, Vector)`, отображает `HUD` на экране пользователя.

### CellType

Абстрактный класс ячеек. Ячейки занимают важную роль в игровом мире, так как все объекты построены из ячеек.

> `isWalkable: boolean`, возвращает `true`, если игрок может наступить на ячейку, в противном случае `false`.

> `render(CanvasRenderingContext2D, Vector): void`, отрисовывает ячейку.


### SolidCell

Представляет реализацию абстрактного класса для ячеек. Ячейка является элементов игрового мира. Объекты этого класса способны оторбражаться на экране пользователя, а также взаимодействовать с персонажем.

Поля:

> `isWalkable : boolean`, `true`, если по ячейке можно ходить, `false` в противном случае.

> `color : string`, цвет, в который окрашивается ячейка при отрисовке.

Методы:

> `render(CanvasRenderingContext2D, Vector)`, выполняет отрисовку ячейки.

### Vector

Пара координат `x`, `y`, определяют положение объекта в игровом мире.

Поля:

> `x, y : number` - пара координат, местоположение объекта в игровом мире.

### Unit

Базовый класс для классов, объекты которых могут взаимодействать в игровом мире.

Поля:

> `pos: Vector`, позиция персонажа.

> `hp: number`, текущее здоровье персонажа.
 
> `maxHp: number`, максимальное здоровье персонажа. 

> `level: number`, уровень персонажа.

> `damage: number`, наносимый персонажем урон.

> `world : World`, игровой мир.

Методы:

> `tryMoveTo(Vector): boolean`, выполняет перемещение к координатам, переданным в качестве параметра. Возвращает `true`, если удалось совершить перемещение, в противном случае `false`.

> `render(CanvasRenderingContext2D)`, отрисовывает объект.

> `tryWalk(Vector): boolean`, выполняет смещение относительно текущего положения на одну клетку вверх, вниз, влево либо вправо. Возвращает `true`, если удалось совершить перемещение, в противном случае `false`.

> `onKill(Unit)`, увеличивает уровень персонажа при убийстве другого персонажа, который передается в качестве первого параметра.

> `death()`, выполняет определенные дествия при наступлении смерти персонажа.

> `attack(Unit)`, наносит атаку персонажу, который передан в качестве аргумента.

> `takeDamage(number)`, уменьшает здоровье персонажа на величину, переданную в качестве первого параметра.

> `checkDeath(): boolean`, возвращает `false` если здоровье персонажа больше `0`, в противном случае `true`.

### Enemy

Класс представляет собой вражескую единицу, является наследником `Unit`. Объекты этого класса способны отображаться в игровом мире и наносить урон по персонажам.

Поля:

> `behaviour: EnemyBehaviour`, стратегия, которая определяет поведение врежеской единицы.

Методы:

> `move()`, выполняет перемещение согласно заданному поведению.

### SlimeEnemy

Класс представляет собой особый тип вражеской единицы, является наследником `Enemy`. 

Поля:

> `duplicationChance: number`, шанс того, что при перемещении будет сгенерирован объект класса `SlimeEnemy`.

Методы:

> `tryMoveTo(pos: Vector): boolean`, переопределенный метод базового класса. Отвечает за перемещение экземпляров этого класса по игровому миру. При перемещении каждый из объектов этого класса способен с определенной вероятностью `duplicationChance` генерировать объекты класса `SlimeEnemy` на игровом поле.

### EnemyBehaviour

Класс, который отвечает за поведение вражеской единицы.

Поля:

> `wasAttacked: boolean`, `true`, если вражеская единица была атакована, в противном случае `false`.

Методы:

> `move()`, выполняет перемещение согласно заданному поведению.

### Confusion

Декоратор, который определяет поведение вражеской единицы во время конфузии.

Поля:

> `behaviour: EnemyBehaviour`, ссылка на декорированное поведение.

> `duration: number`, длительность эффекта.

> `turnsCntStart: number`, количество ходов, которое прошло в игре на момент наступления конфузии.

Методы:

> `move(Enemy): EnemyBehaviour`, выполняет перемещение согласно определенным правилам. Если конфузия не прошла, то возвращает себя, в противном случае поведение, которое декорирует.

### CowardBehaviour

Класс определяет трусливое поведение.

Методы:

> `move(Enemy): EnemyBehaviour`, выполняет перемещение от игрока.

### AggressiveBehaviour

Класс определяет агрессивное поведение.

Методы:

> `move(Enemy): EnemyBehaviour`, выполняет перемещение к игроку.

### PassiveBehaviour

Класс определяет пассивное поведение.

Методы:

> `move(Enemy): EnemyBehaviour`, выполняет перемещение к игроку, если персонаж был атакован, в противном случае покоится на месте.

### Player

Объект этого класса является персонажем, которым управляет игрок.

Поля:

> `moveDuration: number`, длительность эффекта конфузии, который может наложить игрок при атаке.

> `inventory: Inventory`, инвентарь игрока.

Методы:

> `tryToTakeEquipment(): boolean`, добавляет в инвентарь экипировку, если она присутствует в ячейке, в которой находится игрок.

> `tryToTakeOffEquipment(number): boolean`, снимает снаряжение с игрока и кладет его в инвентарь.

> `tryToPutOnEquipment(number): boolean`, надевает снаряжение на игрока из инвентаря.

### Inventory

Класс инвентаря.

> `List<Equipment> used` - список экипировок, которые использует персонаж.

> `List<Equipment> unused` - список неиспользуемых экипировок.

### Equipment

Абстрактный класс экипировки.

Методы:

> `attackDecorator(number)` - выполняет атаку.

> `getDamageDecorator(number)` - получить урон, который наносит экипировка.

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
npm ci
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

Тесты можно запустить командой
```shell
npm test
```
или
```shell
npx mocha
```

### Управление персонажем 

Перемещение происходить путем нажатия клавиш `WASD` ( ENG раскладка клавиатуры ).

Поднимание экипировки путем нажатия клавиши `T`

Надевание поднятой экипировки из инвентаря - с помощью нажатия клавиши `E` и введение номера экипировки в появившимся поле для ввода.

Снятие экипировки и перемещение ее в инвентарь - с помощью нажатия клавиши `R` и введение номера экипировки в появившимся поле для ввода.
