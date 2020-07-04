"use strict";

const $dungeonRewards = $("#dungeonRewards");
const $dreHeader = $("#dreHeader");
const $dreTeam = $("#dreTeam");
const $dreLoot = $("#dreLoot");
const $dreStats = $("#dreStats");
const $dreCollect = $("#dreCollect");

function showDungeonReward(dungeonID) {
    $dungeonSelect.hide();
    $dungeonRun.hide();
    $dungeonRewards.show();
    const dungeon = DungeonManager.dungeonByID(dungeonID);
    const state = dungeon.completeState;
    if (dungeon.status !== DungeonStatus.COLLECT) return;
    if (dungeon.type === "boss" && state === "partyDead") $dreHeader.html(`${dungeon.name} Failed`);
    else if (state === "abandoned") $dreHeader.html(`${dungeon.name} Abandoned`);
    else $dreHeader.html(`${dungeon.name} Complete!`);
    $dreTeam.empty();
    dungeon.party.heroes.forEach(hero => {
        const d1 = $("<div/>").addClass("dreTeamHero").appendTo($dreTeam);
            $("<div/>").addClass("dreTeamHeroImage").html(hero.image).appendTo(d1);
            $("<div/>").addClass("dreTeamHeroName").html(hero.name).appendTo(d1);
    });
    $dreLoot.empty();
    dungeon.dropList.forEach(drop => {
        const material = ResourceManager.idToMaterial(drop.id);
        const d2 = $("<div/>").addClass("dreLootDropCard tooltip").attr("data-tooltip",material.name).appendTo($dreLoot);
            $("<div/>").addClass("dreLootDropImage").html(material.img).appendTo(d2);
            $("<div/>").addClass("dreLootDropAmt").html(drop.amt).appendTo(d2);
    });
    $("<div/>").addClass("dreNotoriety").html(`You gained ${dungeon.notoriety()} notoriety with the Action League`).appendTo($dreLoot);
    if (dungeon.dropList.length === 0) $("<div/>").addClass("dreLootNone").html("No Loot Found").appendTo($dreLoot);
    $dreStats.empty();
    const d3 = $("<div/>").addClass("dreStatContainer").appendTo($dreStats);
        $("<div/>").addClass("dreStatHeading").html("Total Time").appendTo(d3);
        $("<div/>").addClass("dreStatDescription").html(timeSince(0,dungeon.dungeonTotalTime)).appendTo(d3);
    const d4 = $("<div/>").addClass("dreStatContainer").appendTo($dreStats);
        $("<div/>").addClass("dreStatHeading").html("Floor Reached").appendTo(d4);
        $("<div/>").addClass("dreStatDescription").html("Floor " + dungeon.floorCount).appendTo(d4);
    const d5 = $("<div/>").addClass("dreStatContainer").appendTo($dreStats);
        $("<div/>").addClass("dreStatHeading").html("Turns Taken").appendTo(d5);
        $("<div/>").addClass("dreStatDescription").html(dungeon.beatTotal + " turns").appendTo(d5);
    if (dungeon.type === "boss") {
        const d6 = $("<div/>").addClass("dreStatContainer").appendTo($dreStats);
            $("<div/>").addClass("dreStatHeading").html("Boss Percent").appendTo(d6);
            $("<div/>").addClass("dreStatDescription").html(dungeon.bossPercent()).appendTo(d6);
    }
    if (dungeon.type === "boss" && state === "bossBeat") $dreRepeat.hide();
    else $dreRepeat.show();
    if (dungeon.dropList.length === 0) $dreCollect.html("End Run");
    else $dreCollect.html("Collect Rewards");
    if (dungeon.type === "boss" && state === "bossBeat" || state === "abandoned"){}
    else {
        DungeonManager.repeatDungeon(dungeonID);
        $dungeonSelect.hide();
        $dungeonTeamSelect.hide();
        $dungeonRun.show();
    }
}

const $dreRepeat = $("#dreRepeat"); 

$(document).on('click', "#dreCollect", (e) => {
    const dungeonID = DungeonManager.dungeonView;
    const dungeon = DungeonManager.dungeonByID(dungeonID);
    dungeon.resetDungeon();
    openTab("dungeonsTab");
})

$(document).on('click', "#dreRepeat", (e) => {
    const dungeonID = DungeonManager.dungeonView;
    DungeonManager.repeatDungeon(dungeonID);
    $dungeonSelect.hide();
    $dungeonTeamSelect.hide();
    $dungeonRun.show();
});
