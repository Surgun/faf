/*Dungeons consist of three sets of screens:
Clicking on the "Adventures" tab will relocate to the dungeon screen.
This screen JUST has a list of dungeons on it. You can see the progress
of any dungeon (as well as which are available).

Clicking on a dungeon WITHOUT a team brings you to the party selection
screen, where you can select party members for this dungeon. Confirming
a party locks it in and begins the dungeon and brings you to third screen

Adventure screen! Get here by clicking on a dungeon with a group or confirming
a group...
*/

const $dungeonSelect = $("#dungeonSelect");
const $dungeonTeamSelect = $("#dungeonTeamSelect");
const $dungeonRun = $("#dungeonRun");

const $dtsTop = $("#dtsTop");
const $dtsBottom = $("#dtsBottom");

const $DungeonSideBarTeam = $("#DungeonSideBarTeam");

const $dsd1 = $("#dsd1");

const $dungeonSpeedButtons = $(".dungeonSpeedButtons");

$(document).on("click", ".dungeonSpeedButtons", (e) => {
    e.preventDefault();
    $dungeonSpeedButtons.removeClass("dungeonSpeedActive");
    $(e.currentTarget).addClass("dungeonSpeedActive");
    const id = $(e.currentTarget).attr("id");
    console.log(id);
    if (id === "dungeonSpeedSlow") DungeonManager.speed = 3000;
    if (id === "dungeonSpeedNormal") DungeonManager.speed = 1500;
    if (id === "dungeonSpeedFast") DungeonManager.speed = 750;
});

function refreshSpeedButton(speed) {
    $dungeonSpeedButtons.removeClass("dungeonSpeedActive");
    if (speed === 3000) $("#dungeonSpeedSlow").addClass("dungeonSpeedActive");
    if (speed === 1500) $("#dungeonSpeedNormal").addClass("dungeonSpeedActive");
    if (speed === 750) $("#dungeonSpeedFast").addClass("dungeonSpeedActive");
};

//click on a dungeon to start making a team!
$(document).on("click", ".dungeonContainer", (e) => {
    e.preventDefault();
    $dungeonSelect.hide();
    const dungeonID = $(e.currentTarget).attr("id");
    if (DungeonManager.dungeonStatus(dungeonID) === DungeonStatus.ADVENTURING) showDungeon(dungeonID);
    else if (DungeonManager.dungeonStatus(dungeonID) === DungeonStatus.EMPTY) {
        refreshHeroSelect(dungeonID);
        DungeonManager.dungeonCreatingID = dungeonID;
        $dungeonSelect.hide();
        $dungeonTeamSelect.show();
    }
});

function showDungeon(dungeonID) {
    DungeonManager.dungeonView = dungeonID;
    BattleLog.clear();
    initiateDungeonFloor();
    $dungeonSelect.hide();
    $dungeonRun.show();
}

//clicking a hero to remove them from your party
$(document).on('click', "div.dungeonTeamCardClick", (e) => {
    e.preventDefault();
    const heroID = $(e.currentTarget).attr("heroID");
    PartyCreator.removeMember(heroID);
    refreshHeroSelect();
});

//clicking a hero to add them to your party
$(document).on('click', "div.dungeonAvailableCardClick", (e) => {
    e.preventDefault();
    const ID = $(e.currentTarget).attr("heroid");
    PartyCreator.addMember(ID);
    refreshHeroSelect();
});

//locking in a team to start a dungeon
$(document).on('click', "#dungeonTeamButton", (e) => {
    e.preventDefault();
    if (PartyCreator.validTeam()) {
        DungeonManager.createDungeon();
        initiateDungeonFloor();
        initializeSideBarDungeon();
        $dungeonTeamSelect.hide();
        $dungeonRun.show();
        updateHeroCounter();
    }
    else {
        Notifications.noPartySelected();
    }
});

function refreshHeroSelect() {
    //builds the div that we hide and can show when we're selecting for that area
    $dtsTop.empty();
    const d1top = $("<div/>").addClass("dtsTopTitle").html("<h3>Assemble your Team!</h3>");
    $dtsTop.append(d1top);
    const d = $("<div/>").addClass("dungeonTeamCollection");
    PartyCreator.heroes.forEach((hero,i) => {
        const d1 = characterCard("dungeonTeam",i,hero);
        d.append(d1);
    });
    for (let i=0;i<PartyCreator.emptyPartySlots();i++) {
        const d1a = characterCard("dungeonTeam",i).addClass("noHeroDungeonSelect");
        d.append(d1a);
    }
    $dtsTop.append(d);
    const dbutton = $("<div/>").attr("id","dungeonTeamButton").html("Launch Adventure");
    if (PartyCreator.heroes.length === 0) dbutton.addClass('dungeonStartNotAvailable')
    $dtsTop.append(dbutton);
    $dtsBottom.empty();
    const d1bot = $("<div/>").addClass("dtsBotTitle").html("<h3>Your Available Heroes</h3>");
    $dtsBottom.append(d1bot);
    const d2 = $("<div/>").addClass("dungeonAvailableCollection");
    HeroManager.ownedHeroes().forEach(hero => {
        if (!hero.inDungeon && !PartyCreator.heroes.includes(hero.id)) {
            const d3 = characterCard("dungeonAvailable",hero.uniqueid,hero.id);
            d2.append(d3);  
        }
    });
    $dtsBottom.append(d2);
}

const $dungeonListings = $("#dungeonListings");

function refreshDungeonSelect() {
    //shows each dungeon so you can select that shit...
    $dungeonListings.empty();
    DungeonManager.dungeons.forEach(dungeon => {
        const d1 = $("<div/>").addClass("dungeonContainer").attr("id",dungeon.id);
        const d2 = $("<div/>").addClass("dungeonHeader").html(dungeon.name);
        const d3 = $("<div/>").addClass("dungeonStatus").attr("id","ds"+dungeon.id);
        if (dungeon.status === DungeonStatus.ADVENTURING) d3.addClass("dungeonInProgress").attr("id", "floorStatus"+dungeon.id).html(`Floor ${dungeon.floorCount}`);
        else d3.removeClass("dungeonInProgress").html("Idle");
        const d4 = $("<div/>").addClass("dungeonBackground");
        const d5 = $("<div/>").addClass("dungeonAdventurers");
        d1.append(d2,d3,d4,d5);
        if (dungeon.status === DungeonStatus.ADVENTURING) {
            dungeon.party.heroes.forEach(h=> {
                const d5a = $("<div/>").addClass("dungeonHeroDungeonSelect").html(h.head);
                d5.append(d5a);
            });
        }
        $dungeonListings.append(d1);
    })
}


function characterCard(prefix,dv,ID) {
    const d = $("<div/>").addClass(prefix+"Card").attr("data-value",dv);
    const dclick = $("<div/>").addClass(prefix+"CardClick").attr("heroID",dv);
    if (!ID) {
        const d1a = $("<div/>").addClass(prefix+"Image").html('<img src="images/heroes/blank.png">');
        const d2a = $("<div/>").addClass(prefix+"Name").html("Empty");
        return d.append(d1a,d2a);
    }
    const hero = HeroManager.idToHero(ID);
    const d1 = $("<div/>").addClass(prefix+"Image").html(hero.image);
    const d2 = $("<div/>").addClass(prefix+"Name").html(hero.name);
    const d3 = $("<div/>").addClass(prefix+"Pow").html(`${miscIcons.pow} ${hero.getPow()}`);
    const d4 = $("<div/>").addClass(prefix+"HP").html(`${miscIcons.hp} ${hero.maxHP()}`);
    const d5 = $("<div/>").addClass(prefix+"HP").html(`${miscIcons.ap} ${hero.apmax}`);
    dclick.append(d1,d2,d3,d4,d5);
    return d.append(dclick);
}

const $floorID = $("#floorID");
const $dungeonHeroList = $("#dungeonHeroList");
const $dungeonMobList = $("#dungeonMobList");
const $drStatsHero = $("#drStatsHero");
const $drStatsMob = $("#drStatsMob");
const $drTurnOrder = $("#drTurnOrder");

function initiateDungeonFloor() {
    const dungeon = DungeonManager.getCurrentDungeon();
    if (dungeon === undefined) return;
    $floorID.html("Floor "+dungeon.floorCount);
    $dungeonHeroList.empty();
    $dungeonMobList.empty();
    $drStatsHero.empty();
    $drStatsMob.empty();
    dungeon.party.heroes.forEach((hero) => {
        const d1 = $("<div/>").addClass("dfc");
        const d2 = $("<div/>").addClass("dfcName").html(hero.name);
        const d3 = $("<div/>").addClass("dfcImage").html(hero.image);
        const d4 = $("<div/>").addClass("dscHP").html(createHPBar(hero,"Dung"));
        const d5 = $("<div/>").addClass("dscAP").html(createAPBar(hero,"Dung"));
        d1.append(d2,d3,d4,d5);
        $dungeonHeroList.prepend(d1);
    });
    dungeon.mobs.forEach((mob) => {
        const d6 = $("<div/>").addClass("dfm").attr("id","dfm"+mob.uniqueid);
        const d7 = $("<div/>").addClass("dfmName").html(mob.name);
        const d8 = $("<div/>").addClass("dfmImage").html(mob.image);
        const d9 = $("<div/>").addClass("dsmHP").html(createHPBar(mob,"Dung"));
        const d10 = $("<div/>").addClass("dsmAP").html(createAPBar(mob,"Dung"));
        d6.append(d7,d8,d9,d10);
        if (mob.hp === 0) d6.addClass("mobDead");
        if (mob.apAdd === 0) d10.hide();
        $dungeonMobList.append(d6);
    });
    refreshTurnOrder();
}

function refreshTurnOrder() {
    $drTurnOrder.empty();
    const dungeon = DungeonManager.getCurrentDungeon();
    dungeon.order.getOrder().forEach((unit,i) => {
        const d1 = $("<div/>").addClass("orderUnit");
        if (unit.dead()) d1.addClass("orderUnitDead");
        const d1a = $("<div/>").addClass("orderUnitHeadImg").html(unit.head);
        const d1b = $("<div/>").addClass("orderUnitHead").html(unit.name);
        const d1c = $("<div/>").addClass("orderUnitHP").html(createHPBar(unit,"turnOrder"));
        const d1d = $("<div/>").addClass("orderUnitAP").html(createAPBar(unit,"turnOrder"));
        d1.append(d1a,d1b);
        if (settings.toggleTurnOrderBars === 1) d1.append(d1c,d1d);
        if (dungeon.order.position === i) {
            d1.addClass("orderUnitActive").append(createBeatBar(dungeon.dungeonTime));
        };
        $drTurnOrder.append(d1);
    });
}

function initializeSideBarDungeon() {
    $DungeonSideBarTeam.empty();
    DungeonManager.dungeons.forEach(dungeon => {
        if (dungeon.status !== DungeonStatus.ADVENTURING) return;
        const d = $("<div/>").addClass("dungeonGroup");
        const d1 = $("<div/>").attr("id","DungeonSideBarStatus").attr("dungeonID",dungeon.id).html(`${dungeon.name} - Floor ${dungeon.floorCount}`);
        d.append(d1);
        dungeon.party.heroes.forEach(hero => {
            const d3 = $("<div/>").addClass("dungeonSideBarMember");
            const d3a = $("<div/>").addClass("dungeonSideBarMemberIcon").html(hero.head);
            const d3b = $("<div/>").addClass("dungeonSideBarMemberHP").html(sidebarHP(hero));
            d3.append(d3a,d3b);
            d.append(d3);
        });
        $DungeonSideBarTeam.append(d);
    })
}

function sidebarHP(hero) {
    const hpPercent = hero.hp/hero.maxHP();
    const hpWidth = (hpPercent*100).toFixed(1)+"%";
    const d1 = $("<div/>").addClass("dsbhpBarDiv").html(dungeonIcons[Stat.HP]);
    const d1a = $("<div/>").addClass("dsbhpBar").attr("data-label",hero.hp+"/"+hero.maxHP()).attr("id","hpSide"+hero.uniqueid);
    const s1 = $("<span/>").addClass("dsbhpBarFill").attr("id","hpFillSide"+hero.uniqueid).css('width', hpWidth);
    return d1.append(d1a,s1);
}

function createHPBar(hero,tag) {
    const hpPercent = hero.hp/hero.maxHP();
    const hpWidth = (hpPercent*100).toFixed(1)+"%";
    const d1 = $("<div/>").addClass("hpBarDiv").html(dungeonIcons[Stat.HP]);
    const d1a = $("<div/>").addClass("hpBar").attr("data-label",hero.hp+"/"+hero.maxHP()).attr("id","hp"+tag+hero.uniqueid);
    const s1 = $("<span/>").addClass("hpBarFill").attr("id","hpFill"+tag+hero.uniqueid).css('width', hpWidth);
    return d1.append(d1a,s1);
}

function createBeatBar(dungeonTime) {
    const beatWidth = (dungeonTime/DungeonManager.speed*100).toFixed(1)+"%";
    const d1 = $("<div/>").addClass("beatBarDiv");
    const s1 = $("<span/>").addClass("beatBarFill").attr("id","beatbar").css('width', beatWidth);
    return d1.append(s1);
}

function refreshBeatBar(dungeonTime) {
    const beatFill = $("#beatbar");
    const beatWidth = (dungeonTime/DungeonManager.speed*100).toFixed(1)+"%";
    beatFill.css('width',beatWidth);
}

function createAPBar(hero, tag) {
    const apPercent = Math.min(1,hero.ap/hero.apmax);
    const apWidth = (apPercent*100).toFixed(1)+"%";
    const d = $("<div/>").addClass("apBarDiv").html(dungeonIcons[Stat.AP]);
    const d1 = $("<div/>").addClass("apBar").attr("data-label",hero.ap+"/"+hero.apmax).attr("id","ap"+tag+hero.uniqueid);
    const s1 = $("<span/>").addClass("apBarFill").attr("id","apFill"+tag+hero.uniqueid).css('width', apWidth);
    return d.append(d1,s1);
}

function refreshHPBar(hero) {
    const hptypes = ["Party","Dung","Side","turnOrder"];
    const hpPercent = hero.hp/hero.maxHP();
    const hpWidth = (hpPercent*100).toFixed(1)+"%";
    hptypes.forEach(type => {
        $(`#hp${type}${hero.uniqueid}`).attr("data-label",hero.hp+"/"+hero.maxHP());
        $(`#hpFill${type}${hero.uniqueid}`).css('width', hpWidth);
    })
}

function refreshAPBar(hero) {
    const apTypes = ["dung","turnOrder"];
    const apPercent = hero.ap/hero.apmax;
    const apWidth = (apPercent*100).toFixed(1)+"%";
    apTypes.forEach(type => {
        $("#ap"+type+hero.uniqueid).attr("data-label",hero.ap+"/"+hero.apmax);
        $("#apFill"+type+hero.uniqueid).css('width', apWidth);
    });
}