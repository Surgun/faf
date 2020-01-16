"use strict"; //creates a party as outlined in DungeonManager. Initated with CreateParty();

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var $dungeonTeamSelect = $("#dungeonTeamSelect");
var $dtsBanner = $("#dtsBanner");
var $dtsMaterials = $("#dtsMaterials");
var $dtsTop = $("#dtsTop");
var $dtsBottom = $("#dtsBottom");

var Party =
/*#__PURE__*/
function () {
  function Party(heroID) {
    _classCallCheck(this, Party);

    this.heroID = heroID;
    this.heroes = heroID.map(function (h) {
      return HeroManager.idToHero(h);
    });
  }

  _createClass(Party, [{
    key: "createSave",
    value: function createSave() {
      var save = {};
      save.heroID = this.heroID;
      return save;
    }
  }, {
    key: "hasMember",
    value: function hasMember(member) {
      return this.heroes.includes(member);
    }
  }, {
    key: "size",
    value: function size() {
      return this.heroes.length;
    }
  }, {
    key: "alive",
    value: function alive() {
      return this.heroes.some(function (hero) {
        return !hero.dead();
      });
    }
  }, {
    key: "isDead",
    value: function isDead() {
      return this.heroes.every(function (hero) {
        return hero.dead();
      });
    }
  }, {
    key: "addTime",
    value: function addTime(t) {
      this.heroes.forEach(function (h) {
        h.addTime(t, dungeonID);
      });
    }
  }, {
    key: "resetForFloor",
    value: function resetForFloor() {
      this.heroes.forEach(function (hero) {
        hero.hp = hero.maxHP();
        hero.resetPlaybookPosition();
        hero.removeBuffs();
      });
    }
  }, {
    key: "setMaxFloor",
    value: function setMaxFloor(id, floor) {
      this.heroes.forEach(function (h) {
        return h.setMax(id, floor);
      });
    }
  }]);

  return Party;
}();

var PartyCreator = {
  heroes: [],
  emptyPartySlots: function emptyPartySlots() {
    return DungeonManager.dungeonSlotCount() - this.heroes.length;
  },
  removeMember: function removeMember(slotNum) {
    this.heroes.splice(slotNum, 1);
  },
  addMember: function addMember(heroID) {
    if (this.emptyPartySlots() === 0) return false;
    this.heroes.push(heroID);
  },
  clearMembers: function clearMembers() {
    this.heroes = [];
  },
  validTeam: function validTeam() {
    if (this.heroes.length === 0) return false;
    var heroesReal = this.heroes.map(function (hid) {
      return HeroManager.idToHero(hid);
    });
    return heroesReal.some(function (h) {
      return h.alive();
    });
  },
  lockParty: function lockParty() {
    this.heroes.map(function (hid) {
      return HeroManager.idToHero(hid);
    }).forEach(function (h) {
      h.inDungeon = true;
      h.hp = h.maxHP();
    });
    var party = new Party(this.heroes);
    this.heroes = [];
    return party;
  },
  healCost: function healCost() {
    if (this.heroes.length === 0) return 0;
    return this.heroes.map(function (h) {
      return HeroManager.idToHero(h).healCost();
    }).reduce(function (total, h) {
      return total + h;
    });
  },
  noheal: function noheal() {
    if (this.heroes.length === 0) return true;
    return this.heroes.map(function (h) {
      return HeroManager.idToHero(h);
    }).every(function (h) {
      return h.hp === h.maxHP();
    });
  },
  payHealPart: function payHealPart() {
    var amt = this.healCost();

    if (ResourceManager.materialAvailable("M001") < amt) {
      Notifications.cantAffordHealParty();
      return;
    }

    ResourceManager.deductMoney(amt);
    this.heroes.map(function (h) {
      return HeroManager.idToHero(h);
    }).forEach(function (h) {
      return h.healPercent(100);
    });
  },
  startingTeam: function startingTeam(team) {
    var _this = this;

    if (team === null) return;
    var statuses = team.map(function (h) {
      return HeroManager.idToHero(h).inDungeon;
    });
    if (statuses.some(function (h) {
      return h;
    })) return;
    team.forEach(function (h) {
      return _this.addMember(h);
    });
  },
  getStartFloor: function getStartFloor() {
    if (this.heroes.length === 0) return 0;
    var heroes = this.heroes.map(function (p) {
      return HeroManager.idToHero(p);
    });
    return Math.min.apply(Math, _toConsumableArray(heroes.map(function (p) {
      return p.getMax(DungeonManager.dungeonCreatingID);
    })));
  }
};

function refreshHeroSelect() {
  var dungeon = DungeonManager.dungeonByID(DungeonManager.dungeonCreatingID); //Team Banner

  $dtsBanner.empty();
  var b1 = $("<div/>").addClass("dts".concat(dungeon.id, " dtsBackground")).appendTo($dtsBanner);
  var b2 = $("<div/>").addClass("dts".concat(dungeon.id, " dtsHeader")).html(dungeon.name).appendTo($dtsBanner);
  $("<div/>").addClass("dtsMaxFloor").html("Max Floor Skip: 100").appendTo($dtsBanner);
  $("<div/>").addClass("dts".concat(dungeon.id, " dtsBackButton")).html("<i class=\"fas fa-arrow-left\"></i>").appendTo($dtsBanner);

  if (dungeon.type === "boss") {
    b1.addClass("DBoss");
    b2.addClass("DBoss");
    if (dungeon.bossDifficulty() > 0) $("<div/>").addClass("dtsBossDifficulty").html("".concat(dungeon.bossDifficulty(), " ").concat(miscIcons.skull)).appendTo($dtsBanner);
  } //Materials in Dungeon


  $dtsMaterials.empty();

  if (dungeon.type !== "boss") {
    var dmTitle = $("<div/>").addClass("dtsMaterialTitle").attr("data-value", dungeon.id).html("Materials Found In This Dungeon <i class=\"fas fa-chevron-down\"></i>").appendTo($dtsMaterials);
    var dm = $("<div/>").addClass("dtsMaterialContainer");

    if (settings.expandedMaterials[dungeon.id] === 1) {
      dmTitle.addClass("toggleActive");
      dm.addClass("expanded");
    }

    if (ResourceManager.materialSeenDungeon(dungeon.id).length === 0) {
      var dm1 = $("<div/>").addClass("dtsMaterialNone").html("You have not discovered any materials.");
      dm.append(dm1);
    }

    ResourceManager.materialSeenDungeon(dungeon.id).forEach(function (m) {
      var dm1 = $("<div/>").addClass("dtsMaterial").appendTo(dm);
      $("<div/>").addClass("dtsMaterialIcon").html(m.img).appendTo(dm1);
      $("<div/>").addClass("dtsMaterialName").html(m.name).appendTo(dm1);
      $("<div/>").addClass("dtsMaterialAmt tooltip").attr("data-tooltip", "in_inventory").html(formatToUnits(m.amt, 2)).appendTo(dm1);
    });
    $dtsMaterials.append(dm);
  }

  $dtsTop.empty();
  var d1top = $("<div/>").addClass("dtsTopTitle").html("<h3>Assemble your Team!</h3>");
  $dtsTop.append(d1top);
  var d = $("<div/>").addClass("dungeonTeamCollection"); //actual members

  PartyCreator.heroes.forEach(function (hero, i) {
    var d1 = characterCard("dungeonTeam", i, hero);
    d.prepend(d1);
  }); //empty slots

  for (var i = 0; i < PartyCreator.emptyPartySlots(); i++) {
    var d1a = characterCard("dungeonTeam", i).addClass("noHeroDungeonSelect");
    d.prepend(d1a);
  }

  $dtsTop.append(d);
  var buttons = $("<div/>").addClass("partyLaunchButton").appendTo($dtsTop);
  var dbutton1 = $("<div/>").addClass("dungeonTeamButton").attr("id", "dungeonTeamButtonSkip").html("Start at Floor ".concat(PartyCreator.getStartFloor())).appendTo(buttons);
  var or = $("<span/>").html(" or ").appendTo(buttons);
  var dbutton2 = $("<div/>").addClass("dungeonTeamButton").attr("id", "dungeonTeamButton").html("Start at Floor 1").appendTo(buttons);

  if (PartyCreator.getStartFloor() <= 1) {
    or.hide();
    dbutton2.hide();
  }

  if (PartyCreator.heroes.length === 0) {
    dbutton1.addClass('dungeonStartNotAvailable');
    dbutton2.addClass('dungeonStartNotAvailable');
  }

  $dtsBottom.empty(); //available heroes

  var d1bot = $("<div/>").addClass("dtsBotTitle").html("<h3>Your Available Heroes</h3>");
  $dtsBottom.append(d1bot);
  var d2 = $("<div/>").addClass("dungeonAvailableCollection");
  HeroManager.ownedHeroes().forEach(function (hero) {
    if (dungeon.bannedHero.includes(hero.id)) characterCard("heroBanned dungeonNotAvailable", hero.uniqueid, hero.id, "Banned from Here").appendTo(d2);else if (hero.inDungeon) characterCard("dungeonNotAvailable", hero.uniqueid, hero.id, "In Dungeon").appendTo(d2);else if (PartyCreator.heroes.includes(hero.id)) characterCard("partyHero dungeonNotAvailable", hero.uniqueid, hero.id, "Already in Party").appendTo(d2);else characterCard("dungeonAvailable", hero.uniqueid, hero.id, null).appendTo(d2);
  });
  $dtsBottom.append(d2);
} // Toggle displaying dungeon materials on select screen


$(document).on('click', '.dtsMaterialTitle', function (e) {
  e.preventDefault();
  var toggleActive = $(e.currentTarget).hasClass("toggleActive");
  var title = $(".dtsMaterialTitle");
  var dungeonID = title.attr("data-value");
  $(".dtsMaterialContainer").addClass("expanded");
  title.addClass("toggleActive");
  settings.expandedMaterials[dungeonID] = 1;

  if (toggleActive) {
    $(e.currentTarget).removeClass("toggleActive");
    $(".dtsMaterialContainer").removeClass("expanded");
    settings.expandedMaterials[dungeonID] = 0;
  }

  saveSettings();
}); //Go back to dungeon select screen

$(document).on('click', ".dtsBackButton", function (e) {
  e.preventDefault();
  tabClick(e, "dungeonsTab");
}); //clicking a hero to remove them from your party

$(document).on('click', "div.dungeonTeamCardClick", function (e) {
  e.preventDefault();
  var heroID = $(e.currentTarget).attr("heroID");
  PartyCreator.removeMember(heroID);
  refreshHeroSelect(DungeonManager.dungeonCreatingID);
}); //clicking a hero to add them to your party

$(document).on('click', "div.dungeonAvailableCardClick", function (e) {
  e.preventDefault();
  var ID = $(e.currentTarget).attr("heroid");
  PartyCreator.addMember(ID);
  refreshHeroSelect(DungeonManager.dungeonCreatingID);
}); //locking in a team to start a dungeon

$(document).on('click', "#dungeonTeamButton", function (e) {
  e.preventDefault();

  if (PartyCreator.validTeam()) {
    DungeonManager.createDungeon(1);
    initializeSideBarDungeon();
    $dungeonTeamSelect.hide();
    $dungeonRun.show();
  } else {
    Notifications.noPartySelected();
  }
});
$(document).on('click', "#dungeonTeamButtonSkip", function (e) {
  e.preventDefault();

  if (PartyCreator.validTeam()) {
    DungeonManager.createDungeon(PartyCreator.getStartFloor());
    initializeSideBarDungeon();
    $dungeonTeamSelect.hide();
    $dungeonRun.show();
  } else {
    Notifications.noPartySelected();
  }
});

function characterCard(prefix, dv, ID, status) {
  var d = $("<div/>").addClass(prefix + "Card").attr("data-value", dv);

  if (!ID) {
    $("<div/>").addClass(prefix + "Image").html('<img src="/assets/images/heroes/blank.png">').appendTo(d);
    $("<div/>").addClass(prefix + "Name").html("Empty").appendTo(d);
    return d;
  }

  var dclick = $("<div/>").addClass(prefix + "CardClick").attr("heroID", dv).appendTo(d);
  var hero = HeroManager.idToHero(ID);
  $("<div/>").addClass(prefix + "Image").html(hero.image).appendTo(dclick);
  $("<div/>").addClass(prefix + "Name").html(hero.name).appendTo(dclick);
  var d3 = $("<div/>").addClass(prefix + "Stats").appendTo(dclick);
  $("<div/>").addClass(prefix + "HP" + " heroStat" + " tooltip").attr("data-tooltip", "hp").html("".concat(miscIcons.hp, " ").concat(hero.maxHP())).appendTo(d3);
  $("<div/>").addClass(prefix + "Pow" + " heroPowStat" + " tooltip").attr("data-tooltip", "pow").html("".concat(miscIcons.pow, " ").concat(hero.getPow())).appendTo(d3);
  var d5 = $("<div/>").addClass("heroStatus").html(status).appendTo(dclick);
  if (status === null) d5.hide();else d.addClass("heroUnavailable");
  $("<div/>").addClass("partyMaxFloor").html("Floor ".concat(hero.getMax(DungeonManager.dungeonCreatingID))).appendTo(dclick);
  return d;
}