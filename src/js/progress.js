"use strict";

const $plBoss = $("#plBoss");
const $pbBoss = $("#pbBoss");

const $plRecipeMastery = $("#plRecipeMastery");
const $pbRecipe = $("#pbRecipe");

const $plPerk = $("#plPerk");
const $pbPerk = $("#pbPerk");

const $plOverall = $("#plOverall");
const $pbOverall = $("#pbOverall");

const $progresslist = $("#progresslist");

function initiateMilestoneBldg() {
    $("#milestoneBuilding").show();
    refreshProgress();
}

function refreshProgress() {
    //big progress boxes
    let tally = 0;
    let max = 0;

    $plBoss.html(`${DungeonManager.bossCount()} / 10`);
    const bossPercent = (DungeonManager.bossCount() * 10).toFixed(2);
    $pbBoss.css('width', bossPercent+"%");
    if (DungeonManager.bossCount() === 10) $pbBoss.addClass("progressCompleted");
    tally += DungeonManager.bossCount();
    max += 10;

    $plRecipeMastery.html(`${recipeList.masteryCount()} / ${recipeList.recipeCount()}`);
    const recipePercent = (recipeList.masteryCount()/recipeList.recipeCount()*100).toFixed(2);
    $pbRecipe.css('width', recipePercent+"%");
    if (recipeList.masteryCount() === recipeList.recipeCount()) $pbRecipe.addClass("progressCompleted");
    tally += recipeList.masteryCount();
    max += recipeList.recipeCount();
    
    $plPerk.html(`${Shop.perkCount()} / ${Shop.perkMaxCount()}`);
    const perkPercent = (Shop.perkCount()/Shop.perkMaxCount()*100).toFixed(2);
    $pbPerk.css('width', perkPercent+"%");
    if (Shop.perkCount() === Shop.perkMaxCount()) $pbPerk.addClass("progressCompleted");
    tally += Shop.perkCount();
    max += Shop.perkMaxCount();

    const overallPercent = tally/max;
    if (overallPercent === 1 && achievementStats.endTime === -1) achievementStats.endTime = Date.now();
    $plOverall.html((overallPercent * 100).toFixed(2)+"%");
    $pbOverall.css('width', (overallPercent*100).toFixed(2)+"%");
    if (overallPercent === 1) $pbOverall.addClass("progressCompleted");
}

const $statMaxFloor = $("#statMaxFloor");
const $statFloors = $("#statFloors");
const $statTotalGoldEarned = $("#statTotalGoldEarned");
const $statTotalItems = $("#statTotalItems");
const $statCommons = $("#statCommons");
const $statGoods = $("#statGoods");
const $statGreats = $("#statGreats");
const $statEpics = $("#statEpics");
const $statTimePlayed = $("#statTimePlayed");
const $completeTime = $("#completeTime");

const $statMaxFloorD001 = $("#statMaxFloorD001");
const $statMaxFloorD002 = $("#statMaxFloorD002");
const $statMaxFloorD003 = $("#statMaxFloorD003");

const achievementStats = {
    startTime : 0,
    endTime : -1,
    maxFloor : 0,
    timePlayed : 0,
    totalGoldEarned : 0,
    epicsCrafted : 0,
    greatsCrafted : 0,
    goodsCrafted : 0,
    commonsCrafted : 0,
    totalItemsCrafted : 0,
    totalFloorsBeaten : 0,
    D001floor : 0,
    D002floor : 0,
    D003floor : 0,
    setTimePlayed(ms) {
        this.timePlayed += ms;
        $statTimePlayed.html(timeSince(this.startTime,Date.now()));
        if (achievementStats.endTime > 0) $completeTime.html(timeSince(this.startTime,this.endTime));
    },
    floorRecord(dungeonID, floor) {
        this.totalFloorsBeaten += 1;
        $statFloors.html(this.totalFloorsBeaten);
    },
    craftedItem(rarity) {
        this.totalItemsCrafted += 1;
        if (rarity === "Common") this.commonsCrafted += 1;
        if (rarity === "Good") this.goodsCrafted += 1;
        if (rarity === "Great") this.greatsCrafted += 1;
        if (rarity === "Epic") this.epicsCrafted += 1;
        $statTotalItems.html(formatToUnits(this.totalItemsCrafted,2));
        $statCommons.html(formatToUnits(this.commonsCrafted,2));
        $statGoods.html(formatToUnits(this.goodsCrafted,2));
        $statGreats.html(formatToUnits(this.greatsCrafted,2));
        $statEpics.html(formatToUnits(this.epicsCrafted,2));
    },
    gold(g) {
        this.totalGoldEarned += g;
        $statTotalGoldEarned.html(formatToUnits(this.totalGoldEarned,2));
    },
    createSave() {
        const save = {};
        save.startTime = this.startTime;
        save.endTime = this.endTime;
        save.timePlayed = this.timePlayed;
        save.totalGoldEarned = this.totalGoldEarned;
        save.epicsCrafted = this.epicsCrafted;
        save.greatsCrafted = this.greatsCrafted;
        save.goodsCrafted = this.goodsCrafted;
        save.commonsCrafted = this.commonsCrafted;
        save.totalItemsCrafted = this.totalItemsCrafted;
        return save;
    },
    loadSave(save) {
        this.startTime = save.startTime;
        this.endTime = save.endTime;
        this.maxFloor = save.maxFloor;
        this.timePlayed = save.timePlayed;
        this.totalGoldEarned = save.totalGoldEarned;
        this.epicsCrafted = save.epicsCrafted;
        this.greatsCrafted = save.greatsCrafted;
        this.goodsCrafted = save.goodsCrafted;
        this.commonsCrafted = save.commonsCrafted;
        this.totalItemsCrafted = save.totalItemsCrafted;
        this.totalFloorsBeaten = save.totalFloorsBeaten;
        $statTotalGoldEarned.html(formatToUnits(this.totalGoldEarned,2));
        $statFloors.html(this.totalFloorsBeaten);
        $statTimePlayed.html(timeSince(0,this.timePlayed));
        $statTotalItems.html(this.totalItemsCrafted);
        $statCommons.html(this.commonsCrafted);
        $statGoods.html(this.goodsCrafted);
        $statGreats.html(this.greatsCrafted);
        $statEpics.html(this.epicsCrafted);
    },
}

const $achieve1 = $("#achieve1");
const $achieve2 = $("#achieve2");
const $achieve3 = $("#achieve3");
const $achieve4 = $("#achieve4");
const $achieve5 = $("#achieve5");
const $achieve6 = $("#achieve6");
const $achieve7 = $("#achieve7");
const $achieve8 = $("#achieve8");
const $achieve9 = $("#achieve9");
const $achieve10 = $("#achieve10");