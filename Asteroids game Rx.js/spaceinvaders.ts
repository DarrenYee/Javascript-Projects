import { fromEvent,interval, Observable, merge} from "rxjs";
import { map, filter, scan, shareReplay} from 'rxjs/operators';
function spaceinvaders() {
    // Inside this function you will use the classes and functions 
    // from rx.js
    // to add visuals to the svg element in pong.html, animate them, and make them interactive.
    // Study and complete the tasks in observable exampels first to get ideas.
    // Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/ 
    // You will be marked on your functional programming style
    // as well as the functionality that you implement.
    // Document your code!  

    enum KeyCode { LeftKey=37, UpKey=38, RightKey=39 }
    type ViewType = 'ship' | 'rock' | 'bullet'| 'aliens' | 'bulletEnermy' | 'shield' | 'gameOver' | 'bomb'

    /**
     * Stores all the constants used within the program
     */
    const CONSTANTS = {
      STARTX: 275,
      START_Y: 550,
      X_UPPERBOUND: 600,
      X_LOWERBOUND: 0,
      Y_UPPERBOUND: 600,
      Y_LOWERBOUND: 0,
      START_TIME: 0,
      ZERO: 0,
      Y_OFFSET: 50,
      ALIEN_ROWS: 4,
      X_OFFSET: 0, // for ship png
      ALIEN_COUNT: 36,
      ALIEN_DISTANCE: 50,
      SHIELD_COUNT: 30,
      SHIELD_ROW: 6,
      START_LEVEL: 1,
      SCOREBOARD_XY: 50
    }
    /**
     * Object ID to store if and create time, iBody helps set up the type Body which is used to create Aliens, Shields etc.
     */

    type ObjectId = Readonly<{id:string,createTime:number}>
    interface iBody extends ObjectId{
      id:string,
      viewType: ViewType,
      x:number, 
      y:number,
      horiDirection: number, 
      movement: number,      
      vertiDirection: number, 
      createTime:number
    }
    type Body = Readonly <iBody>
    /**
     * State type that contains all the relevant information on the current state of the game.
     */
    type State = Readonly<{
      time: number,
      ship: Body,
      bullets:ReadonlyArray<Body>,
      bomb: ReadonlyArray<Body>,
      aliens: ReadonlyArray<Body>,
      shield: ReadonlyArray<Body>,
      x: number,
      y: number,
      lastTime: number,
      highScore: number,
      restart: boolean,
      level: number;
      exit:ReadonlyArray<Body>,
      objCount:number
      gameOver: boolean
    }>

    /**
     * Creates a ship inside the svg 
     * @returns Ship Body
     */

    function createShip():Body {
      return {
        id: 'ship',
        viewType: 'ship',
        x: CONSTANTS.STARTX,
        y: CONSTANTS.START_Y,
        horiDirection: CONSTANTS.ZERO,
        vertiDirection: CONSTANTS.ZERO,
        movement: CONSTANTS.ZERO,
        createTime:CONSTANTS.START_TIME
      }
    }
    /**
     * creates the bullet that is shot by the user's ship.
     * @param s current state of the game  
     * @returns a Bullet body
     */
    function createBullet(s:State):Body {
      return {
        id:`bullet${s.objCount}`,
        viewType : 'bullet',
        x:s.ship.x + CONSTANTS.X_OFFSET, 
        y:s.ship.y - CONSTANTS.Y_OFFSET,
        horiDirection: CONSTANTS.ZERO,
        vertiDirection: CONSTANTS.ZERO, 
        movement: CONSTANTS.ZERO,
        createTime:s.time,
      }
    }
    /**
     * creates a Bomb object with large 
     * @param s current state of the game
     * @returns a Bomb body
     */
    function createBomb(s:State):Body {
      return {
        id:`Bomb${s.objCount}`,
        viewType : 'bomb',
        x:s.ship.x + CONSTANTS.X_OFFSET, 
        y:s.ship.y - CONSTANTS.Y_OFFSET,
        horiDirection: CONSTANTS.ZERO,
        vertiDirection: CONSTANTS.ZERO, 
        movement: CONSTANTS.ZERO,
        createTime:s.time,
      }
    }
    /**
     * creates an Alien Bullet object
     * @param s takes in the current state of the game
     * @param o takes in the current aliens that the bullet is spawning through
     * @returns a Bullet object
     */

    function createAlienBullet(s:State, o:Body):Body {
      return {
        id:`bulletEnermy${s.objCount}` + numberRandomizer(1,99999999),
        viewType : 'bulletEnermy',
        x:o.x, 
        y:o.y,
        horiDirection: CONSTANTS.ZERO,
        vertiDirection: CONSTANTS.ZERO, 
        movement: CONSTANTS.ZERO,
        createTime:s.time,
      }
    }
    /**
     * creates an Alien object 
     * @param viewType takes in all the information needed to create the alien object using currying 
     * @returns an Alien Body
     */

    const createAliens = (viewType: ViewType) => (oid: ObjectId) => (x: number) => (y:number) => 
    <Body>{
      ...oid,
      id: viewType + oid.id,
      viewType: viewType,
      x: x,
      y: y,
      horiDirection: CONSTANTS.ZERO,
      movement: 1,
      vertiDirection: CONSTANTS.ZERO,
      createTime: oid.createTime
    }

    /**
     * Creates rows of aliens in order to look similar to the original space invaders game
     */
    const createAliensRows = createAliens('aliens'), 
          startAliensRow1 = 
          [...Array(CONSTANTS.ALIEN_COUNT/CONSTANTS.ALIEN_ROWS)].map((_,i) => createAliensRows({id: String(i), createTime:CONSTANTS.START_TIME})
          (CONSTANTS.X_LOWERBOUND + 125 + i * CONSTANTS.ALIEN_DISTANCE)
          (100)),
          startAliensRow2 =
          [...Array(CONSTANTS.ALIEN_COUNT/CONSTANTS.ALIEN_ROWS)].map((_,i) => createAliensRows({id: String(i+9*1), createTime:CONSTANTS.START_TIME})
          (CONSTANTS.X_LOWERBOUND + 125 + i * CONSTANTS.ALIEN_DISTANCE)
          (150)),
          startAliensRow3 = 
          [...Array(CONSTANTS.ALIEN_COUNT/CONSTANTS.ALIEN_ROWS)].map((_,i) => createAliensRows({id: String(i+9*2), createTime:CONSTANTS.START_TIME})
          (CONSTANTS.X_LOWERBOUND + 125 + i * CONSTANTS.ALIEN_DISTANCE)
          (200)),
          startAliensRow4 = 
          [...Array(CONSTANTS.ALIEN_COUNT/CONSTANTS.ALIEN_ROWS)].map((_,i) => createAliensRows({id: String(i+9*3), createTime:CONSTANTS.START_TIME})
          (CONSTANTS.X_LOWERBOUND + 125 + i * CONSTANTS.ALIEN_DISTANCE)
          (250))
    /**
     * Creates a Shield object
     * @param viewType takes in all the information needed to create the shield object using currying 
     * @returns a shield Body  
     */
    const createShield = (viewType: ViewType) => (oid: ObjectId) => (x: number) => (y:number) => 
        <Body>{
        ...oid,
        id: viewType + oid.id,
        viewType: viewType,
        x: x,
        y: y,
        horiDirection: CONSTANTS.ZERO,
        movement: 1,
        vertiDirection: CONSTANTS.ZERO,
        createTime: oid.createTime
      }
    /**
     * Creates the shields row by row 
     */
    const createShieldRows = createShield('shield')
    const startShieldleft = 
          [...Array(CONSTANTS.SHIELD_COUNT/5)].map((_,i) => createShieldRows({id: String(i), createTime:CONSTANTS.START_TIME})
          (50 + i *10 )
          (400)),
        startShieldleft2 = 
          [...Array(CONSTANTS.SHIELD_COUNT/5)].map((_,i) => createShieldRows({id: String(i+ CONSTANTS.SHIELD_ROW*1), createTime:CONSTANTS.START_TIME})
          (50 + i *10)
          (415)),
        startShieldleft3 = 
          [...Array(CONSTANTS.SHIELD_COUNT/5)].map((_,i) => createShieldRows({id: String(i+ CONSTANTS.SHIELD_ROW*2), createTime:CONSTANTS.START_TIME})
          (50 + i *10)
          (430)),
        startShieldmiddle = 
          [...Array(CONSTANTS.SHIELD_COUNT/5)].map((_,i) => createShieldRows({id: String(i+ CONSTANTS.SHIELD_ROW*3), createTime:CONSTANTS.START_TIME})
          (250 + i *10 )
          (400)),
        startShieldmiddle1 = 
          [...Array(CONSTANTS.SHIELD_COUNT/5)].map((_,i) => createShieldRows({id: String(i+ CONSTANTS.SHIELD_ROW*4), createTime:CONSTANTS.START_TIME})
          (250 + i *10)
          (415)),
        startShieldmiddle2 = 
          [...Array(CONSTANTS.SHIELD_COUNT/5)].map((_,i) => createShieldRows({id: String(i+ CONSTANTS.SHIELD_ROW*5), createTime:CONSTANTS.START_TIME})
          (250 + i *10)
          (430)),
        startShieldRight = 
          [...Array(CONSTANTS.SHIELD_COUNT/5)].map((_,i) => createShieldRows({id: String(i+ CONSTANTS.SHIELD_ROW*6), createTime:CONSTANTS.START_TIME})
          (450 + i *10 )
          (400)),
        startShieldRight1 = 
          [...Array(CONSTANTS.SHIELD_COUNT/5)].map((_,i) => createShieldRows({id: String(i+ CONSTANTS.SHIELD_ROW*7), createTime:CONSTANTS.START_TIME})
          (450 + i *10)
          (415)),
        startShieldRight2 = 
          [...Array(CONSTANTS.SHIELD_COUNT/5)].map((_,i) => createShieldRows({id: String(i+ CONSTANTS.SHIELD_ROW*8), createTime:CONSTANTS.START_TIME})
          (450 + i *10)
          (430))

    /**
     * Initializes the inital state of the game (start of the game / level )
     */
    const initial : State = {
      time: CONSTANTS.ZERO,
      ship: createShip(),
      bullets:[],
      aliens: [...startAliensRow1,...startAliensRow2,...startAliensRow3,...startAliensRow4], //joins all the created aliens together into one single array
      shield :[...startShieldleft,...startShieldleft2,...startShieldleft3,...startShieldmiddle,...startShieldmiddle1,...startShieldmiddle2,...startShieldRight,...startShieldRight1,...startShieldRight2], //joins all the created shields together into one single array
      bomb: [],
      x: CONSTANTS.ZERO,
      y: CONSTANTS.ZERO,
      level: CONSTANTS.START_LEVEL,
      lastTime: CONSTANTS.ZERO,
      highScore: CONSTANTS.ZERO,
      restart: false,
      exit : [], 
      gameOver: false,
      objCount : CONSTANTS.ALIEN_COUNT
      }

    /**
     * GameClock for the game in order to track time passes. Adapted from Asteroids FRP
     */
    const gameClock = interval(10)
      .pipe(map(elapsed=>new Tick(elapsed)))
    
      /**
       * Takes in the current state and updates it accordingly in order to display the newest / most recent information in the svg canvas. Adapted and modified from Asteroids FRP
       * @param state takes in the current state of the game 
       */
    function updateView (state: State): void{
      const ship = document.getElementById("ship")!,
      svg = document.getElementById("canvas")!
      ship.setAttribute('transform',`translate(${state.ship.x},${state.ship.y})`)
      if (!document.getElementById("scoreBoard")){  //creates the scoreBoard object to track the current score, resets it upon death
      const scoreBoard = document.createElementNS(svg.namespaceURI, "text")!;
      scoreBoard.setAttribute ("id", "scoreBoard")
      svg.appendChild(scoreBoard)
      }
      document.getElementById("scoreBoard").setAttribute("x", String(CONSTANTS.SCOREBOARD_XY)),
      document.getElementById("scoreBoard").setAttribute("y", String(CONSTANTS.SCOREBOARD_XY)),
      document.getElementById("scoreBoard").setAttribute("fill", "white"),
      document.getElementById("scoreBoard").textContent = 'Score: '+ String((CONSTANTS.ALIEN_COUNT*(state.level-1))+(CONSTANTS.ALIEN_COUNT - state.aliens.length))
      if (!document.getElementById("highScore")){ //creates the highScore object in order to track the highest score by the user.
        const highScore = document.createElementNS(svg.namespaceURI, "text")!;
        highScore.setAttribute ("id", "highScore")
        svg.appendChild(highScore)
        }
        document.getElementById("highScore").setAttribute("x", String(450)),
        document.getElementById("highScore").setAttribute("y", String(50)),
        document.getElementById("highScore").setAttribute("fill", "white"),
        document.getElementById("highScore").textContent = 'High Score: '+ String(state.highScore)
      if (!document.getElementById("level")){ //creates the level object in order to track the current by the user.
        const level = document.createElementNS(svg.namespaceURI, "text")!;
        level.setAttribute ("id", "level")
          svg.appendChild(level)
        }
        document.getElementById("level").setAttribute("x", String(250)),
        document.getElementById("level").setAttribute("y", String(50)),
        document.getElementById("level").setAttribute("fill", "white"),
        document.getElementById("level").textContent = 'Level: '+ String(state.level)
      const powerUpAvailable = document.createElementNS(svg.namespaceURI, "text")!;
      if (state.aliens.length == 16 && ! document.getElementById("powerUp")){ // creates the powerUpAvailable object which shows that the user has access to the powerUp
        powerUpAvailable.setAttribute("id", "powerUp")
        powerUpAvailable.setAttribute("x", String(50))
        powerUpAvailable.setAttribute("y", String(70))
        powerUpAvailable.setAttribute("fill", "white")
        powerUpAvailable.textContent = CONSTANTS.ALIEN_COUNT - state.aliens.length <=20?"PowerUp Available! Ship movement speed ++ ! Press Q to shoot Bombs":" "
        svg.appendChild(powerUpAvailable)
      }
      else{
        document.getElementById("powerUp") && state.aliens.length == 0?svg.removeChild(document.getElementById("powerUp")): undefined
      }
      state.bomb.forEach(b=>{ // checks all the boms inside the states and update their position / state inside the svg canvas 
        const createBulletView = ()=>{
          const v = document.createElementNS(svg.namespaceURI, "ellipse")!;
          v.setAttribute("id",b.id);
          b.viewType == 'bulletEnermy'?v.classList.add("bulletEnermy"):v.classList.add("bullet")
          svg.appendChild(v)
          return v;
        }
        const v = document.getElementById(b.id) || createBulletView();
        v.setAttribute("cx",String(b.x))
        v.setAttribute("cy",String(b.y))
        v.setAttribute ("rx","10")
        v.setAttribute ("ry","10")
    })
      state.bullets.forEach(b=>{  // checks for all the bullets inside the states and update their positions / state inside the svg canvas 
        const createBulletView = ()=>{
          const v = document.createElementNS(svg.namespaceURI, "ellipse")!;
          v.setAttribute("id",b.id);
          if (b.viewType == 'bulletEnermy'){
          v.classList.add("bulletEnermy")
          }else{
            v.classList.add("bullet")
          }
          svg.appendChild(v)
          return v;
        }
        const v = document.getElementById(b.id) || createBulletView();
        v.setAttribute("cx",String(b.x))
        v.setAttribute("cy",String(b.y))
        v.setAttribute ("rx","2.5")
        v.setAttribute ("ry","2.5")
    })
    state.aliens.forEach(a =>{  // checks for all the aliens inside the states and update their position / state inside the svg canvas
      const createAliensView = ()=> {
        const v = document.createElementNS(svg.namespaceURI, "ellipse")!;
        v.setAttribute("id",a.id);
        v.classList.add("aliens")
        svg.appendChild(v)
        return v; 
      }  
      const v = document.getElementById(a.id) || createAliensView();
        v.setAttribute("cx", String(a.x) )
        v.setAttribute("cy", String (a.y))
        v.setAttribute ("rx","10")
        v.setAttribute ("ry","10")
    })
    state.shield.forEach(a =>{  // checks for all the shields inside the states and update their position / state inside the svg canvas
      const createShieldView = ()=> {
        const v = document.createElementNS(svg.namespaceURI, "rect")!;
        v.setAttribute("id",a.id);
        v.classList.add("shield")
        svg.appendChild(v)
        return v; 
      }  
      const v = document.getElementById(a.id) || createShieldView();
        v.setAttribute ("x",String(a.x))
        v.setAttribute ("y",String(a.y))
        v.setAttribute("width", String(15))
        v.setAttribute("height", String (15))

    })
      state.exit.forEach(o=>{ //  removes the body objects that has been destroyed from the svg
        const v = document.getElementById(o.id);
        if(v) svg.removeChild(v) 
    })
    if(state.gameOver) {  // allows the user to refresh once they beat the game 
      subscribe.unsubscribe();
      const element = document.createElementNS(svg.namespaceURI, "text")!;
        element.setAttribute("x", String(600/2 - 125)),
        element.setAttribute("y", String(600/2)),
        element.setAttribute("fill", "white"),
        element.textContent = "Game Over! Press W to try again";
        svg.appendChild(element);
        document.addEventListener('keydown', (e) =>{
          e.keyCode == 87?window.location.reload(): null
        })
    }
  }

    class Tick { constructor(public readonly elapsed:number) {} } // constructs tick object to store elapsed 
    class moveLeftRight  {constructor(public readonly direction: number) {}} // allows the ship to be moved left to right
    class enermyShoot { constructor (public readonly body: Body) {}} // action to allow the enermy to shoot
    class shoot { constructor () {}} // shoot action for the player
    class shootBomb { constructor () {}} // shoot bomb action for the player to use powerUp

    type Event = 'keydown' | 'keyup'
    type Key = 'ArrowLeft' | 'ArrowRight'| 'ArrowUp' | 'ArrowDown' | 'Space' | 'KeyQ' | 'KeyW' 

    /**
     * allows us to observe keyBoard movement by the user. 
     */
    const observeKey = <T>(eventName:string, k:Key, result:()=>T)=>
    fromEvent<KeyboardEvent>(document,eventName)
      .pipe(
        filter(({code})=>code === k),
        filter(({repeat})=>!repeat),
        map(result)),

    moveLeft = observeKey('keydown', 'ArrowLeft', ()=> new moveLeftRight(-1)),
    moveLeftStop = observeKey('keyup', 'ArrowLeft', ()=> new moveLeftRight(0)),
    moveRight = observeKey('keydown', 'ArrowRight', ()=> new moveLeftRight(1)),
    moveRightStop = observeKey('keyup','ArrowRight', () => new moveLeftRight(0)),
    shootAction = observeKey('keydown','Space',()=> new shoot()),
    shootBombAction = observeKey('keydown','KeyQ',()=> new shootBomb()) 
    
    /**
     * Handles the different movements of all the objects within the game. 
     */
    const move = (o:Body) => <Body>{
      ...o,
      x: o.x  + o.horiDirection,
      y: o.y + o.vertiDirection,
    },

      bulletMove = (o:Body) => <Body>{
      ...o,
      y: o.viewType == 'bulletEnermy'? o.y + 1: o.y - 1
    },

      alienMoveRight = (o:Body, s: State) => <Body>{
      ...o,
      x: o.x+ 0.5
    },

      alienMoveLeft = (o:Body, s: State) => <Body>{
      ...o,
      x: o.x - 0.5
    },

      alienMoveDown = (o:Body, s: State) => <Body>{
      ...o,
      y: o.y+(2.5* s.level),
      movement: o.movement*-1
    }

    // creates a temporary list object
    type tempList = Readonly<{
      list: Array<Body>,
    }>

    // concatanates the alien bullets with the existing bullet list, clears it after it is combined
    const alienBulletList :tempList = {
      list: []
    },
      concatBulletList = (s: State, a: Array<Body>)=>{
      return <State>{
      ...s,
      objCount: s.objCount + 1,
      bullets : s.bullets.concat(a)
      }
    } , 
      clearTempList = (o: tempList) => <tempList>{
      ...o,
      list: o.list.splice(0,o.list.length)
    }

  const handleCollision = (s: State)=>{
    const bodiesCollided = ([a,b]:[Body,Body])=> (Math.abs(a.x-b.x) < 10 ) && (Math.abs(a.y-b.y) < 10 ),  //hitbox for normal body collision (aliens, shield)
    bombsCollided = ([a,b]:[Body,Body])=> (Math.abs(a.x-b.x) < 70 ) && (Math.abs(a.y-b.y) < 70 ),   //hitbox for the AOE (large hitbox) bomb 
    shipCollided = ([a,b]:[Body,Body])=> (Math.abs(a.x-b.x) < 15 ) && ((a.y-b.y) == 50 || (a.y-b.y) == -30), // hitbox for ship
    alienToShip = s.aliens.filter(r => shipCollided([s.ship,r])).length > 0,  //when aliens hit the ship
    bulletsToShip = s.bullets.filter(r => shipCollided([s.ship,r])).length > 0, //when bullets hit the ship
    allBulletsAndAliens = flatMap(s.aliens, b => s.bullets.filter(r=> r.viewType == 'bullet').map<[Body,Body]>(r=> ([b,r]))), //list containing all bullets and aliens 
    allBombsAndAliens = flatMap(s.aliens, b => s.bomb.filter(r=> r.viewType == 'bomb').map<[Body,Body]>(r=> ([b,r]))),  //list containing all bombs and aliens 
    allBulletsAndShield = flatMap(s.shield, b => s.bullets.filter(r=> r.viewType == 'bullet' || r.viewType == 'bulletEnermy').map<[Body,Body]>(r=> ([b,r]))), //list containing all bullets and shield 
    allAliensAndShield = flatMap(s.shield, b => s.aliens.filter(r=> r.viewType == 'aliens').map<[Body,Body]>(r=> ([b,r]))), //list containing all aliens and shields
    collidedBombsAndAliens = allBombsAndAliens.filter(bombsCollided), //list containing all bombs and aliens that have collided 
    collidedAliensAndShield = allAliensAndShield.filter(bodiesCollided),  //list containing all aliens and shields that have collided
    collidedBulletsAndAliens = allBulletsAndAliens.filter(bodiesCollided),   //list containing all bullets and aliens that have collided
    collidedBulletsAndShield = allBulletsAndShield.filter(bodiesCollided),  //list containing all bullets and shield collided
    collidedBullets = collidedBulletsAndAliens.map(([_,bullet]) => bullet).concat(collidedBulletsAndShield.map(([_,bullet]) => bullet)),  //  all bullets that have collided with something
    collidedAliens = collidedBulletsAndAliens.map(([aliens,_]) => aliens).concat(collidedAliensAndShield.map(([_,aliens]) => aliens)).concat(collidedBombsAndAliens.map(([aliens,_]) => aliens)), // all aliens that have collided with something
    collidedShields = collidedBulletsAndShield.map(([shields,_]) => shields).concat(collidedAliensAndShield.map(([shields,_])=> shields)),  // all shields that have collided with something
    collidedBombs = collidedBombsAndAliens.map(([_,bombs]) => bombs), //all bombs that have collided with something 
    cut = except((a:Body)=>(b:Body)=>a.id === b.id) //cut adapted from FRP ASTEROIDS 
    return <State>{
      ...s, 
      bullets: cut(s.bullets)(collidedBullets), //remove collided bullets from bullet list
      aliens : cut (s.aliens)(collidedAliens),  //remove collided aliens from aliens list 
      shield: cut (s.shield)(collidedShields),  //remove collided shields from shields list
      bomb: cut (s.bomb)(collidedBombs),  //remove collided bombs from bombs list
      restart : bulletsToShip || alienToShip, //restarts if either of the conditions have been met 
      exit: s.exit.concat(collidedBullets,collidedAliens,collidedShields,collidedBombs),  //grabs all the collided objects and prepare for their removal from the svg
      objCount: s.objCount - (collidedBulletsAndAliens.length + collidedBullets.length + collidedBombs.length), //the amount of objects in the game
      gameOver: s.level > 5 // game over when level hits 5
    }   
  }
    /**
     * Tick function in the game to show time passed 
     * @param s current state of the game 
     * @param elapsed time passed 
     * @returns the updated state or inital state 
     */
    const tick = (s:State,elapsed:number) => {
        ((elapsed - s.lastTime)% (s.aliens.length > 10?90:40)  == 0)?s.aliens.slice(0,CONSTANTS.ALIEN_COUNT).map(a => a.id == a.viewType+ String(numberRandomizer(0,(s.aliens.length)-1))?(alienBulletList.list.push(createAlienBullet(s,a))):null):null
        const not = <T>(f:(x:T)=>boolean)=>(x:T)=>!f(x),
          expired = (b:Body)=>(elapsed - b.createTime) > 400, // expired counter for bullets shot by player
          expiredBullets:Body[] = concatBulletList(s,alienBulletList.list).bullets.filter(expired), 
          activeBullets = concatBulletList(s,alienBulletList.list).bullets.filter(not(expired)),
          expired_Alien = (b:Body)=>(elapsed - b.createTime) > 800, // alien bullets have longer expire time
          expiredAlienBullets:Body[] = alienBulletList.list.filter(expired_Alien),
          activeAlienBullets = alienBulletList.list.filter(not(expired_Alien)),
          expiredBomb: Body[] = s.bomb.filter(expired)
          clearTempList(alienBulletList)
        return s.aliens.length > 0 && s.restart == false ?handleCollision({...s, 
          ship:move(s.ship),
          bullets:activeBullets.concat(activeAlienBullets).map(bulletMove), // make active bullets move
          aliens: s.aliens.length >= 10?(elapsed/60 - s.lastTime/60)%2.5 == 0?s.aliens.map(a=> alienMoveDown(a,s)):s.aliens[s.aliens.length-1].movement> 0?s.aliens.map(a=> alienMoveRight(a,s)):s.aliens.map(a=> alienMoveLeft(a,s)):
          (elapsed/60 - s.lastTime/60)%0.5 == 0?s.aliens.map(a=> alienMoveDown(a,s)):s.aliens[s.aliens.length-1].movement> 0?s.aliens.map(a=> alienMoveRight(a,s)):s.aliens.map(a => alienMoveLeft(a,s)), 
          bomb: s.bomb.filter(not(expired)).map(bulletMove),
          exit:expiredBullets.concat(expiredAlienBullets).concat(expiredBomb),
          time:elapsed 
        }):<State>{
        ...initial,
        highScore : s.restart == true?(40*(s.level-1))+(CONSTANTS.ALIEN_COUNT - s.aliens.length) > s.highScore ? (40*(s.level-1))+(CONSTANTS.ALIEN_COUNT - s.aliens.length) : s.highScore:s.highScore,
        last_time : elapsed,
        level: s.restart == true ?1:s.level + 1,
        exit: s.bullets.concat(s.bomb)
        }
      }
      /**
       * Reduced state insipired by FRP Asteroids, used to insert the relevant informations when key presses are observed 
       * @param s 
       * @param e 
       * @returns 
       */
   const reduceState = (s:State, e:moveLeftRight | shoot | Tick | shootBomb)=>
      e instanceof moveLeftRight ? {
        ...s, ship: {...s.ship,horiDirection : s.aliens.length <= 16 ?e.direction+(e.direction*1):e.direction}
      }:
      e instanceof shoot ?{...s,
        bullets: s.bullets.concat([createBullet(s)]),
        objCount: s.objCount + 1
      }:
      e instanceof shootBomb ?{...s,
        bomb: s.aliens.length <= 16?s.bomb.concat([createBomb(s)]): [],
        objCount: s.objCount + 1
      }:
      tick(s,e.elapsed);
    /**
     * Show keys function adapted from FRP asteroids in order to show controls in HTML
     */
    function showKeys() {
      function showKey(k:Key) {
        const arrowKey = document.getElementById(k)!,
          o = (e:Event) => fromEvent<KeyboardEvent>(document,e).pipe(
            filter(({code})=>code === k))
        o('keydown').subscribe(e => arrowKey.classList.add("highlight"))
        o('keyup').subscribe(_=>arrowKey.classList.remove("highlight"))
      }
      showKey('ArrowLeft');
      showKey('ArrowRight');
      showKey('KeyQ');
      showKey('Space');
    }
    setTimeout(showKeys, 0)

    /**
     * main stream of the game 
     */
    const subscribe = merge(
        gameClock,moveLeft,moveLeftStop,moveRight,moveRightStop,shootAction,shootBombAction).pipe(
        scan(reduceState, initial))
      .subscribe(updateView);
  }
  /**
   * various functions adapted from FRP Asteroids
   */
  function flatMap<T,U>(
    a:ReadonlyArray<T>,
    f:(a:T)=>ReadonlyArray<U>
  ): ReadonlyArray<U> {
    return Array.prototype.concat(...a.map(f));
  }

  const not = <T>(f:(x:T)=>boolean)=> (x:T)=> !f(x),
        elem = 
        <T>(eq: (_:T)=>(_:T)=>boolean)=> 
        (a:ReadonlyArray<T>)=> 
        (e:T)=> a.findIndex(eq(e)) >= 0,
        except = 
        <T>(eq: (_:T)=>(_:T)=>boolean)=>
        (a:ReadonlyArray<T>)=> 
        (b:ReadonlyArray<T>)=> a.filter(not(elem(eq)(b))),
        
        numberRandomizer =  (min: number,max: number) :number =>{
          return Math.round(Math.random() * (max - min) + min);
        }
          
  // the following simply runs your pong function on window load.  Make sure to leave it in place.
  if (typeof window != 'undefined')
    window.onload = ()=>{
      spaceinvaders();
}
  
