class Game {
  constructor() {

  }

  static getState(gameInProgress, gameEnded) {
    var gameStateRef = database.ref('gameState');
    gameStateRef.on("value", function (data) {
      if (gameState && gameState === 2 && data.val() === 0) {
        gameEnded();
        return;
      }
      gameState = data.val();
      gameInProgress();
    });
  }

  static intRoundInfo() {
    var roundInfoRef = database.ref('roundInfo');
    roundInfoRef.on("value", function (data) {
      if (data.val()) {
        currentRound = (data.val().Round) ? +data.val().Round : 1;
        notYetArtist = (data.val().notYetArtist) ? data.val().notYetArtist : [];
      }
    });
  }

  static update(state) {
    database.ref('/').update({
      gameState: state
    });
  }

  updateMax() {
    database.ref('/').update({
      maxCount: maxCount,
      maxRounds: maxRounds
    })
  }

  async updateWords() {

    var words = await database.ref('words').once("value");
    if (!words.exists() && !words.val()) {
      database.ref('/').update({
        words: ['cow', 'hen', 'house', 'snake', 'clown', 'island', 'wall', 'chair', 'tree', 'triangle']
      })
    }
  }

  static async resetGame() {

    Game.update(0)
    maxCount = 0;
    maxRounds = 0;
    await game.updateMax();
    await database.ref("/").update({ roundInfo: 0 });
    await database.ref("/").update({ drawings: 0 });
  }

  async resetPickedWord() {
    await database.ref('/drawings/canvas/').update({ word: pickedWordDefault });
    await this.pickWord();
  }

  async pickWord() {
    
    var words = [];
    var pickedWordDBRef = await database.ref('drawings/canvas/word').once("value");
    // listen to the change in the word to guess
    var drawingWordRef = database.ref('drawings/canvas/word');
    drawingWordRef.on("value", function (data) {
      drawingWord = data.val();
    });
    // listen to the change in the words that were guessed so far
    var wordsGuessedRef = database.ref('drawings/canvas/wordsGuessed');
    wordsGuessedRef.on("value", function (data) {
      wordsGuessed = (data.val()) ? data.val() : [];
      if (gameState === 2)
        form.createFreshTable();
      wordsGuessed.forEach(guess => form.addGuessToOutputTable(guess.player, guess.word));
      console.log('wordsGuessed:', wordsGuessed);
      console.log('guessTimeElapsed:', guessTimeElapsed)
      guessTimeElapsed = 0;
    });
    if (!pickedWordDBRef.exists() || (pickedWordDBRef.exists() && pickedWordDBRef.val() === pickedWordDefault)) {
      var wordsRef = await database.ref('words').once("value");
      if (wordsRef.exists()) {
        words = wordsRef.val();
      }
      if (words.length > 0) {
        const random = Math.floor(Math.random() * words.length);
        // console.log(random, words[random]);
        database.ref('/drawings/canvas/').update({ word: words[random] });
        return words[random];
      } else {
        database.ref('/drawings/canvas/').update({ word: "something static" });
        return "something static";
      }
    }
  }

  async newGuess() {
    // get the guessed word from the form
    var newWord = form.getNewGuess();

    // save the guessed word in db
    if (newWord && wordsGuessed.filter(data => data.word === newWord).length === 0) {
      wordsGuessed.push({ player: player.name, word: newWord });
      await database.ref('/drawings/canvas/').update({ wordsGuessed: wordsGuessed });
    }

    // if the guessed word is same as the drawn word, pick a different word and give the turn for next player to draw
    if (newWord && newWord.toLowerCase() === drawingWord.toLowerCase()) {
      this.resetPickedWord();
      player.score++;
      player.update();
      if (currentRound >= maxRounds && notYetArtist.length === 0) {
        Form.cleanCanvas();
        Game.update(3);
        // this.end();
      }
      this.nextPlayersTurnToDraw();
    }
  }

  
  async roundTimeup() {
    this.resetPickedWord();
    if (currentRound >= maxRounds && notYetArtist.length === 0) {
      Form.cleanCanvas();
      Game.update(3);
    }
    wordsGuessed = []
    wordsGuessed.push({ player: player.name, word: 'times up.....' });
    await database.ref('/drawings/canvas/').update({ wordsGuessed: wordsGuessed });
    this.nextPlayersTurnToDraw();
  }

  async start() {
    console.log("gameState:", gameState)
    if (!gameState) gameState = 0;
    if (!player || !player.name)
      player = new Player();
    Player.getPlayerInfo();
    if (gameState === 0 || gameState === 1) {

      var playerCountRef = await database.ref('playerCount').once("value");
      if (playerCountRef.exists()) {
        playerCount = playerCountRef.val();
        Player.getCount();
      }


      //find out max players and rounds if not the admin player
      if (gameState != 0) {
        if (form) form.hideGameState1Fields();
        var maxCountRef = await database.ref('maxCount').once('value');
        if (maxCountRef.exists()) {
          maxCount = +maxCountRef.val();
        }

        var maxRoundsRef = await database.ref('maxRounds').once('value');
        if (maxRoundsRef.exists()) {
          maxRounds = +maxRoundsRef.val();
        }

      }

    } else if (gameState === 2) {
      guessTimeElapsed = 0;
    }

    if (!form ){//&& player && player.index <= maxCount) {
      form = new Form()
      form.display();

    }
    else if (form && gameState === 0 && maxCount !== 0 && playerCount >= maxCount) {
      form.tooManyError();
    }



  }

  static changePlayerRole(players) {
    // console.log("init now");
    allPlayers.forEach(p => { p.type = (players.find(up => up.id === p.id)) ? players.find(up => up.id === p.id).type : Player.playerRoles.guesser; })
    notYetArtist = players.filter(p => p.type === Player.playerRoles.guesser);
    database.ref("/").update({ roundInfo: { Round: currentRound, notYetArtist: notYetArtist } });
    Player.updateAllRoles(allPlayers);
  }

  loop(touches) {
    if (form) form.hide();
    Player.getPlayerInfo();
    if (player && allPlayers !== undefined) {

      if (!player.name) {
        var p = allPlayers.find(p => +p.id === +player.id);
        player.score = p.score;
        player.name = p.name;
        player.rank = p.rank;
        player.id = p.id;
        player.type = p.type;
        player.index = p.index;
      }

      background(0);
     // console.log("mobile point", isDrawing, touches)
      if (isDrawing) {
        var point = null;
        // capture drawing in mobile browser
        if (touches) {
          for (var i = 0; i < touches.length; i++) {
            ellipse(touches[i].x, touches[i].y, 50, 50);
            point = {
              x: touches[i].x,
              y: touches[i].y,
              color: lineColor
            };
         //   console.log("mobile point", point)
          }
        }

        // capture drawing in desktop browser
        if (!(mouseX < colorWheel.width && mouseY < colorWheel.height)) {
          point = {
            x: mouseX,
            y: mouseY,
            color: lineColor
          };
        }
        if (point)
          currentPath.push(point);
      }
      strokeWeight(4);
      noFill();
      if (drawing) {
        var keys = Object.keys(drawing);
        for (var i = 0; i < drawing.length; i++) {
          var path = drawing[keys[i]];
          if (path) {
            beginShape();
            for (var j = 0; j < path.length; j++) {
              stroke(path[j].color);
              var mapX = map(path[j].x, 0, artistCanvasWidth, 0, windowWidth)
              var mapY = map(path[j].y, 0, artistCanvasWidth, 0, windowWidth)
              vertex(mapX, mapY);
            }
            endShape();
          }
        }
      }

    }
    if (player.type === Player.playerRoles.artist) {
      if (guessTimeElapsed > maxTime) {
        this.roundTimeup();
      }
    }


    drawSprites();
  }


  nextPlayersTurnToDraw() {
    console.log('next change');
    if (notYetArtist && notYetArtist.length > 0) {
      notYetArtist[0].type = Player.playerRoles.artist;
      Game.changePlayerRole(notYetArtist);
    } else {
      currentRound++;
      this.nextRound();
    }
  }
  nextRound() {
    console.log('in Next round');
    database.ref("/roundInfo").update({ Round: currentRound, notYetArtist: (notYetArtist) ? notYetArtist : 0 });

    allPlayers.forEach(p => p.type = Player.playerRoles.guesser)
    allPlayers[0].type = Player.playerRoles.artist;
    Game.changePlayerRole(allPlayers);
  }

  end() {
    form.hide();
    // background("white");
    form.showResult();
    // textSize(50);
    // text("GAME ENDED",windowWidth/2,windowHeight/2)
    //if first admin player playing 

    //delete player info 
    //if (allPlayers.length > 1)
     // Player.deletePlayers();
    console.log("GAME ENDED")
    console.log("player" + player.index + " rank : " + player.rank)
    //location.reload();

  }



}
