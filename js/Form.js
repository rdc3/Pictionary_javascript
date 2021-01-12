class Form {

  constructor() {
    //this.inputName = createInput("Name");
    this.inputName = createInput("").attribute("placeholder", "Name");
    this.inputMaxRounds = createInput("").attribute("placeholder", "Enter number of rounds");
    this.inputMaxPlayers = createInput("").attribute("placeholder", "Enter number of players");
    this.playButton = createButton('Play');
    this.greeting = createElement('h2');
    this.result = createElement('h2');
    this.message = createElement('p');
    this.title = createElement('h2');
    this.tooMany = createElement('h2')
    this.reset = createButton('Reset Game');
    this.clearCanvasButton = createButton('Clear Canvas');
    this.drawingWordText = createElement('h2');
    this.guessOutput = createElement('table');
    this.guessInput = createInput("").attribute("placeholder", "Guess");
  }
  hide() {
    this.greeting.hide();
    this.playButton.hide();
    this.inputName.hide();
    this.title.hide();
    this.inputMaxRounds.hide();
    this.inputMaxPlayers.hide();

  }
  hideGameState1Fields() {
    this.inputMaxRounds.hide();
    this.inputMaxPlayers.hide();
  }
  play() {
    this.inputName.hide();
    this.playButton.hide();
    this.inputMaxRounds.hide();
    this.inputMaxPlayers.hide();
    player.name = this.inputName.value();

    if (gameState === 0) {
      maxCount = +this.inputMaxPlayers.value();
      maxRounds = +this.inputMaxRounds.value();
      game.updateMax();
      game.updateWords();

    }
    playerCount += 1;
    player.index = playerCount;
    player.rank = 0;
    player.score = 0;
    player.type = Player.playerRoles.artist
    if (playerCount === 1) {
      Game.update(1)
    }
    if (playerCount > 1) {

      player.type = Player.playerRoles.guesser

    }
    player.update();
    Player.updateCount(playerCount);

    if (playerCount == maxCount) {
      game.pickWord();
    }
    this.greeting.html("Hello " + player.name)
    this.greeting.position(windowWidth / 2 - 70, windowWidth * 1 / 2);
  }

  display() {
    this.title.html("Pictionary");
    this.title.position(windowWidth / 3, 0);
    this.inputMaxRounds.hide();
    this.inputMaxPlayers.hide();
    if (gameState === 0) {
      this.inputMaxRounds.show();
      this.inputMaxPlayers.show();
      this.inputMaxRounds.position(50, windowWidth / 6 - 50)
      this.inputMaxPlayers.position(50, windowWidth / 6 - 20)
    } else if ((gameState === 2 || gameState === 1) && playerCount >= maxCount) {
      this.inputName.hide();
      this.playButton.hide();
      this.reset.hide();
      this.clearCanvasButton.hide();
      this.guessInput.hide();
      this.guessOutput.hide();
      this.message.hide();
    } else if (gameState === 1) {
      this.hideGameState1Fields()
    }

    this.inputName.position(50, windowWidth / 6 - 80);
    this.playButton.position(50, windowWidth / 6 + 10);


    this.playButton.mousePressed(() => {
      this.play();
    });

    var refDrawings = database.ref('drawings');
    refDrawings.on('value', Form.canvasUpdated, Form.errData);
    Form.showNewCanvas("canvas");

    this.message.position(20, windowWidth / 3 + 50);
    this.reset.position(20, windowWidth / 3 + 30);
    this.reset.mousePressed(() => {
      Game.resetGame();
      Player.updateCount(0);
      Player.deletePlayers();
      Form.cleanCanvas();
    })
    this.clearCanvasButton.position(120, windowWidth / 3 + 30);
    this.clearCanvasButton.mousePressed(() => {
      Form.cleanCanvas();
    })
    this.guessInput.position(250, windowWidth / 3 + 30);
    this.guessInput.size("500");
    this.drawingWordText.position(120, windowWidth / 3 + 60);
    this.guessOutput.position(windowWidth * 3 / 4 + 20, 30);

    this.guessOutput.attribute("id", "GuessOutput")

    if (gameState === 2)
      this.createFreshTable();

  }
  getNewGuess() {
    return this.guessInput.value();
  }
  addGuessToOutputTable(byWho, word) {
    this.addTableRow(byWho, word)
  }
  createFreshTable() {
    var table = document.getElementById("GuessOutput");
    table.innerHTML = "";
    var header = table.createTHead();
    var row = header.insertRow(0);
    var col1 = "<b style='min-width=100px'>Player</b>"
    var col2 = "<b>Guess</b>"
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    cell1.innerHTML = col1;
    cell2.innerHTML = col2;
    table.createTBody();
  }
  addTableRow(col1, col2) {
    var table = document.getElementById("GuessOutput");
    if (table.getElementsByTagName("TBODY").length > 0) {
      var row = table.getElementsByTagName("TBODY")[0].insertRow(0);
      var cell1 = row.insertCell(0);
      var cell2 = row.insertCell(1);
      cell1.innerHTML = col1;
      cell2.innerHTML = col2;
    }
  }

  showResult() {
    this.result.position(windowWidth / 3 - 100, 80);
    this.result.html("Game Over! Your score : " + player.score)
  }
  tooManyError() {
    this.tooMany.position(windowWidth / 3 - 110, windowWidth / 6 - 80);
    this.tooMany.html('Game room is full. Please try again later.');
    // this.reset.position(windowWidth - 80, 30);
    this.reset.mousePressed(() => {
      Player.updateCount(0);
      Game.update(0)
    })
  }

  hideArtistControls() {
    this.clearCanvasButton.attribute('disabled', '');
    this.guessInput.show();
  }
  hideGuesserControls() {
    this.clearCanvasButton.removeAttribute('disabled');
    this.guessInput.hide();
  }

  static startDrawing() {
    isDrawing = (player.type === Player.playerRoles.artist);
    currentPath = [];
    if (!drawing) { drawing = []; }
    drawing.push(currentPath);
  }
  static endDrawing() {
    isDrawing = false;
    Form.saveDrawing()
  }

  static saveDrawing() {
    if (drawing) {
      var ref = database.ref('drawings');
      var data = {
        canvas: {
          name: player.name,
          drawing: drawing.map(p => (p.length > 0) ? p : null),
          word: drawingWord,
          canvasWidth: windowWidth
        }
      };
      var result = ref.update(data, (err, status) => {
        // console.log("DB Update Status:", status);
      });
      // console.log("DB Update:", result.key);
    }
  }

  static canvasUpdated(data) {
    var drawings = data.val();
    if (drawings) {
      // var keys = Object.keys(drawings);
      artistCanvasWidth = drawings.canvas.canvasWidth;
      // for (var i = 0; i < keys.length; i++) {
      //   var key = keys[i];
        if (player.type === Player.playerRoles.guesser) {
          Form.showNewCanvas(key, drawings.canvas.drawing);
        }
      // }
    }
  }
  static errData(err) {
    console.log(err);
  }
  static showNewCanvas(key, drawings) {
    if (key instanceof MouseEvent) {
      key = this.html();
    }
    // console.log('fetching :drawings/' + key);
    if (drawings) {
      drawing = (drawings) ? drawings : []
    } else {
      var ref = database.ref('drawings/' + key);
      ref.once('value', oneDrawing, Form.errData);
    }
    function oneDrawing(data) {
      var dbdrawing = data.val();
      drawing = (dbdrawing) ? dbdrawing.drawing : [];
    }
  }
  static cleanCanvas() {
    drawing = [];
    Form.saveDrawing();
  }

}
