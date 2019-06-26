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

//dungeon team select
const $dtsBanner = $("#dtsBanner");
const $dtsMaterials = $("#dtsMaterials");
const $dtsTop = $("#dtsTop");
const $dtsBottom = $("#dtsBottom");

const $DungeonSideBarTeam = $("#DungeonSideBarTeam");

const $dsd1 = $("#dsd1");

const $dungeonSpeedButtons = $(".dungeonSpeedButtons");

/*---------------------------
/*-   DUNGEON SELECT CODE   -
/*---------------------------*/

const $dungeonListings = $("#dungeonListings");
const $dungeonListingBoss = $("#dungeonListingBoss");

function refreshDungeonSelect() {
    //shows each dungeon so you can select that shit...
    $dungeonListings.empty();
    DungeonManager.dungeons.forEach(dungeon => {
        if (!DungeonManager.bossDungeonCanSee(dungeon.id)) return;
        $dungeonListings.append(dungeonBlock(dungeon));
    });
}

function dungeonBlock(dungeon) {
    const d1 = $("<div/>").addClass("dungeonContainer").attr("id",dungeon.id);
    if (dungeon.type === "boss") d1.addClass("dungeonTypeBoss");
    const d2 = $("<div/>").addClass("dungeonHeader").html(dungeon.name);
    const d3 = $("<div/>").addClass("dungeonStatus").attr("id","ds"+dungeon.id);
    if (dungeon.status === DungeonStatus.ADVENTURING) d3.addClass("dungeonInProgress").html(`Fight in Progress`);
    else if (!DungeonManager.bossDungeonCanSee(dungeon.id)) d3.addClass("dungeonNotOpened").html("Not Opened");
    else d3.addClass("dungeonIdle").html("Idle");
    const d4 = $("<div/>").addClass("dungeonBackground");
    const d5 = $("<div/>").addClass("dungeonAdventurers");
    d1.append(d2,d3,d4,d5);
    if (dungeon.status === DungeonStatus.ADVENTURING) {
        dungeon.party.heroes.forEach(h=> {
            const d5a = $("<div/>").addClass("dungeonHeroDungeonSelect").html(h.head);
            d5.append(d5a);
        });
    }
    return d1;
}


//click on a dungeon to start making a team!
$(document).on("click", ".dungeonContainer", (e) => {
    e.preventDefault();
    const dungeonID = $(e.currentTarget).attr("id");
    const lastParty = DungeonManager.dungeonByID(dungeonID).lastParty;
    $dungeonSelect.hide();
    if (DungeonManager.dungeonStatus(dungeonID) === DungeonStatus.ADVENTURING) showDungeon(dungeonID);
    else if (DungeonManager.dungeonStatus(dungeonID) === DungeonStatus.EMPTY) {
        DungeonManager.dungeonCreatingID = dungeonID;
        PartyCreator.clearMembers();
        PartyCreator.startingTeam(lastParty);
        refreshHeroSelect();
        $dungeonSelect.hide();
        $dungeonTeamSelect.show();
    }
});

/*------------------------
/*-   TEAM SELECT CODE   -
/*------------------------*/
function refreshHeroSelect() {
    const dungeon = DungeonManager.dungeonByID(DungeonManager.dungeonCreatingID);
    //builds the div that we hide and can show when we're selecting for that area
    //Team Banner
    $dtsBanner.empty();
        const b1 = $("<div/>").addClass(`dts${dungeon.id} dtsBackground`).appendTo($dtsBanner);
        const b2 = $("<div/>").addClass(`dts${dungeon.id} dtsHeader`).html(dungeon.name).appendTo($dtsBanner);
            $("<div/>").addClass(`dts${dungeon.id} dtsBackButton`).html(`<i class="fas fa-arrow-left"></i>`).appendTo($dtsBanner);
        if (dungeon.type === "boss") {
            b1.addClass("DBoss");
            b2.addClass("DBoss");
        }
    //Materials in Dungeon
    $dtsMaterials.empty();
    if (dungeon.type !== "boss") {
        const dmTitle = $("<div/>").addClass("dtsMaterialTitle").attr("data-value",dungeon.id).html(`Materials Found In This Dungeon <i class="fas fa-chevron-down"></i>`).appendTo($dtsMaterials);
        const dm = $("<div/>").addClass("dtsMaterialContainer");
        if (settings.expandedMaterials[dungeon.id] === 1) {
            dmTitle.addClass("toggleActive");
            dm.addClass("expanded");
        }
        if (ResourceManager.materialSeenDungeon(dungeon.id).length === 0) {
            const dm1 = $("<div/>").addClass("dtsMaterialNone").html("You have not discovered any materials.");
            dm.append(dm1);
        }
        ResourceManager.materialSeenDungeon(dungeon.id).forEach(m => {
            const dm1 = $("<div/>").addClass("dtsMaterial").appendTo(dm);
                $("<div/>").addClass("dtsMaterialIcon").html(m.img).appendTo(dm1);
                $("<div/>").addClass("dtsMaterialName").html(m.name).appendTo(dm1);
                $("<div/>").addClass("dtsMaterialAmt tooltip").attr("data-tooltip","Amount Owned").html(formatToUnits(m.amt,2)).appendTo(dm1);
        });
        $dtsMaterials.append(dm);
    }
    $dtsTop.empty();
    const d1top = $("<div/>").addClass("dtsTopTitle").html("<h3>Assemble your Team!</h3>");
    $dtsTop.append(d1top);
    const d = $("<div/>").addClass("dungeonTeamCollection");
    //actual members
    PartyCreator.heroes.forEach((hero,i) => {
        const d1 = characterCard("dungeonTeam",i,hero);
        d.append(d1);
    });
    //empty slots
    for (let i=0;i<PartyCreator.emptyPartySlots();i++) {
        const d1a = characterCard("dungeonTeam",i).addClass("noHeroDungeonSelect");
        d.append(d1a);
    }
    $dtsTop.append(d);
    const dbutton = $("<div/>").attr("id","dungeonTeamButton").html("Launch Adventure");
    if (PartyCreator.heroes.length === 0) dbutton.addClass('dungeonStartNotAvailable')
    $dtsTop.append(dbutton);
    $dtsBottom.empty();
    //available heroes
    const d1bot = $("<div/>").addClass("dtsBotTitle").html("<h3>Your Available Heroes</h3>");
    $dtsBottom.append(d1bot);
    const d2 = $("<div/>").addClass("dungeonAvailableCollection");
    HeroManager.ownedHeroes().forEach(hero => {
        if (dungeon.bannedHero.includes(hero.id)) characterCard("heroBanned dungeonNotAvailable",hero.uniqueid,hero.id, "Banned from Here").appendTo(d2);
        else if (hero.inDungeon) characterCard("dungeonNotAvailable",hero.uniqueid,hero.id,"In Dungeon").appendTo(d2);
        else if (PartyCreator.heroes.includes(hero.id)) characterCard("partyHero dungeonNotAvailable",hero.uniqueid,hero.id, "Already in Party").appendTo(d2);
        else characterCard("dungeonAvailable",hero.uniqueid,hero.id,null).appendTo(d2);
    });
    $dtsBottom.append(d2);
}

// Toggle displaying dungeon materials on select screen
$(document).on('click','.dtsMaterialTitle', (e) => {
    e.preventDefault();
    const toggleActive = $(e.currentTarget).hasClass("toggleActive");
    const title = $(".dtsMaterialTitle");
    const dungeonID = title.attr("data-value");
    $(".dtsMaterialContainer").addClass("expanded");
    title.addClass("toggleActive");
    settings.expandedMaterials[dungeonID] = 1;
    if (toggleActive) {
        $(e.currentTarget).removeClass("toggleActive");
        $(".dtsMaterialContainer").removeClass("expanded");
        settings.expandedMaterials[dungeonID] = 0;
    }
    saveSettings();
});

//Go back to dungeon select screen
$(document).on('click', ".dtsBackButton", (e) => {
    e.preventDefault();
    tabClick(e, "dungeonsTab");
});

//clicking a hero to remove them from your party
$(document).on('click', "div.dungeonTeamCardClick", (e) => {
    e.preventDefault();
    const heroID = $(e.currentTarget).attr("heroID");
    PartyCreator.removeMember(heroID);
    refreshHeroSelect(DungeonManager.dungeonCreatingID);
});

//clicking a hero to add them to your party
$(document).on('click', "div.dungeonAvailableCardClick", (e) => {
    e.preventDefault();
    const ID = $(e.currentTarget).attr("heroid");
    PartyCreator.addMember(ID);
    refreshHeroSelect(DungeonManager.dungeonCreatingID);
});

//locking in a team to start a dungeon
$(document).on('click', "#dungeonTeamButton", (e) => {
    e.preventDefault();
    if (PartyCreator.validTeam()) {
        DungeonManager.createDungeon();
        initializeSideBarDungeon();
        $dungeonTeamSelect.hide();
        $dungeonRun.show();
    }
    else {
        Notifications.noPartySelected();
    }
});

function characterCard(prefix,dv,ID,status) {
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
    const d3 = $("<div/>").addClass(prefix+"Stats");
        const d3a = $("<div/>").addClass(prefix+"HP"+" heroStat"+" tooltip").attr("data-tooltip","HP").html(`${miscIcons.hp} ${hero.maxHP()}`);
        const d3b = $("<div/>").addClass(prefix+"AP"+" heroStat"+" tooltip").attr("data-tooltip","AP Per Hit").html(`${miscIcons.ap} ${hero.apAdded()}`);
        d3.append(d3a,d3b);
    const d4 = $("<div/>").addClass(prefix+"Pow"+" heroPowStat"+" tooltip").attr("data-tooltip","POW").html(`${miscIcons.pow} ${hero.getPow()}`);
    const d5 = $("<div/>").addClass("heroStatus").html(status);
    if (status === null) d5.hide();
    else d.addClass("heroUnavailable");
    dclick.append(d1,d2,d3,d4,d5);
    return d.append(dclick);
}

/*-----------------------------------------
/*-   DUNGEON RUNNING CODE
/*-----------------------------------------*/

function showDungeon(dungeonID) {
    DungeonManager.dungeonView = dungeonID;
    BattleLog.clear();
    initiateDungeonFloor(dungeonID);
    $dungeonSelect.hide();
    $dungeonRun.show().removeClass().addClass(dungeonID);
    if (DungeonManager.dungeonByID(dungeonID).type === "boss") $dungeonRun.addClass("DBoss");
}

$(document).on("click", ".dungeonSpeedButtons", (e) => {
    e.preventDefault();
    $dungeonSpeedButtons.removeClass("dungeonSpeedActive");
    $(e.currentTarget).addClass("dungeonSpeedActive");
    const id = $(e.currentTarget).attr("id");
    if (id === "dungeonSpeedSlow") DungeonManager.speed = 3000;
    if (id === "dungeonSpeedNormal") DungeonManager.speed = 1500;
    if (id === "dungeonSpeedFast") DungeonManager.speed = 750;
});

$(document).on("click", "#dungeonAbandon", (e) => {
    e.preventDefault();
    DungeonManager.abandonCurrentDungeon();
})

function refreshSpeedButton(speed) {
    $dungeonSpeedButtons.removeClass("dungeonSpeedActive");
    if (speed === 3000) $("#dungeonSpeedSlow").addClass("dungeonSpeedActive");
    if (speed === 1500) $("#dungeonSpeedNormal").addClass("dungeonSpeedActive");
    if (speed === 750) $("#dungeonSpeedFast").addClass("dungeonSpeedActive");
};

const $floorID = $("#floorID");
const $dungeonHeroList = $("#dungeonHeroList");
const $dungeonMobList = $("#dungeonMobList");
const $drTurnOrder = $("#drTurnOrder");

function initiateDungeonFloor(dungeonID) {
    if (DungeonManager.dungeonView !== dungeonID) return;
    const dungeon = DungeonManager.getCurrentDungeon();
    $dungeonRun.removeClass().addClass(dungeon.id);
    if (dungeon.type === "boss") $dungeonRun.addClass("DBoss");
    $floorID.html("Floor "+dungeon.floorCount);
    $dungeonHeroList.empty();
    $dungeonMobList.empty();
    dungeon.party.heroes.forEach((hero) => {
        const d1 = $("<div/>").addClass("dfc");
        const d2 = $("<div/>").addClass("dfcName").html(hero.name);
        const d3 = $("<div/>").addClass("dfcImage").html(hero.image);
        d1.append(d2,d3);        
        if (settings.toggleTurnOrderBars === 1) {
            $("<div/>").addClass("dscHP").html(createHPBar(hero,"Dung")).appendTo(d1);
            $("<div/>").addClass("dscAP").html(createAPBar(hero,"Dung")).appendTo(d1);
        }
        $dungeonHeroList.prepend(d1);
    });
    dungeon.mobs.forEach((mob) => {
        const d6 = $("<div/>").addClass("dfm").attr("id","dfm"+mob.uniqueid);
        const d7 = $("<div/>").addClass("dfmName").html(mob.name);
        const d8 = $("<div/>").addClass("dfmImage").html(mob.image);
        d6.append(d7,d8);
        if (settings.toggleTurnOrderBars === 1) {
            $("<div/>").addClass("dsmHP").html(createHPBar(mob,"Dung")).appendTo(d6);
            const d10 = $("<div/>").addClass("dsmAP").html(createAPBar(mob,"Dung")).appendTo(d6);
            if (mob.apAdd === 0) d10.hide();
        }
        if (mob.hp === 0) d6.addClass("mobDead");
        $dungeonMobList.prepend(d6);
    });
    refreshTurnOrder(dungeonID);
}

function refreshTurnOrder(dungeonID) {
    if (DungeonManager.dungeonView !== dungeonID) return;
    $drTurnOrder.empty();
    const dungeon = DungeonManager.getCurrentDungeon();
    dungeon.order.getOrder().forEach((unit,i) => {
        const d1 = $("<div/>").addClass("orderUnit");
        if (unit.dead()) d1.addClass("orderUnitDead");
        const d1a = $("<div/>").addClass("orderUnitHeadImg").html(unit.head);
        const d1b = $("<div/>").addClass("orderUnitHead").html(unit.name);
        const d1c = $("<div/>").addClass("orderUnitHP").html(createHPBar(unit,"turnOrder"));
        const d1d = $("<div/>").addClass("orderUnitAP").html(createAPBar(unit,"turnOrder"));
        if (unit.apAdded() === 0) d1d.hidden();
        d1.append(d1a,d1b,d1c,d1d);
        if (dungeon.order.position === i) {
            d1.addClass("orderUnitActive").append(createBeatBar(0));
        };
        $drTurnOrder.append(d1);
    });
}

function initializeSideBarDungeon() {
    $DungeonSideBarTeam.empty();
    DungeonManager.dungeons.forEach(dungeon => {
        if (dungeon.status !== DungeonStatus.ADVENTURING) return;
        const d = $("<div/>").addClass("dungeonGroup");
        const d1 = $("<div/>").addClass("DungeonSideBarStatus").attr("id","dsb"+dungeon.id).html(`${dungeon.name} - Floor ${dungeon.floorCount}`);
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

function refreshDSB(dungeonID) {
    const dungeon = DungeonManager.dungeonByID(dungeonID);
    $("#dsb"+dungeonID).html(`${dungeon.name} - Floor ${dungeon.floorCount}`);
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
    const apTypes = ["Dung","turnOrder"];
    const apPercent = hero.ap/hero.apmax;
    const apWidth = (apPercent*100).toFixed(1)+"%";
    apTypes.forEach(type => {
        $("#ap"+type+hero.uniqueid).attr("data-label",hero.ap+"/"+hero.apmax);
        $("#apFill"+type+hero.uniqueid).css('width', apWidth);
    });
}