class Player {
  constructor() {
    this.index = 0;
    this.score = 0;
    this.name = null;
    if (localStorage.getItem("playerId"))
      this.id = String(localStorage.getItem("playerId"));
    else {
      this.id = Player.generateId();
      console.log("playerid:", this.id);
      localStorage.setItem("playerId", this.id);
    }
    this.rank = 0;
    this.type = Player.playerRoles.guesser;
  }
  static playerRoles = {
    artist: 0,
    guesser: 1
  }
  static getCount() {
    var playerCountRef = database.ref('playerCount');
    playerCountRef.on("value", (data) => {
      playerCount = data.val();
      if (!playerCount) playerCount = 0;
    })
  }

  static updateCount(count) {
    database.ref('/').update({
      playerCount: count
    });
  }

  static generateId() {
    var x = Math.floor((Math.random() * 100000000) + 1);
    return pad(x, 8);
    function pad(numb, length) {
      var str = "" + numb;
      while (str.length < length) {
        str = "0" + str;
      }
      return str;
    }
  }
  update() {
    var playerIndex = "players/player" + this.index;
    database.ref(playerIndex).update({
      name: this.name,
      score: this.score,
      rank: this.rank,
      type: this.type,
      id: this.id,
      index:this.index
    });
  }
  static async updateAllRoles(updatedPlayers) {
    var aPRef = await database.ref('players').once("value");
    var aP = [];
    if (aPRef.exists() && aPRef.val()) {
      aP = aPRef.val();
    }
    console.log(aP);
    console.log(updatedPlayers);
    Object.keys(aP).forEach(key =>
      database.ref('players/' + key ).update({
        type: updatedPlayers.find(up => up.id === aP[key].id).type
      })
    );
  }

  static getPlayerInfo() {
    var playerInfoRef = database.ref('players');
    playerInfoRef.on("value", (data) => {
      var players = data.val();
      allPlayers = []
      if (players) {
        var keys = Object.keys(players);
        keys.forEach(key => allPlayers.push(players[key]))
      }
      var dbPlayer = allPlayers.find(p => +p.id === +player.id);

      if (dbPlayer) {
        if (!player.name) {
          var p = dbPlayer;
          player.score = p.score;
          player.name = p.name;
          player.rank = p.rank;
          player.id = p.id;
          player.type = p.type;
          player.index = p.index;
        } else {
          player.type = dbPlayer.type;
        }

      }

    })
  }

  static deletePlayers() {
    database.ref('players').remove();
  }




}
