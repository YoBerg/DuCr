var scene = '';
var board = document.getElementById("board");
var playerName = '';
var tiles = []; //tile codes are in tiles.txt
var rooms = [];
var playerX = 0;
var playerY = 0;
var playerXOrigin = 0;
var playerYOrigin = 0;
var keys = {};
for (var i=1;i<100;i++) {
    keys[i]=0;
}
var health = 6;
var totalHealth = 6;
var weapon = 'knife';
var lobbyUnlocks = [true,true,false,true,false,true,false,false,false,false,false,false,false,false,false,false];
var coins = 0;
var damageValues = {'knife':1,'swordAndShield':2,'sword':2,'bloodSword':2,'ultimateSword':50};
var blockChance = {'swordAndShield':33,'ultimateSword':50}
var enemies = [];//type, x, y, health, turntimer.
var items = []; //type, x, y
var playerMoved = false;
var playerAttacked = false;
var attackPeriod = 0;
var button = [];//x,y,state,event
var ladderOpen = false;
var runGame;
var inventory = ["none","none","none","none","none","none","none","none","none","none",]
var playerCooldownTimer = 0;

//Creates and manages the login screen
document.getElementById("MenuNew").addEventListener("click", function() {
    resetBoard();
    addToBoard("<h1 class='Title' id='Title'>Choose Your Name</h1><br><center><input class='input' id='nameSelection'><br><button class='input' id='nameConfirm'>Confirm</button></center>");
    document.getElementById("nameConfirm").addEventListener("click", function() {
        playerName = String(document.getElementById("nameSelection").value);
        if (playerName.length<3) {
            alert('Error! Please have a player name of at least 3 characters');
        }
        else if (playerName.length>10) {
            alert('Error! Please have a player name of at most 10 characters');
        }
        else {
            if (playerName=='Sewell') {
                weapon='ultimateSword';
            }
            loadGame();
        }
    });
});
document.getElementById("MenuContinue").addEventListener("click", function() {
    board.innerHTML = "<h1 class='Title' id='Title'>Enter Your Code</h1><br><center><input class='input' id='code'><br><button class='input' id='confirmCode'>Confirm</button></center>";
    document.getElementById("confirmCode").addEventListener("click", function() {
        var code = String(document.getElementById("code").value);
        lobbyUnlocks = [];
        for (i=0;i<=15;i++) {
            if (code.charAt(i)==1) {
                lobbyUnlocks.push(true);
            }
            else {
                lobbyUnlocks.push(false);
            }
        }
        if (code.slice(16,18)=='01') {
            weapon = 'knife';
        }
        else if (code.slice(16,18)=='02') {
            weapon = 'swordAndShield';
        }
        else if (code.slice(16,18)=='03') {
            weapon = 'sword';
        }
        else if (code.slice(16,18)=='11') {
            weapon = 'bloodSword';
        }
        else if (code.slice(16,18)=='99') {
            weapon = 'ultimateSword';
        }
        health = 0;
        for(i=0;i<10;i++) {
            if (code.charAt(18+i)=='1') {
                health+=2;
            }
            else if (code.charAt(18+i)=='2') {
                health+=1;
            }
        }
        totalHealth = Number(code.slice(28,30));
        coins = Number(code.slice(30,36));
        for (i=0;i<10;i++) {
            currentSlice = code.slice(36+(2*i),38+(2*i));
            if (currentSlice == '01') { inventory[i] = 'healing_potion_mk1' }
            else if (currentSlice == '02') { inventory[i] = 'healing_potion_mk2' }
        }
        playerName = code.slice(56,);
        loadGame();
    });
});
//mainFunction runs every 10 ms
function mainFunction() {
    
    //set up -------------------------------
    
    //calculating player and tile locations.
    attackPeriod--;
    var char = document.getElementById('char');
    var tileLoc = document.querySelectorAll(".tile");
    if (attackPeriod<=0) {
        char.style.top = '296px';
        char.style.left = '300px';
    }
    document.getElementById("tilehost").style.left = String(8+(6-playerXOrigin)*48)+'px';
    document.getElementById("tilehost").style.top = String(8+(6-playerYOrigin)*48)+'px';
    document.getElementById("damageStat").innerHTML = "Damage: "+String(damageValues[weapon]);
    document.getElementById("weapon").src = "resources/weapons/" + weapon + ".gif";
    
    //calculating health
    if (health > 0) {
        health = (health>totalHealth) ? totalHealth : health; //if health is higher than total health, health is set to total health
        var emptyHealth = totalHealth - health;
        var healthAccount = health;
        var heartIndex = 0;
        for (var i = healthAccount;i>=2;i-=2) {
            heartIndex++;
            document.getElementById("health"+String(heartIndex)).src = "resources/misc/heart_full.png";
            healthAccount-=2;
        }
        if (healthAccount==1) {
            heartIndex++;
            document.getElementById("health"+String(heartIndex)).src = "resources/misc/heart_half.png";
            emptyHealth--;
    }
        for (var i = emptyHealth;i>0;i-=2) {
            heartIndex++;
            document.getElementById("health"+String(heartIndex)).src = "resources/misc/heart_empty.png";
        }
    }
    else {
        clearInterval(runGame);
        addToBoard("<h1 class='Title'>Game Over!</h1>");
        alert("Oh no! You have died!");
        var emptyHealth = totalHealth - health;
        var healthAccount = health;
        var heartIndex = 0;
        for (var i = healthAccount;i>=2;i-=2) {
            heartIndex++;
            document.getElementById("health"+String(heartIndex)).src = "resources/misc/heart_full.png";
            healthAccount-=2;
        }
        if (healthAccount==1) {
            heartIndex++;
            document.getElementById("health"+String(heartIndex)).src = "resources/misc/heart_half.png";
            emptyHealth--;
        }
        for (var i = emptyHealth;i>0;i-=2) {
            heartIndex++;
            document.getElementById("health"+String(heartIndex)).src = "resources/misc/heart_empty.png";
        }
    }

    if (coins>=1000000) { coins = 999999 }
    //setup complete -----------------------
    
    onkeyup = onkeydown = function(e){
        e = e || event;
        if (e.type == 'keydown') {
            keys[e.keyCode]++;
        }
        else {
            keys[e.keyCode]=0;
        }
    }; //updates list of pressed keys
    
    //calculating the player's next location based on key presses.
    var nextStep = [playerX,playerY];
    if (keys[38]==1) {
        nextStep = [playerX,playerY-1];
        keys[38]=2;
        char.src = 'resources/char/char0.1.png';
        playerMoved = true;
    } else if (keys[39]==1) {
        nextStep = [playerX+1,playerY];
        keys[39]=2;
        char.src = 'resources/char/char0.2.png';
        playerMoved = true;
    } else if (keys[40]==1) {
        nextStep = [playerX,playerY+1];
        keys[40]=2;
        char.src = 'resources/char/char0.3.png';
        playerMoved = true;
    } else if (keys[37]==1) {
        nextStep = [playerX-1,playerY];
        keys[37]=2;
        char.src = 'resources/char/char0.4.png';
        playerMoved = true;
    }
    for (var n = 48; n <= 57; n++) {
        if (keys[n]==1 && playerCooldownTimer < 1) {
            keys[n] = 2;
            useItem(n-48);
        }
    }
    //cancels movement if player is moving into a wall.
    if (tiles[nextStep[1]+playerYOrigin][nextStep[0]+playerXOrigin]>=10&&tiles[nextStep[1]+playerYOrigin][nextStep[0]+playerXOrigin]<=19) {
        nextStep = [playerX,playerY];
        playerMoved = false;
    }

    if (playerCooldownTimer > 0) {
        nextStep = [playerX,playerY];
        playerMoved = true;
        playerCooldownTimer--;
        sleep(500);
    }

    var textLoc = document.querySelectorAll(".lobbyText");
    
    if (nextStep!=[playerX,playerY]) {
        for (var i=0;i<enemies.length;i++) {
            var currentEnemy = document.getElementById('enemy'+String(i));
            if (nextStep[0]+playerXOrigin==enemies[i][1]&&nextStep[1]+playerYOrigin==enemies[i][2]) {
                enemies[i][3]-=damageValues[weapon];
                char.style.left = String(296+48*(nextStep[0]-playerX))+'px';
                char.style.top = String(300+48*(nextStep[1]-playerY))+'px';
                nextStep=[playerX,playerY];
                attackPeriod = 10;
                playerAttacked = true;
            } // damages enemies via basic attack
            
            if (enemies[i][3] > 0 && playerMoved == true) {
                enemies[i][4]--;
                if (enemies[i][4] == 0) {
                    if (enemies[i][0] == 'green_slime') {
                        var enemyNextPos = [enemies[i][1],enemies[i][2]];
                        randInt = Math.floor(Math.random()*3.999);
                        
                        //picks a random direction
                        if (randInt == 0) {
                            enemyNextPos[0]++;
                        }
                        if (randInt == 1) {
                            enemyNextPos[1]++;
                        }
                        if (randInt == 2) {
                            enemyNextPos[0]--;
                        }
                        if (randInt == 3) {
                            enemyNextPos[1]--;
                        }
                        
                        //checks if the enemy is colliding with a wall
                        if (tiles[enemyNextPos[1]][enemyNextPos[0]] >= 10 && tiles[enemyNextPos[1]][enemyNextPos[0]] <= 19) {
                            enemyNextPos = [enemies[i][1],enemies[i][2]];
                        }
                        
                        //checks if the enemy is colliding with the player
                        else if (enemyNextPos[0] == nextStep[0]+playerXOrigin && enemyNextPos[1] == nextStep[1]+playerYOrigin) {
                            randInt = Math.floor(Math.random()*99.99999) + 1;
                            if (randInt >= (blockChance[weapon] != undefined ? blockChance[weapon] : 0)) {
                                health--;
                            }
                            enemyNextPos = [enemies[i][1],enemies[i][2]];
                        }

                        //checks if the enemy is colliding with another enemy
                        else if (checkEnemyCollision(enemyNextPos[0],enemyNextPos[1]) != null) {
                            enemyNextPos = [enemies[i][1],enemies[i][2]];
                        }
                        
                        //moves the enemy
                        else {
                            enemies[i][1] = enemyNextPos[0];
                            enemies[i][2] = enemyNextPos[1];
                        }
                        enemies[i][4] = 2;
                    } // green slime's AI
                    if (enemies[i][0] == 'goblin' || enemies[i][0] == 'armored_goblin') {
                        var enemyNextPos = [enemies[i][1],enemies[i][2]]
                        
                        //setting the finder type from pathfinder
                        var finder = new PF.AStarFinder({
                            allowDiagonal: false,
                            dontCrossCorners: true
                        });

                        //recreating the map in gridMatrix as 0 for floors and 1 for walls
                        var gridMatrix = []
                        for (row in tiles) {
                            gridMatrix.push([])
                            for (tile in tiles[row]) {
                                var newTile = (tiles[row][tile] <= 19 && tiles[row][tile] >= 10 ? 1 : 0)
                                gridMatrix[row].push(newTile)
                            }
                        }
                        
                        var grid = new PF.Grid(gridMatrix);
                        var path = finder.findPath(enemies[i][1], enemies[i][2], playerX+playerXOrigin, playerY+playerYOrigin, grid);
                        enemyNextPos = path[1]

                        //enforces a view distance
                        if (path.length >= 12) {
                            enemyNextPos = [enemies[i][1],enemies[i][2]];
                            randInt = Math.floor(Math.random()*3.999);
                            
                            //picks a random direction
                            if (randInt == 0) {
                                enemyNextPos[0]++;
                            }
                            if (randInt == 1) {
                                enemyNextPos[1]++;
                            }
                            if (randInt == 2) {
                                enemyNextPos[0]--;
                            }
                            if (randInt == 3) {
                                enemyNextPos[1]--;
                            }
                        }

                        //checks if the enemy is colliding with a wall
                        if (tiles[enemyNextPos[1]][enemyNextPos[0]] >= 10 && tiles[enemyNextPos[1]][enemyNextPos[0]] <= 19) {
                            enemyNextPos = [enemies[i][1],enemies[i][2]];
                        }
                        
                        //checks if the enemy is colliding with another enemy
                        else if (checkEnemyCollision(enemyNextPos[0],enemyNextPos[1]) != null) {
                            enemyNextPos = [enemies[i][1],enemies[i][2]];
                        }

                        //checks if the enemy is colliding with the player
                        else if (enemyNextPos[0] == nextStep[0]+playerXOrigin && enemyNextPos[1] == nextStep[1]+playerYOrigin) {
                            randInt = Math.floor(Math.random()*99.99999) + 1;
                            if (randInt >= (blockChance[weapon] != undefined ? blockChance[weapon] : 0)) {
                                health -= 2;
                            }
                            enemyNextPos = [enemies[i][1],enemies[i][2]];
                        }
                        
                        //moves the enemy
                        else {
                            enemies[i][1] = enemyNextPos[0];
                            enemies[i][2] = enemyNextPos[1];
                        }
                        enemies[i][4] = 2;
                    }
                } // enemy actions
            } // processes enemy turns
            
            if (enemies[i][3] <= 0) {

                // generates enemy drops and determines enemy to delete
                var randInt = Math.floor(Math.random()*999.999);
                if (randInt >= 1 && randInt <= 50 && enemies[i][0] == 'green_slime') {
                    addItem("coin",enemies[i][1],enemies[i][2]);
                    currentEnemy = document.getElementById('enemy'+String(i));
                } else if (randInt >= 1 && randInt <= 200 && enemies[i][0] == 'goblin') {
                    addItem("coin",enemies[i][1],enemies[i][2]);
                    currentEnemy = document.getElementById('enemy'+String(i));
                } else if (randInt >= 1 && randInt <= 250 && enemies[i][0] == 'armored_goblin') {
                    addItem("coin",enemies[i][1],enemies[i][2]);
                    currentEnemy = document.getElementById('enemy'+String(i));
                }
                
                enemies.splice(i,1);
                currentEnemy.remove(); // deletes defeated enemy
                var i2 = 1;
                while (true) {
                    if (document.getElementById('enemy'+String(i+i2)) != null) {
                        document.getElementById('enemy'+String(i+i2)).id = 'enemy'+String(i+i2-1);
                        i2++;
                    }
                    else {
                        break;
                    }
                } // reorders enemy list (prevents 'gaps' that crashes the game)
                i--;
            } // deletes defeated enemies
        } //handles enemy interactions
        
        for (var i=0;i<items.length;i++) {
            var currentItem = document.getElementById('item'+String(i));
            currentItem.style.top = String(Number(currentItem.style.top.slice(0,currentItem.style.top.length-2))-((nextStep[1]-playerY)*48))+'px';
            currentItem.style.left = String(Number(currentItem.style.left.slice(0,currentItem.style.left.length-2))-((nextStep[0]-playerX)*48))+'px';
            if (nextStep[0]+playerXOrigin==items[i][1]&&nextStep[1]+playerYOrigin==items[i][2]) {
                if (items[i][0]=='coin') {
                    coins+=1;
                    items.splice(i,1);
                    currentItem.remove();
                    i2 = 1;
                    while (true) {
                        if (document.getElementById('item'+String(i+i2)) != null) {
                            document.getElementById('item'+String(i+i2)).id = 'item'+String(i+i2-1);
                            i2++;
                        }
                        else {
                            break;
                        }
                    } // reorders enemy list (prevents 'gaps' that crashes the game)
                    i--;
                }
            } //handles item pickups
        } //handles item interactions
        
        if (nextStep[0]+playerXOrigin==button[0]&&nextStep[1]+playerYOrigin==button[1]&&button[2]=='up') {
            document.getElementById('button').src = "resources/tiles/button_down.png";
            button[2]='down';
            buttonEvent();
        } //handles button interactions
    } // interaction handler
    if (playerAttacked == false) {
        for (var i=0;i<enemies.length;i++) {
            currentEnemy = document.getElementById('enemy'+String(i));
            currentEnemy.style.top = String(296+(enemies[i][2]-(playerY+playerYOrigin))*48)+'px';
            currentEnemy.style.left = String(296+(enemies[i][1]-(playerX+playerXOrigin))*48)+'px';
        }
    } // handles enemy rendering
    
    for (var i=0;i<textLoc.length;i++) {
        textLoc[i].style.left = String(Number(textLoc[i].style.left.slice(0,textLoc[i].style.left.length-2))-((nextStep[0]-playerX)*48))+'px';
        textLoc[i].style.top = String(Number(textLoc[i].style.top.slice(0,textLoc[i].style.top.length-2))-((nextStep[1]-playerY)*48))+'px';
    } // moving the locations of the text to adjust to the player's old location
    
    //updating the player's new location
    playerX = nextStep[0];
    playerY = nextStep[1];
    
    for (var i=0;i<tileLoc.length;i++) {
        if (tileLoc[i].id == 'button') {
            tileLoc[i].style.left = String(-(playerX*48)+(button[0]*48))+'px';
            tileLoc[i].style.top = String(-(playerY*48)+(button[1]*48))+'px';
        } else {
            tileLoc[i].style.left = String(-(playerX*48))+'px';
            tileLoc[i].style.top = String(-(playerY*48))+'px';
        }
    } // moving the locations of the tiles to adjust to the player's new location
    
    if (weapon=='ultimateSword') {
        char.src = 'resources/char/charS.1.png';
    } // retextures the player if they wield the Sewell Sword secret. I mean what secret? No secret here look elsewhere.
    
    document.getElementById("coinCount").innerHTML = 'x'+String(coins); // updating coin count
    
    if (scene=='lobby') {
        if (playerX==-3&&playerY==-2&&lobbyUnlocks[0]) {
            giveSaveCode();
            
            //updating player location (so save doesn't infinitely activate)
            playerX = 0;
            playerY = 0;
            
            for (var i=0;i<textLoc.length;i++) {
                textLoc[i].style.left = String(Number(textLoc[i].style.left.slice(0,textLoc[i].style.left.length-2))-144)+'px';
                textLoc[i].style.top = String(Number(textLoc[i].style.top.slice(0,textLoc[i].style.top.length-2))-96)+'px';
            } //moving the locations of the tiles to adjust to the player's new location
            
        }// Save
        if (playerX==-1&&playerY==-2&&lobbyUnlocks[1]) {
            
            //resetting the player's location
            playerX = 0;
            playerY = 0;
            button = [1,12,'up','openLadder'];
            changeTabTitle('DuCr : Tutorial');
            
            //creates the tutorial room
            document.getElementById("tilehost").innerHTML = "";
            tiles = [];
            tiles.push([00,00,11,11,11,11,11,00,00]);
            tiles.push([00,00,11,01,01,01,11,00,00]);
            tiles.push([00,00,11,01,01,01,11,00,00]);
            tiles.push([00,00,11,01,01,01,11,00,00]);
            tiles.push([00,00,11,11,01,11,11,00,00]);
            tiles.push([00,00,00,11,01,11,00,00,00]);
            tiles.push([00,00,00,11,01,11,00,00,00]);
            tiles.push([00,00,00,11,01,11,00,00,00]);
            tiles.push([11,11,11,11,01,11,11,11,11]);
            tiles.push([11,01,01,01,01,01,01,01,11]);
            tiles.push([11,01,01,01,01,01,01,01,11]);
            tiles.push([11,01,01,01,01,01,01,01,11]);
            tiles.push([11,01,01,01,01,01,01,01,11]);
            tiles.push([11,01,01,01,01,01,01,01,11]);
            tiles.push([11,01,01,01,01,01,01,01,11]);
            tiles.push([11,01,01,01,01,01,01,01,11]);
            tiles.push([11,11,11,01,01,01,11,11,11]);
            tiles.push([00,00,11,01,21,01,11,00,00]);
            tiles.push([00,00,11,11,11,11,11,00,00]);
            document.getElementById("tilehost").innerHTML = loadScreen();
            
            //places player
            playerXOrigin = 4;
            playerYOrigin = 2;
            
            //creates and places entities
            enemies.push(['dummy',1,10,200,1]);   
            items.push(['coin',7,11]);
            
            //creates tutorial text
            document.getElementById("lobbyTextHost").innerHTML = "<p class='lobbyText' style='top:953px;left:245px;'>Once open<br> walk on the hatch to exit!</p>";
            document.getElementById("lobbyTextHost").innerHTML += "<p class='lobbyText' style='top:695px;left:195px;'>Move onto the dummy to attack!</p>";
            document.getElementById("lobbyTextHost").innerHTML += "<p class='lobbyText' style='top:743px;left:230px;'>Move onto an item to pick it up!</p>";
            document.getElementById("lobbyTextHost").innerHTML += "<p class='lobbyText' style='top:791px;left:205px;'>You may have to press a button!</p>";
            
            renderEntities();
            lobbyUnlocks[1] = false;
            ladderOpen = false;
            scene = 'tutorial';
        }//Tutorial
        if (playerX==3&&playerY==-2&&lobbyUnlocks[3]) {
            playerX = 0;
            playerY = 0;
            playerXOrigin = 6;
            playerYOrigin = 2;
            changeTabTitle("DuCr : Shop");

            document.getElementById("tilehost").innerHTML = "";
            tiles = [];
            tiles.push([11,11,11,11,11,11,11,11,11,11,11,11,11]);
            tiles.push([11,01,01,01,01,01,20,01,01,01,01,01,11]);
            tiles.push([11,01,01,01,01,01,01,01,01,01,01,01,11]);
            tiles.push([11,01,01,01,01,01,01,01,01,01,01,01,11]);
            tiles.push([11,01,01,01,01,01,01,01,01,01,01,01,11]);
            tiles.push([11,11,11,11,11,11,11,11,11,11,11,11,11]);
            document.getElementById("tilehost").innerHTML = loadScreen();

            document.getElementById("lobbyTextHost").innerHTML = "";

            if (lobbyUnlocks[5]) {
                document.getElementById("lobbyTextHost").innerHTML += "<p class='lobbyText' style='left:156px;top:312px;width:48px;' id='swordText'>Sword<br>20C</p>";
                document.getElementById("lobbyTextHost").innerHTML += "<img class='lobbyText' style='left:144px;top:336px;width:64px;height:64px;z-index:1;' id='swordImage' src='resources/weapons/sword.gif'>";
            }

            scene = 'shop';
        }//Shop
        if (playerX==-1&&playerY==0&&lobbyUnlocks[5]) {
            alert("Loading may take a while... Please press 'enter' and standby.")
            //places the player
            playerX=0;
            playerY=0;
            playerXOrigin=27;
            playerYOrigin=27;
            rooms = [];
            changeTabTitle("DuCr : Zone 1 - 1")
            
            preloadImage("resources/enemies/green_slime.gif");
            preloadImage("resources/enemies/goblin.gif");
            
            //generates the rooms
            document.getElementById("tilehost").innerHTML = "";
            const room1Rooms = [
                [[11,11,11,11,11,01,11,11,11,11,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [01,01,01,01,01,01,01,01,01,01,01],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,11,11,11,11,01,11,11,11,11,11]],
                [[11,11,11,11,11,01,11,11,11,11,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,11,11,01,01,01,11,11,01,11],
                [11,01,11,01,01,01,01,01,11,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [01,01,01,01,01,11,01,01,01,01,01],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,11,01,01,01,01,01,11,01,11],
                [11,01,11,11,01,01,01,11,11,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,11,11,11,11,01,11,11,11,11,11]],
                [[11,11,11,11,11,01,11,11,11,11,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,11,01,11,01,01,01,11],
                [11,01,01,11,11,01,11,11,01,01,11],
                [01,01,01,01,01,01,01,01,01,01,01],
                [11,01,01,11,11,01,11,11,01,01,11],
                [11,01,01,01,11,01,11,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,11,11,11,11,01,11,11,11,11,11]],
                [[11,11,11,11,11,01,11,11,11,11,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,11,11,11,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,11,01,01,01,01,01,11,01,11],
                [01,01,11,01,01,01,01,01,11,01,01],
                [11,01,11,01,01,01,01,01,11,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,11,11,11,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,11,11,11,11,01,11,11,11,11,11]]]; // possible rooms
            var randInt = Math.floor(Math.random()*24);
            if (randInt == 12) {
                randInt = 24;
            }
            for (var i=0;i<25;i++) {
                if (randInt == i) { 
                    rooms.push([
                    [11,11,11,11,11,01,11,11,11,11,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [01,01,01,01,01,01,01,01,01,01,01],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,11,11,11,11,01,11,11,11,11,11]]); //button room
                } // creates button room
                else if (i == 12) {
                    rooms.push([
                    [11,11,11,11,11,01,11,11,11,11,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [01,01,01,01,01,21,01,01,01,01,01],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,11,11,11,11,01,11,11,11,11,11]]);
                } // creates spawn room
                else {
                    var randInt2 = Math.floor(Math.random()*(room1Rooms.length));
                    rooms.push(room1Rooms[randInt2]); // random room
                    if (randInt2 == 1) {
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+3, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+3, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+7, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+7, 1, 2]);
                    }
                    else if (randInt2 == 2) {
                        enemies.push(["green_slime", (i%5)*11+2, Math.floor(i/5)*11+2, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+8, Math.floor(i/5)*11+2, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+2, Math.floor(i/5)*11+8, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+8, Math.floor(i/5)*11+8, 1, 2]);
                    }
                    else if (randInt2 == 3) {
                        enemies.push(["goblin", (i%5)*11+5, Math.floor(i/5)*11+5, 1, 2]);
                    }
                }              // creates other rooms
            } // floor creation
            
            // loads every room into a single list & creates outer walls
            tiles = [];
            for (var i=0;i<55;i++) {
                tiles.push([]);
            }
            var i3=0;
            var i4=0;
            for (var i=0;i<55;i++) {
                for (var i2=0;i2<5;i2++) {
                    tiles[i] = tiles[i].concat(rooms[i2+i4][i3]);
                }
                i3++;
                if (i3==11) {
                    i3 = 0;
                    i4+=5;
                }
            }
            for (var i=0;i<55;i++) {
                tiles[0][i] = 11;
                tiles[54][i] = 11;
            }
            for (var i=0;i<55;i++) {
                tiles[i][0] = 11;
                tiles[i][54] = 11;
            }

            // activates the button
            button = [0,0,'up','openLadder'];
            while (randInt>4) {
                button[1]+=11;
                randInt-=5;
            }
            while (randInt>0) {
                button[0]+=11;
                randInt-=1;
            }
            button[0]+=5;
            button[1]+=5;
            
            document.getElementById("tilehost").innerHTML = loadScreen(); // places rooms on the screen
            document.getElementById("lobbyTextHost").innerHTML = ''; // clears lingering text from other stages
            
            ladderOpen = false;
            
            scene = 'Zone 1 - 1';
            renderEntities();
        } //Zone 1 - 1
    }
    else if (scene=='tutorial') {
        if (ladderOpen==true&&playerX==0&&playerY==15) {
            returnToLobby();
        } // returns player to the lobby
    } //Back to lobby
    else if (scene=='Zone 1 - 1') {
        if (playerX==0&&playerY==0&&ladderOpen) {

            alert("Loading may take a while... Please press 'enter' and standby.")
            //places the player
            playerX=0;
            playerY=0;
            playerXOrigin=27;
            playerYOrigin=27;
            rooms = [];
            enemies = [];
            items = [];
            scene = 'Zone 1 - 2';
            $(".enemy").remove();
            changeTabTitle('DuCr : Zone 1 - 2')
            
            preloadImage("resources/enemies/green_slime.gif");
            preloadImage("resources/enemies/goblin.gif")
            
            //generates the rooms
            document.getElementById("tilehost").innerHTML = "";
            const room1Rooms = [
                [[11,11,11,11,11,01,11,11,11,11,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [01,01,01,01,01,01,01,01,01,01,01],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,11,11,11,11,01,11,11,11,11,11]],
                [[11,11,11,11,11,01,11,11,11,11,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,11,11,01,01,01,11,11,01,11],
                [11,01,11,01,01,01,01,01,11,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [01,01,01,01,01,11,01,01,01,01,01],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,11,01,01,01,01,01,11,01,11],
                [11,01,11,11,01,01,01,11,11,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,11,11,11,11,01,11,11,11,11,11]],
                [[11,11,11,11,11,01,11,11,11,11,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,11,01,11,01,01,01,11],
                [11,01,01,11,11,01,11,11,01,01,11],
                [01,01,01,01,01,01,01,01,01,01,01],
                [11,01,01,11,11,01,11,11,01,01,11],
                [11,01,01,01,11,01,11,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,11,11,11,11,01,11,11,11,11,11]],
                [[11,11,11,11,11,01,11,11,11,11,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,11,11,11,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,11,01,01,01,01,01,11,01,11],
                [01,01,11,01,01,01,01,01,11,01,01],
                [11,01,11,01,01,01,01,01,11,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,11,11,11,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,11,11,11,11,01,11,11,11,11,11]],
                [[11,01,01,01,01,01,01,01,01,01,11],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [11,01,01,01,01,01,01,01,01,01,11]]]; // possible rooms
            var randInt = Math.floor(Math.random()*24);
            if (randInt == 12) {
                randInt = 24;
            }
            for (var i=0;i<25;i++) {
                if (randInt == i) { 
                    rooms.push([
                    [11,11,11,11,11,01,11,11,11,11,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [01,01,01,01,01,01,01,01,01,01,01],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,11,11,11,11,01,11,11,11,11,11]]); //button room
                    enemies.push(["goblin", (i%5)*11+4, Math.floor(i/5)*11+4, 1, 1]);
                    enemies.push(["goblin", (i%5)*11+6, Math.floor(i/5)*11+4, 1, 1]);
                    enemies.push(["goblin", (i%5)*11+4, Math.floor(i/5)*11+6, 1, 1]);
                    enemies.push(["goblin", (i%5)*11+6, Math.floor(i/5)*11+6, 1, 1]);
                } // creates button room
                else if (i == 12) {
                    rooms.push([
                    [11,11,11,11,11,01,11,11,11,11,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [01,01,01,01,01,21,01,01,01,01,01],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,11,11,11,11,01,11,11,11,11,11]]);
                    enemies.push(["green_slime", (i%5)*11+2, Math.floor(i/5)*11+2, 1, 1]);
                    enemies.push(["green_slime", (i%5)*11+8, Math.floor(i/5)*11+2, 1, 1]);
                    enemies.push(["green_slime", (i%5)*11+2, Math.floor(i/5)*11+8, 1, 1]);
                    enemies.push(["green_slime", (i%5)*11+8, Math.floor(i/5)*11+8, 1, 1]);
                } // creates spawn room
                else {
                    var randInt2 = Math.floor(Math.random()*(room1Rooms.length));
                    rooms.push(room1Rooms[randInt2]); // random room
                    if (randInt2 == 1) {
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+3, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+3, 1, 1]);
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+7, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+7, 1, 1]);
                    }
                    else if (randInt2 == 2) {
                        enemies.push(["goblin", (i%5)*11+2, Math.floor(i/5)*11+2, 1, 1]);
                        enemies.push(["goblin", (i%5)*11+8, Math.floor(i/5)*11+2, 1, 2]);
                        enemies.push(["goblin", (i%5)*11+2, Math.floor(i/5)*11+8, 1, 1]);
                        enemies.push(["goblin", (i%5)*11+8, Math.floor(i/5)*11+8, 1, 2]);
                    }
                    else if (randInt2 == 3) {
                        enemies.push(["goblin", (i%5)*11+5, Math.floor(i/5)*11+5, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+3, 1, 1]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+3, 1, 1]);
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+7, 1, 1]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+7, 1, 1]);
                    }
                    else if (randInt2 == 4) {
                        enemies.push(["goblin", (i%5)*11+5, Math.floor(i/5)*11+5, 1, 1]);
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+3, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+3, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+7, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+7, 1, 2]);
                    }
                }              // creates other rooms
            } // floor creation
            
            // loads every room into a single list & creates outer walls
            tiles = [];
            for (var i=0;i<55;i++) {
                tiles.push([]);
            }
            var i3=0;
            var i4=0;
            for (var i=0;i<55;i++) {
                for (var i2=0;i2<5;i2++) {
                    tiles[i] = tiles[i].concat(rooms[i2+i4][i3]);
                }
                i3++;
                if (i3==11) {
                    i3 = 0;
                    i4+=5;
                }
            }
            for (var i=0;i<55;i++) {
                tiles[0][i] = 11;
                tiles[54][i] = 11;
            }
            for (var i=0;i<55;i++) {
                tiles[i][0] = 11;
                tiles[i][54] = 11;
            }
            
            // activates the button
            button = [0,0,'up','openLadder'];
            while (randInt>4) {
                button[1]+=11;
                randInt-=5;
            }
            while (randInt>0) {
                button[0]+=11;
                randInt-=1;
            }
            button[0]+=5;
            button[1]+=5;

            document.getElementById("tilehost").innerHTML = loadScreen(); // places rooms on the screen
            document.getElementById("lobbyTextHost").innerHTML = ''; // clears lingering text from other stages
            
            ladderOpen = false;
            renderEntities();
        }
    } //Zone 1 - 2
    else if (scene=='Zone 1 - 2') {
        if (playerX==0&&playerY==0&&ladderOpen) {

            alert("Loading may take a while... Please press 'enter' and standby.")
            //places the player
            playerX=0;
            playerY=0;
            playerXOrigin=27;
            playerYOrigin=27;
            rooms = [];
            enemies = [];
            items = [];
            scene = 'Zone 1 - 3';
            $(".enemy").remove();
            changeTabTitle('DuCr : Zone 1 - 3')
            
            preloadImage("resources/enemies/green_slime.gif");
            preloadImage("resources/enemies/goblin.gif");
            preloadImage("resources/enemies/armored_goblin.gif");
            
            //generates the rooms
            document.getElementById("tilehost").innerHTML = "";
            const room1Rooms = [
                [[11,11,11,11,11,01,11,11,11,11,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [01,01,01,01,01,01,01,01,01,01,01],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,11,11,11,11,01,11,11,11,11,11]],
                [[11,11,11,11,11,01,11,11,11,11,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,11,11,01,01,01,11,11,01,11],
                [11,01,11,01,01,01,01,01,11,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [01,01,01,01,01,11,01,01,01,01,01],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,11,01,01,01,01,01,11,01,11],
                [11,01,11,11,01,01,01,11,11,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,11,11,11,11,01,11,11,11,11,11]],
                [[11,11,11,11,11,01,11,11,11,11,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,11,01,11,01,01,01,11],
                [11,01,01,11,11,01,11,11,01,01,11],
                [01,01,01,01,01,01,01,01,01,01,01],
                [11,01,01,11,11,01,11,11,01,01,11],
                [11,01,01,01,11,01,11,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,11,11,11,11,01,11,11,11,11,11]],
                [[11,11,11,11,11,01,11,11,11,11,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,11,11,11,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,11,01,01,01,01,01,11,01,11],
                [01,01,11,01,01,01,01,01,11,01,01],
                [11,01,11,01,01,01,01,01,11,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,01,01,01,11,11,11,01,01,01,11],
                [11,01,01,01,01,01,01,01,01,01,11],
                [11,11,11,11,11,01,11,11,11,11,11]],
                [[11,01,01,01,01,01,01,01,01,01,11],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [11,01,01,01,01,01,01,01,01,01,11]],
                [[11,01,01,01,01,01,01,01,01,01,11],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [01,01,01,01,01,01,01,01,01,01,01],
                [11,01,01,01,01,01,01,01,01,01,11]]]; // possible rooms
            var randInt = Math.floor(Math.random()*24);
            if (randInt == 12) {
                randInt = 24;
            }
            for (var i=0;i<25;i++) {
                if (randInt == i) { 
                    rooms.push([
                    [11,11,11,11,11,01,11,11,11,11,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [01,01,01,01,01,01,01,01,01,01,01],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,11,11,11,11,01,11,11,11,11,11]]); //button room
                    enemies.push(["armored_goblin", (i%5)*11+4, Math.floor(i/5)*11+4, 3, 1]);
                    enemies.push(["armored_goblin", (i%5)*11+6, Math.floor(i/5)*11+4, 3, 2]);
                    enemies.push(["armored_goblin", (i%5)*11+4, Math.floor(i/5)*11+6, 3, 1]);
                    enemies.push(["armored_goblin", (i%5)*11+6, Math.floor(i/5)*11+6, 3, 2]);
                } // creates button room
                else if (i == 12) {
                    rooms.push([
                    [11,11,11,11,11,01,11,11,11,11,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [01,01,01,01,01,21,01,01,01,01,01],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,01,01,01,01,01,01,01,01,01,11],
                    [11,11,11,11,11,01,11,11,11,11,11]]);
                    enemies.push(["goblin", (i%5)*11+2, Math.floor(i/5)*11+2, 1, 3]);
                    enemies.push(["goblin", (i%5)*11+8, Math.floor(i/5)*11+2, 1, 3]);
                    enemies.push(["goblin", (i%5)*11+2, Math.floor(i/5)*11+8, 1, 3]);
                    enemies.push(["goblin", (i%5)*11+8, Math.floor(i/5)*11+8, 1, 3]);
                } // creates spawn room
                else {
                    var randInt2 = Math.floor(Math.random()*(room1Rooms.length));
                    rooms.push(room1Rooms[randInt2]); // random room
                    if (randInt2 == 1) {
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+3, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+3, 1, 1]);
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+7, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+7, 1, 1]);
                    }
                    else if (randInt2 == 2) {
                        enemies.push(["goblin", (i%5)*11+2, Math.floor(i/5)*11+2, 1, 1]);
                        enemies.push(["goblin", (i%5)*11+8, Math.floor(i/5)*11+2, 1, 2]);
                        enemies.push(["goblin", (i%5)*11+2, Math.floor(i/5)*11+8, 1, 1]);
                        enemies.push(["goblin", (i%5)*11+8, Math.floor(i/5)*11+8, 1, 2]);
                    }
                    else if (randInt2 == 3) {
                        enemies.push(["goblin", (i%5)*11+5, Math.floor(i/5)*11+5, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+3, 1, 1]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+3, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+7, 1, 1]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+7, 1, 2]);
                    }
                    else if (randInt2 == 4) {
                        enemies.push(["armored_goblin", (i%5)*11+5, Math.floor(i/5)*11+5, 3, 1]);
                    }
                    else if (randInt2 == 5) {
                        enemies.push(["goblin", (i%5)*11+5, Math.floor(i/5)*11+5, 1, 1]);
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+3, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+3, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+3, Math.floor(i/5)*11+7, 1, 2]);
                        enemies.push(["green_slime", (i%5)*11+7, Math.floor(i/5)*11+7, 1, 2]);
                    }
                }              // creates other rooms
            } // floor creation
            
            // loads every room into a single list & creates outer walls
            tiles = [];
            for (var i=0;i<55;i++) {
                tiles.push([]);
            }
            var i3=0;
            var i4=0;
            for (var i=0;i<55;i++) {
                for (var i2=0;i2<5;i2++) {
                    tiles[i] = tiles[i].concat(rooms[i2+i4][i3]);
                }
                i3++;
                if (i3==11) {
                    i3 = 0;
                    i4+=5;
                }
            }
            for (var i=0;i<55;i++) {
                tiles[0][i] = 11;
                tiles[54][i] = 11;
            }
            for (var i=0;i<55;i++) {
                tiles[i][0] = 11;
                tiles[i][54] = 11;
            }
            
            // activates the button
            button = [0,0,'up','openLadder'];
            while (randInt>4) {
                button[1]+=11;
                randInt-=5;
            }
            while (randInt>0) {
                button[0]+=11;
                randInt-=1;
            }
            button[0]+=5;
            button[1]+=5;

            document.getElementById("tilehost").innerHTML = loadScreen(); // places rooms on the screen
            document.getElementById("lobbyTextHost").innerHTML = ''; // clears lingering text from other stages
            
            ladderOpen = false;
            renderEntities();
        }
    } //Zone 1 - 3
    else if (scene=='Zone 1 - 3') {
        if (playerX==0&&playerY==0&&ladderOpen) {

            //places the player
            playerX=0;
            playerY=0;
            playerXOrigin=27;
            playerYOrigin=27;
            rooms = [];
            enemies = [];
            items = [];
            scene = 'Zone 1 - BOSS';
            $(".enemy").remove();
            changeTabTitle('DuCr : Zone 1 - BOSS')
            
            preloadImage("resources/enemies/green_slime.gif");
            preloadImage("resources/enemies/goblin.gif");
            preloadImage("resources/enemies/armored_goblin.gif");
            preloadImage("resources/enemies/boss_king_goblin.gif")
            
            //generates the rooms
            document.getElementById("tilehost").innerHTML = "";
            
            tiles = [];
            tiles.push([00,00,00,00,11,11,11,11,11,00,00,00,00]);
            tiles.push([00,00,00,00,11,00,00,00,11,00,00,00,00]);
            tiles.push([11,11,11,11,11,00,00,00,11,11,11,11,11]);
            tiles.push([11,00,00,00,00,00,00,00,00,00,00,00,11]);

            // activates the button
            button = [0,0,'up','openLadder'];
            while (randInt>4) {
                button[1]+=11;
                randInt-=5;
            }
            while (randInt>0) {
                button[0]+=11;
                randInt-=1;
            }
            button[0]+=5;
            button[1]+=5;

            document.getElementById("tilehost").innerHTML = loadScreen(); // places rooms on the screen
            document.getElementById("lobbyTextHost").innerHTML = ''; // clears lingering text from other stages
            
            ladderOpen = false;
            renderEntities();
        }
    }
    else if (scene=='shop') {
        if (playerX==0&&playerY==-1) {
            returnToLobby();
        } else if (playerX==-3&&playerY==1&&lobbyUnlocks[5]) {
            purchase('sword', 'weapon', 20);
        }
    } //Back to lobby
    
    //cleanup ------------------------------
    playerMoved = false;
    playerAttacked = false;
}
function loadGame() {
    
    //runs the main function
    scene='lobby';
    runGame = setInterval(mainFunction,10);
    setInterval(function() {
        preloadImage('resources/char/char0.1.png');
        preloadImage('resources/char/char0.2.png');
        preloadImage('resources/char/char0.3.png');
        preloadImage('resources/char/char0.4.png');
        preloadImage('resources/misc/heart_empty.png');
        preloadImage('resources/misc/heart_half.png');
        preloadImage('resources/misc/heart_full.png');
    },5000);
    
    //creates the lobby
    tiles.push([11,11,11,11,11,11,11,11,11,11,11,11,11]);
    for (var i=0;i<12;i++) {
        tiles.push([11,01,01,01,01,01,01,01,01,01,01,01,11]);
    }
    tiles.push([11,11,11,11,11,11,11,11,11,11,11,11,11]);
    for (var i=4;i<=10;i+=2) {
        for (var i2=3;i2<=9;i2+=2) {
            if (lobbyUnlocks[((i2-3)/2)+((i-4)*2)]==true) {
                tiles[i][i2] = 20;
            }
            else {
                tiles[i][i2] = 21;
            }
        }
    }
    
    //displays the lobby and characters.
    resetBoard();
    addToBoard("<div class='tilehost' id='tilehost'></div>");
    document.getElementById("tilehost").innerHTML = loadScreen();
    addToBoard("<img src='resources/char/char0.4.png' class='char' id='char'>");
    document.getElementById('char').style.top = '296px';
    document.getElementById('char').style.left = '300px';
    playerX = 0; 
    playerY = 0;
    playerXOrigin = 6; //places the player in the correct location
    playerYOrigin = 6;
    preloadImage('resources/char/char0.1.png');
    preloadImage('resources/char/char0.2.png');
    preloadImage('resources/char/char0.3.png');
    preloadImage('resources/char/char0.4.png');
    preloadImage('resources/tiles/dirtFloor.png');
    preloadImage('resources/tiles/woodenWall.png');
    preloadImage('resources/weapons/knife.gif');
    preloadImage('resources/misc/heart_empty.png');
    preloadImage('resources/misc/heart_half.png');
    preloadImage('resources/misc/heart_full.png');
    preloadImage('resources/inventoryItems/healing_potion_mk1.gif');
    preloadImage('resources/inventoryItems/healing_potion_mk2.gif');
    sideBarSetUp();
    addToBoard("<div id='lobbyTextHost'></div>");
    
    //Adding ladder labels
    document.getElementById("lobbyTextHost").innerHTML += "<p class='lobbyText' style='top:180px;left:248px;width:48px;'>Tutorial</p>";
    document.getElementById("lobbyTextHost").innerHTML += "<p class='lobbyText' style='top:276px;left:248px;width:48px;'>Zone 1</p>";
    document.getElementById("lobbyTextHost").innerHTML += "<p class='lobbyText' style='top:180px;left:152px;width:48px;'>Save</p>";
    document.getElementById("lobbyTextHost").innerHTML += "<p class='lobbyText' style='top:180px;left:440px;width:48px;'>Shop</p>";
}
function loadScreen() {
    var newScreen = '';
    for (var i=0;i<tiles.length;i++) {
        for (var i2=0;i2<tiles[i].length;i2++) {
            newScreen += "<img width=48 height=48 class='tile' src='resources/tiles/";
            if (tiles[i][i2]==00) {
                newScreen += "blank.png";
            }
            else if (tiles[i][i2]==01) {
                newScreen += "dirtFloor.png";
            }
            else if (tiles[i][i2]==11) {
                newScreen += "woodenWall.png";
            }
            else if (tiles[i][i2]==20) {
                newScreen += "ladder_open.png' id='ladder";
            }
            else if (tiles[i][i2]==21) {
                newScreen += "ladder_closed.png' id='ladder";
            }
            newScreen += "'>";
        }
        newScreen += '<br>';
    }
    if (button.length > 0) {
        newScreen += "<img width=48 height=48 class='tile' src='resources/tiles/button_" + 
        button[2] + ".png' id='button' style='z-index:0;position:absolute;'><br>";
    }
    return newScreen;
}
function preloadImage(url){
    var img=new Image();
    img.src=url;
}
function sideBarSetUp() {
    var i2 = 0;
    
    //creates the heart bar and positions it
    addToBoard("<div id='sideBar'>");
    addToBoard("<h1 class='sideBarText' id='healthTitle'>Health</h1>");
    document.getElementById("healthTitle").style.top = '12px';
    document.getElementById("healthTitle").style.left = '800px';
    for (var i = totalHealth;i>1;i-=2) {
        i2++;
        addToBoard("<img src='resources/misc/heart_empty.png' class='health' id='health"+String(i2)+"'>");
        document.getElementById("health"+String(i2)).style.top = '60px';
        document.getElementById("health"+String(i2)).style.left = String(756+(44*i2))+'px';
    } //creates the individual hearts and positions them
    
    addToBoard("<h1 class='sideBarText' id='weaponTitle'>Weapon</h1>"); //creates the weapon label and positions it
    document.getElementById("weaponTitle").style.top = '114px';
    document.getElementById("weaponTitle").style.left = '800px';
    
    addToBoard("<img id='weapon' src='resources/weapons/" + weapon + ".gif'>"); //creates the weapon image and positions it
    document.getElementById("weapon").style.top = '162px';
    document.getElementById("weapon").style.left = '800px';
    
    addToBoard("<h2 class='sideBarText' id='damageStat'></h2>"); //creates the damage counter label and positions it
    document.getElementById("damageStat").style.top = '162px';
    document.getElementById("damageStat").style.left = '880px';
    
    addToBoard("<img id='coin' src='resources/items/coin.png'>"); //creates the coin image and positions it
    document.getElementById("coin").style.top = '240px';
    document.getElementById("coin").style.left = '800px';
    
    addToBoard("<h1 class='sideBarText' id='coinCount'></h1>"); //creates the coin count label and positions it
    document.getElementById("coinCount").style.top = '240px';
    document.getElementById("coinCount").style.left = '850px';

    addToBoard("<h1 class='sideBarText' id='inventorySign'>Inventory:</h1>")
    document.getElementById("inventorySign").style.top = '318px';
    document.getElementById("inventorySign").style.left = '800px';

    for (n in inventory) {
        addToBoard("<img id='inventoryItem"+String(n) + "' width=64px height=64px class='inventoryItem' src='resources/inventoryItems/" + inventory[n] + ".gif'>")
        document.getElementById("inventoryItem"+String(n)).style.top = String(366 + (n <= 4 ? 0 : 78)) + 'px';
        document.getElementById("inventoryItem"+String(n)).style.left = String(800 + (n%5)*78) + 'px';
    }
    
    addToBoard("<p1 class='sideBarText' id='savedCode'>Go to 'Save' in the lobby to get your code here.</p1>"); //creates the save code label and positions it
    document.getElementById("savedCode").style.top = '650px';
    document.getElementById("savedCode").style.left = '800px';
    
    addToBoard("</div>");
}
function giveSaveCode() {
    var saveCode = "";
    for (var i=0;i<16;i++) {
        if (lobbyUnlocks[i]==true) {
            saveCode+="1";
        }
        else {
            saveCode+="0";
        }
    } //The first 16 characters, whether a ladder is open or closed.
    
    //creates the next 2 characters based on the weapon held.
    if (weapon=='knife') {
        saveCode+="01";
    }
    else if (weapon=='swordAndShield') {
        saveCode+="02";
    }
    else if (weapon=='sword') {
        saveCode+="03";
    }
    else if (weapon=='bloodSword') {
        saveCode+="11";
    }
    else if (weapon=='ultimateSword') {
        saveCode+="99";
    }
    else {
        saveCode+="00";
    }
    
    //creates the next 10 characters based on the player's health.
    var i2 = 10;
    for (var i=health;i>0;i-=2) {
        i2--;
        if(i==1) {
            saveCode+="2";
        }
        else {
            saveCode+="1";
        }
    }
    for (var i=i2;i>0;i--) {
        saveCode+="3";
    }
    if (totalHealth<10) {
        saveCode+="0"+String(totalHealth);
    }
    else {
        saveCode+=String(totalHealth);
    }
    
    //creates the next 3 characters based on the player's coin count.
    if (coins<=10) {
        saveCode += '0000'+String(coins);
    }
    else if (coins<=100) {
        saveCode += '000'+String(coins);
    }
    else if (coins<=1000) {
        saveCode += '00'+String(coins);
    }
    else if (coins<=10000) {
        saveCode += '0'+String(coins);
    }
    else {
        saveCode += String(coins);
    }

    //creates the next 20 characters based on the player's inventory.
    for (item in inventory) {
        if (inventory[item] == 'healing_potion_mk1') { saveCode += "01" }
        else if (inventory[item] == 'healing_potion_mk2') { saveCode += "02" }
        else { saveCode += "00" }
    }
    saveCode += playerName; //adds the player name to the end of the code.
    document.getElementById("savedCode").innerHTML = saveCode; //sets the save code label to the save code.
}
function renderEntities() {
    for (var i=0;i<enemies.length;i++) {
        if (enemies[i][0].slice(0,4) == 'boss') {
            addToBoard("<img class='enemy' src='resources/enemies/" + String(enemies[i][0]) + ".gif' style='left:" + String(292-playerXOrigin*48+enemies[i][1]*48) + "px;top:" + String(288-playerYOrigin*48+enemies[i][2]*48) + "px;' id='enemy" + String(i) + "'>");
        } else {
            addToBoard("<img class='enemy' src='resources/enemies/" + String(enemies[i][0]) + ".gif' style='left:" + String(300-playerXOrigin*48+enemies[i][1]*48) + "px;top:" + String(296-playerYOrigin*48+enemies[i][2]*48) + "px;' id='enemy" + String(i) + "'>");
        }
    }
    for (var i=0;i<items.length;i++) {
        addToBoard("<img class='enemy' src='resources/items/" + String(items[i][0]) + ".png' style='left:" + String(303-playerXOrigin*48+items[i][1]*48) + "px;top:" +String(299-playerYOrigin*48+items[i][2]*48) + "px;' id='item" + String(i) + "'>");
    }
}
function addItem(type, x, y) {
    items.push([String(type),Number(x),Number(y)]);
    var i3=0;
    var tempRunning = true;
    while (tempRunning) {
        if (document.getElementById('item'+String(i3)) == null) {
            addToBoard("<img class='enemy' src='resources/items/" + String(type) + ".png' style='left:" + String(303-(playerXOrigin*48+playerX*48)+x*48) + "px;top:" +String(299-(playerYOrigin*48+playerY*48)+y*48) + "px;' id='item" + String(i3) + "'>");
            tempRunning = false;
        }
        i3++;
    }
} // add item mid-session (create and render)
function buttonEvent() {
    if (button[3]=='openLadder') {
        document.getElementById('ladder').src = 'resources/tiles/ladder_open.png';
        ladderOpen = true;
    }
}
function resetBoard() {
    board.innerHTML = "";
}
function addToBoard(data) {
    board.innerHTML += String(data);
}
function checkEnemyCollision(x,y) {
    for (enemy in enemies) {
        if (x == enemies[enemy][1] && y == enemies[enemy][2]) {
            return enemies[enemy]
        }
    }
    return null
}
function useItem(index) {
    index = index == 0 ? 9 : index-=1;
    const item = inventory[index]
    if (item == "healing_potion_mk1") {
        health++;
        playerCooldownTimer = 1
    }
    else if (item == "healing_potion_mk2") {
        health += 2;
        playerCooldownTimer = 2
    }
    inventory[index] = "none";
    document.getElementById("inventoryItem"+String(index)).src = "resources/inventoryItems/none.gif"
}
function sleep(milliseconds) {
    var currentTime = new Date().getTime();
 
    while (currentTime + milliseconds >= new Date().getTime()) {
    }
}
function returnToLobby() {
    scene = 'lobby';
    changeTabTitle('DuCr');
            
    // creates the lobby room
    button = []
    document.getElementById("tilehost").innerHTML = "";
    tiles = [];
    tiles.push([11,11,11,11,11,11,11,11,11,11,11,11,11]);
    for (var i=0;i<12;i++) {
        tiles.push([11,01,01,01,01,01,01,01,01,01,01,01,11]);
    }
    tiles.push([11,11,11,11,11,11,11,11,11,11,11,11,11]);
    for (var i=4;i<=10;i+=2) {
        for (var i2=3;i2<=9;i2+=2) {
            if (lobbyUnlocks[((i2-3)/2)+((i-4)*2)]==true) {
                tiles[i][i2] = 20;
            }
            else {
                tiles[i][i2] = 21;
            }
        }
    }
    
    // loads the screen and the text
    document.getElementById("tilehost").innerHTML = loadScreen();
    document.getElementById("lobbyTextHost").innerHTML = "<p class='lobbyText' style='top:180px;left:248px;width:48px;'>Tutorial</p>";
    document.getElementById("lobbyTextHost").innerHTML += "<p class='lobbyText' style='top:276px;left:248px;width:48px;'>Zone 1</p>";
    document.getElementById("lobbyTextHost").innerHTML += "<p class='lobbyText' style='top:180px;left:152px;width:48px;'>Save</p>";
    document.getElementById("lobbyTextHost").innerHTML += "<p class='lobbyText' style='top:180px;left:440px;width:48px;'>Shop</p>";
    
    // places the player
    playerXOrigin=6;
    playerYOrigin=6;
    playerX=0;
    playerY=0;
    
    // clears entities
    $(".enemy").remove();
    items=[];
    enemies=[];
}
function purchase(item, type, cost) {
    if (type == 'weapon') {
        if (weapon != item && coins >= cost && document.getElementById('swordText') != null) {
            weapon = item;
            coins -= cost;
            document.getElementById(item+'Text').remove();
            document.getElementById(item+'Image').remove();
        }
    } else if (type == 'item') {
        if (!(inventory.includes('none'))) {
            // buy as item
        }
    }
}
function changeTabTitle(newTitle) {
    document.getElementById('tabTitle').innerHTML = newTitle
}
/*
function startLoadingScreen() {
    addToBoard('<div id="loadingScreen"><center><h1 class="Title" id="loadingText">Loading...</h1><div style="width:1000px;height:200px;border-width:1px;"><div id="loadingBar" style="height:200px"></div></div></center></div>');
}
function endLoadingScreen() {
    
} --- WIP
*/