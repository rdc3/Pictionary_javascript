var canvas, backgroundImage;

var gameState;
var playerCount = 0;
var currentRound = 1;
var allPlayers;
var notYetArtist;
var maxCount;
var maxRounds;
var maxTime = 30;
var artistCanvasWidth = 500;
var database;


var form, player, game, colorWheel, lineColor = 255, colorPicked = 255, guessTimeElapsed = 0;
var pickedWordDefault = "Loading..."
var drawingWord = pickedWordDefault, wordsGuessed = [];

var drawing = [];
var currentPath = [];
var isDrawing = false;

function preload() {
  colorWheel = loadImage("images/colorwheel.png");
}

async function setup() {

  canvas = createCanvas(windowWidth * 3 / 4, windowWidth * 1 / 3);
  canvas.mousePressed(Form.startDrawing);
  canvas.mouseReleased(Form.endDrawing);
  canvas.touchStarted(Form.startDrawing);
  canvas.touchEnded(Form.endDrawing);
  database = firebase.database();
  gameState = 0;
  maxCount = 2;
  maxRounds = 2;
  game = new Game();


  Game.getState(game.start, game.end);
  Game.intRoundInfo();
  game.pickWord();

  setInterval(() => {
    guessTimeElapsed++
  }, 1000)

  document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
  });
  document.addEventListener('touchmove', function (e) {
    e.preventDefault();
  }, { passive: false });

}
function mobileAndTabletCheck() {
  let check = false;
  (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};

function draw() {
  if (playerCount === maxCount && gameState === 1) {
    game.nextRound();
    Game.update(2);
  }
  if (gameState === 2) {
    clear();
  // console.log('touches:', touches)
    game.loop(touches);
    cursor(CROSS);
    if (player && player.type === Player.playerRoles.artist) {
      push();
      image(colorWheel, 0, 0);
      colorPicked = colorWheel.get(mouseX, mouseY);
      if (mouseX < colorWheel.width && mouseY < colorWheel.height) {
        push();
        stroke(colorPicked[0], colorPicked[1], colorPicked[2]);
        fill(colorPicked);
        ellipse(mouseX, mouseY, 15, 15);
        pop();
        cursor(HAND);

      }
      fill(lineColor[0], lineColor[1], lineColor[2], 150);
      ellipse(75, 190, 50, 50);
      pop();
    }
    for (var i = 0; i < touches.length; i++) {
      fill(lineColor[0], lineColor[1], lineColor[2], 150);
      ellipse(touches[i].x, touches[i].y, 50, 50);

    }
    fill("white")
    noStroke();
    text("SCORE : "+ player.score,width-100,50)
    text("TIME LEFT : "+ (maxTime-guessTimeElapsed),width-100,100)
    console.log(maxTime-guessTimeElapsed);
    if(maxTime === guessTimeElapsed){
      game.roundTimeup();
    }
  }

  if (gameState === 3) {
    canvas.hide();
    //game.wait();
    game.end();

  }
  if (playerCount > maxCount && maxCount !== 0) {
    if (form)
      form.tooManyError();
  }
  var msg = "Enter the data to begin."
  if (form) {
    if (!player || player.type === Player.playerRoles.guesser) {
      cursor("not-allowed");
      form.hideArtistControls();
      if (gameState === 2)
        msg = "Hi " + player.name + ". Guess the word... You have " + (maxTime - guessTimeElapsed) + " seconds left";
    } else {
      form.hideGuesserControls();
      if (gameState === 2)
        msg = "Hi " + player.name + ". Your word is : <b>" + drawingWord + "</b>"
    }

    form.message.html(msg)
  }
}
function keyReleased() {
  if (form) {
    if (gameState == 3 && !player || player.type === Player.playerRoles.guesser) {
      if (keyCode == ENTER) {
        game.newGuess();
      }
    }
    if (gameState == 0 || gameState == 1)
      if (keyCode == ENTER) {
        form.play()
      }
  }
}
// do this prevent default touch interaction
function mousePressed() {
  if (gameState === 3 && player.type === Player.playerRoles.artist)
    return false;
}
function mouseReleased() {
  if (mouseX < colorWheel.width && mouseY < colorWheel.height) {
   // console.log('colorPicked=', colorPicked);
    lineColor = colorPicked;
  }
}

// function windowResized() {
//   resizeCanvas(windowWidth-50 , windowHeight-50);
// }

