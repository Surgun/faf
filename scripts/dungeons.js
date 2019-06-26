"use strict";
const Stat = Object.freeze({HP:"HP",POW:"Power",AP:"AP"});
const DungeonStatus = Object.freeze({EMPTY:0,ADVENTURING:1});

class TurnOrder {
    constructor(heroes,mobs) {
        this.heroes = heroes;
        this.mobs = mobs;
        this.order = interlace(heroes,mobs);
        this.position = 0;
        this.nextNotDead();
    }
    nextNotDead() {
        while (this.order[this.position].dead()) this.position++;
    }
    getOrder() {
        return this.order;
    }
    nextTurn() {
        return this.order[this.position];
    }
    nextPosition() {
        this.position += 1;
        if (this.position === this.order.length) this.position = 0;
        if (this.order[this.position].dead()) this.nextPosition();
    }
    createSave() {
        const save = {};
        save.position = this.position;
        return save;
    }
    loadSave(save) {
        this.position = save.position;
    }
    addMob(mob) {
        this.order.splice(this.position+1,0,mob);
    }
}


class Dungeon {
    constructor(props) {
        Object.assign(this, props);
        this.maxMonster = 4;
        this.party = null;
        this.mobs = [];
        this.dropList = [];
        this.dungeonTime = 0;
        this.dungeonTotalTime = 0;
        this.floorCount = 0;
        this.order = null;
        this.status = DungeonStatus.EMPTY;
        this.lastParty = null;
    }
    createSave() {
        const save = {};
        save.id = this.id;
        save.lastParty = this.lastParty;
        if (this.party === null) save.party = null;
        else save.party = this.party.createSave();
        save.mobs = [];
        this.mobs.forEach(m=>{
            save.mobs.push(m.createSave());
        });
        save.dropList = this.dropList;
        save.dungeonTime = this.dungeonTime;
        save.floorCount = this.floorCount;
        save.order = [];
        if (this.order === null) save.order = null;
        else save.order = this.order.createSave();
        save.status = this.status;
        return save;
    }
    loadSave(save) {
        if (save.party !== null) this.party = new Party(save.party.heroID);
        else save.party = null;
        if (save.lastParty !== undefined) this.lastParty = save.lastParty;
        this.mobs = [];
        save.mobs.forEach(mobSave => {
            const mobTemplate = MobManager.idToMob(mobSave.id);
            const mob = new Mob(mobSave.lvl, mobTemplate);
            mob.loadSave(mobSave);
            this.mobs.push(mob);
        });
        if (save.order !== null) {
            this.order = new TurnOrder(this.party.heroes,this.mobs);
            this.order.loadSave(save.order);
        }   
        this.dropList = save.dropList;
        this.dungeonTime = save.dungeonTime;
        this.floorCount = save.floorCount;
        this.status = save.status;
        this.sanctuary = FloorManager.isSanctuary(this.id,this.floorCount);
    }
    addTime(t) {
        //if there's enough time, grab the next guy and do some combat
        if (this.status !== DungeonStatus.ADVENTURING) return;
        this.dungeonTime += t;
        this.dungeonTotalTime += t;
        const dungeonWaitTime = ((DungeonManager.dungeonView === this.id) ? DungeonManager.speed : 750);
        const refreshLater = this.dungeonTime >= 2*dungeonWaitTime;
        CombatManager.refreshLater = refreshLater;
        while (this.dungeonTime >= dungeonWaitTime) {
            if (this.sanctuary) {
                //lol hax, this.sanctuary holds gate keeping
                const healPercent = ActionLeague.sanctuaryHeal[this.floorCount/50];
                if (healPercent > 0) {
                    const battleMessage = $("<span/>").addClass("logSpecial");
                    battleMessage.html(`${logIcon("far fa-swords")} Your party is healed at the Sanctuary!`);
                    BattleLog.addEntry(this.id,battleMessage);
                    this.party.heroes.forEach(hero => {
                        hero.healPercent(healPercent);
                    });
                }
                this.nextFloor(refreshLater);
                this.dungeonTime -= dungeonWaitTime;
                return;
            }
            this.checkDeadMobs(refreshLater); //workaround for when you killed a monster but haven't looted it and refreshed
            if (this.floorComplete() && this.dungeonTime >= dungeonWaitTime) {
                this.nextFloor(refreshLater);
                this.dungeonTime -= dungeonWaitTime;
                return;
            }
            const unit = this.order.nextTurn();
            if (!unit.dead()) {
                if (unit.unitType === "hero") CombatManager.launchAttack(unit, this.party.heroes, this.mobs, this.id);
                else CombatManager.launchAttack(unit, this.mobs, this.party.heroes, this.id);         
            }
            if (!refreshLater) refreshAPBar(unit);
            this.order.nextPosition();
            this.checkDeadMobs(refreshLater);
            this.beatTotal += 1;
            if (this.party.isDead()) {
                this.resetDungeon();
                return;
            }
            this.dungeonTime -= dungeonWaitTime;
            if (!refreshLater) refreshTurnOrder(this.id);
        }
        if (refreshLater) {
            initiateDungeonFloor(this.id);
            BattleLog.refresh();
        }
        if (!this.floorComplete() && DungeonManager.dungeonView === this.id) refreshBeatBar(this.dungeonTime);
    }
    floorComplete() {
        return this.mobs.every(m=>m.looted());
    }
    checkDeadMobs(refreshLater) {
        let needrefresh = false;
        this.mobs.forEach(mob => {
            if (mob.dead() && !mob.looted()) {
                this.addDungeonDrop(mob.rollDrops());
                needrefresh = true;
            }
        });
        if (refreshLater) return;
        if (needrefresh) initiateDungeonFloor(this.id);
    }
    initializeParty(party) {
        this.party = party;
        this.lastParty = party.heroID;
    }
    resetDungeon() {
        this.party.heroes.forEach(h=>{
            h.inDungeon = false;
            h.ap = 0;
            h.hp = h.maxHP()
        });
        if (this.type === "boss" && this.mobs.every(m=>m.dead())) {
            EventManager.addEventBoss(this.id,this.dungeonTime);
            DungeonManager.bossesBeat.push(this.id);
            refreshALprogress();
            refreshProgress();
        }
        else if (this.type === "regular") EventManager.addEventDungeon(this.eventLetter,this.dropList,this.dungeonTotalTime,this.floorCount, this.beatTotal);
        DungeonManager.removeDungeon(this.id);
        if (DungeonManager.dungeonView === this.id) {
            BattleLog.clear();
            openTab("dungeonsTab");
        }
        initializeSideBarDungeon();
        refreshDungeonSelect();
        updateHeroCounter();
        this.status = DungeonStatus.EMPTY;
        this.order = null;
        this.dungeonTime = 0;
        this.floorCount = 0;
        this.dungeonTotalTime = 0;
        this.beatTotal = 0;
        this.dropList = [];
        return;
    }
    addDungeonDrop(drops) {
        drops.forEach(drop => {
            const found = this.dropList.find(d => d.id === drop)
            if (found === undefined) this.dropList.push({"id":drop,"amt":1});
            else found.amt += 1;
        })
    }
    nextFloor(refreshLater) {
        if (this.type === "boss" && this.floorCount === 1) {
            this.resetDungeon();
            return;
        }
        this.floorCount += 1;
        achievementStats.floorRecord(this.id, this.floorCount);
        this.sanctuary = FloorManager.isSanctuary(this.id,this.floorCount);
        if (this.sanctuary) {
            this.mobs = [];
            this.order = new TurnOrder(this.party.heroes,[]);
        }
        else {
            this.mobs = MobManager.generateDungeonFloor(this.id,this.floorCount);
            this.order = new TurnOrder(this.party.heroes,this.mobs);
        }
        if (refreshLater) return;
        initiateDungeonFloor(this.id);
        refreshDSB(this.id);
    }
    addSummon() {
        this.mobs = this.mobs.filter(m=>m.alive());
        if (this.mobs.length === 4) return;
        const newMob = MobManager.generateDungeonMob("LKH001",0);
        this.mobs.push(newMob);
        this.order = new TurnOrder(this.party.heroes,this.mobs);
        this.order.position += 1;
        initiateDungeonFloor(this.id);
    }
    addSummon2() {
        this.mobs = this.mobs.filter(m=>!m.clearImmediately);
        const newMob = MobManager.generateDungeonMob("LKH004",0);
        newMob.clearImmediately = true;
        this.mobs.push(newMob);
        const newMob2 = MobManager.generateDungeonMob("LKH005",0);
        newMob2.clearImmediately = true;
        this.mobs.push(newMob2);
        const newMob3 = MobManager.generateDungeonMob("LKH006",0);
        newMob3.clearImmediately = true;
        this.mobs.push(newMob3);
        this.order = new TurnOrder(this.party.heroes,this.mobs);
        this.order.position += 1;
        initiateDungeonFloor(this.id);
    }
}

const DungeonManager = {
    dungeons : [],
    dungeonCreatingID : null,
    dungeonView : null,
    speed : 1250,
    dungeonPaid : [],
    bossesBeat : [],
    partySize : 1,
    unlockDungeon(id) {
        this.dungeonPaid.push(id);
    },
    bossDungeonCanSee(id) {
        if (this.bossesBeat.includes(id)) return false;
        return this.dungeonByID(id).type === "regular" || this.dungeonPaid.includes(id);
    },
    createSave() {
        const save = {};
        save.dungeons = [];
        this.dungeons.forEach(d => {
            save.dungeons.push(d.createSave());
        });
        save.dungeonPaid = this.dungeonPaid;
        save.speed = this.speed;
        save.bossesBeat = this.bossesBeat;
        save.partySize = this.partySize;
        return save;
    },
    addDungeon(dungeon) {
        this.dungeons.push(dungeon);
    },
    loadSave(save) {
        save.dungeons.forEach(d => {
            const dungeon = DungeonManager.dungeonByID(d.id);
            dungeon.loadSave(d);
        });
        this.speed = save.speed;
        if (typeof save.dungeonPaid !== "undefined") this.dungeonPaid = save.dungeonPaid;
        if (typeof save.bossesBeat !== "undefined") this.bossesBeat = save.bossesBeat;
        if (typeof save.partySize !== "undefined") this.partySize = save.partySize
        refreshSpeedButton(this.speed);
    },
    addTime(t) {
        this.dungeons.forEach(dungeon => {
            dungeon.addTime(t);
        });
    },
    dungeonStatus(dungeonID) {
        return this.dungeons.find(d=>d.id===dungeonID).status;
    },
    removeDungeon(dungeonID) {
        const dungeon = this.dungeonByID(dungeonID);
        dungeon.party = null;
        dungeon.status = DungeonStatus.EMPTY;
    },
    createDungeon() {
        const party = PartyCreator.lockParty();
        const dungeon = this.dungeonByID(this.dungeonCreatingID);
        dungeon.beatTotal = 0;
        if (devtools.dungeonStart !== undefined) dungeon.floorCount = devtools.dungeonStart;
        dungeon.status = DungeonStatus.ADVENTURING;
        this.dungeonView = this.dungeonCreatingID;
        dungeon.initializeParty(party);
        dungeon.nextFloor();
        updateHeroCounter();
    },
    dungeonByID(dungeonID) {
        return this.dungeons.find(d => d.id === dungeonID);
    },
    getCurrentDungeon() {
        return this.dungeonByID(this.dungeonView);
    },
    dungeonSlotCount() {
        const dungeon = this.dungeonByID(this.dungeonCreatingID);
        if (dungeon.type == "boss") return 4;
        return this.partySize;
    },
    bossCount() {
        return this.bossesBeat.length;
    },
    bossMaxCount() {
        return this.dungeons.filter(d => d.type === "boss").length;
    },
};

const dungeonIcons = {
    //[FloorType.FIGHT] : '<img src="images/DungeonIcons/combat_floor.png" alt="Fight">',
    //[FloorType.TREASURE] : '<img src="images/DungeonIcons/treasure_floor.png" alt="Treasure">',
    [Stat.HP] : '<img src="images/DungeonIcons/hp.png" alt="HP">',
    [Stat.POW] : '<img src="images/DungeonIcons/pow.png" alt="POW">',
    [Stat.AP] : '<img src="images/DungeonIcons/ap.png" alt="AP">',
}