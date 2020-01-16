"use strict";

const EventManager = {
    events : [],
    oldEvents : [],
    eventDB : [],
    eventNum : 0,
    seeOld : false,
    createSave() {
        const save = {};
        save.events = [];
        this.events.forEach(e => {
            save.events.push(e.createSave());
        })
        save.oldEvents = [];
        this.oldEvents.forEach(e => {
            save.oldEvents.push(e.createSave());
        })
        return save;
    },
    loadSave(save) {
        save.events.forEach(e => {
            const eventTemplate = this.idToEventDB(e.id);
            const event = new Event(eventTemplate);
            event.loadSave(e);
            event.eventNum = this.eventNum;
            this.eventNum += 1;
            this.events.push(event);
        });
        if (save.oldEvents === undefined) return;
        save.oldEvents.forEach(e => {
            const eventTemplate = this.idToEventDB(e.id);
            const event = new Event(eventTemplate);
            event.loadSave(e);
            event.eventNum = this.eventNum;
            this.eventNum += 1;
            this.oldEvents.push(event);
        });
    },
    loadEvent(props) {
        this.eventDB.push(new EventTemplate(props));
    },
    idToEventDB(eventID) {
        return this.eventDB.find(e => e.id === eventID);
    },
    eventNumToEvent(eventNum) {
        return this.events.concat(this.oldEvents).find(event => event.eventNum === eventNum)
    },
    addEvent(eventID) {
        const eventTemplate = this.idToEventDB(eventID);
        const event = new Event(eventTemplate);
        event.eventNum = this.eventNum;
        this.eventNum += 1;
        if (event.id === "E001") event.reward = [new idAmt("M001",miscLoadedValues.startingGold)];
        this.events.push(event);
        refreshEvents();
    },
    hasEvents() {
        return this.events.length > 0;
    },
    hasSeen(eventID) {
        return this.events.concat(this.oldEvents).map(e=>e.id).includes(eventID);
    },
    readEvent(eventNum) {
        const event = this.eventNumToEvent(eventNum);
        if (event.reward !== null) {
            event.reward.forEach(reward => {
                ResourceManager.addMaterial(reward.id, reward.amt);
            })
        }
        event.reward = null;
        if (event.type === "letter" && !this.oldEvents.map(e=>e.id).includes(event.id)) this.oldEvents.push(event);
        this.events = this.events.filter(e=>e.eventNum !== eventNum);
        $eventContent.empty();
        refreshEvents();
    },
    badCraft() {
        if (!EventManager.hasSeen("E018")) EventManager.addEvent("E018");
    },
    allDungeonEventIDs() {
        return this.events.filter(e => e.type === "dungeon").map(e => e.eventNum);
    },
};

class EventTemplate {
    constructor (props) {
        Object.assign(this, props);
        this.image = '<img src="/assets/images/DungeonIcons/event.png" alt="Event">';
        const event2icons = ["E014", "E015", "E016"];
        if (event2icons.includes(this.id)) this.image = '<img src="/assets/images/DungeonIcons/event2.png" alt="Event">';
        else this.image = '<img src="/assets/images/DungeonIcons/event.png" alt="Event">';
    }
}

class Event {
    constructor(props) {
        this.reward = null;
        this.itemReward = null;
        this.time = null;
        this.floor = null;
        this.recipeRewards = null;
        this.bossKill = null;
        this.beats = null;
        Object.assign(this, props);
        this.date = currentDate();
    }
    createSave() {
        const save = {};
        save.id = this.id;
        save.reward = this.reward;
        save.time = this.time;
        save.floor = this.floor;
        save.date = this.date;
        save.itemReward = this.itemReward;
        save.bossKill = this.bossKill;
        save.beats = this.beats;
        return save;
    }
    loadSave(save) {
        this.reward = save.reward;
        this.time = save.time;
        this.floor = save.floor;
        this.date = save.date;
        if (save.bossKill !== undefined) this.bossKill = save.bossKill;
        if (save.itemReward !== undefined) this.itemReward = save.itemReward;
        if (save.beats !== undefined) this.beats = save.beats;
    }
};

const $eventList = $("#eventList");
const $eventContent = $("#eventContent");
const $eventTab = $("#eventTab");

function refreshEvents() {
    //$eventContent.empty();
    if (EventManager.hasEvents()) $eventTab.addClass("hasEvent");
    else $eventTab.removeClass("hasEvent");
    $eventList.empty();
    let events = EventManager.events;
    if (EventManager.seeOld) events = EventManager.oldEvents;
    events.forEach(event => {
        const d1 = $("<div/>").addClass("eventList").attr("eventNum",event.eventNum).html(`${event.image} ${event.title}`);
        $eventList.append(d1);
    });
    if (events.length == 0) {
        const d1 = $("<div/>").addClass("events-placeholder-details").html("You have no mail to read at the moment."); 
        $eventList.append(d1);
    }
}

function dungeonDrops(event) {
    //returns a bunch of divs for the rewards
    const d = $("<div/>").addClass("rewardDiv");
    const d1 = $("<div/>").addClass("rewardDivTitle").html("Rewards");
    d.append(d1);
    if (event.reward === undefined) return d;
    event.reward.forEach(reward => {
        const d2 = $("<div/>").addClass("rewardCard tooltip").attr({"data-tooltip":"material_desc","data-tooltip-value":reward.id});
        const d3 = $("<div/>").addClass("rewardImage").html(ResourceManager.idToMaterial(reward.id).img);
        const d4 = $("<div/>").addClass("rewardAmt").html(reward.amt);
        d.append(d2.append(d3,d4));
    });
    return d;
}

function bossRecipeUnlocks(recipes) {
    const d = $("<div/>").addClass("rewardDiv");
    const d1 = $("<div/>").addClass("rewardDivTitle").html("Rewards");
    d.append(d1);
    recipes.forEach(recipe => {
        const d2 = $("<div/>").addClass("rewardCard tooltip").attr({"data-tooltip":"recipe_desc","data-tooltip-value":recipe.name});
        const d3 = $("<div/>").addClass("rewardImage").html(recipe.itemPic());
        d.append(d2.append(d3));
    });
    return d;
}

$(document).on('click', "div.eventList", (e) => {
    //display the text for a clicked event
    e.preventDefault();
    $("div.eventList").removeClass("highlight");
    $(e.currentTarget).addClass("highlight");
    const eventNum = parseInt($(e.currentTarget).attr("eventNum"));
    const event = EventManager.eventNumToEvent(eventNum);
    $eventContent.empty();
    const d = $("<div/>").addClass("eventBody");
    const d1 = $("<div/>").addClass("eventAuthor").html(`<span>Received from:</span> ${event.author}`);
    const d1a = $("<div/>").addClass("eventAuthor").html(`<span>Date:</span> ${event.date}`);
    const d2 = $("<div/>").addClass("eventMessage").html(event.message);
    d.append(d1,d1a,d2);
    if (event.reward !== null ) {
        const d4 = $("<div/>").addClass("eventReward").html(dungeonDrops(event));
        d.append(d4);
    }
    if (event.itemReward !== null) {
        const item = recipeList.idToItem(event.itemReward.id);
        const d5 = $("<div/>").addClass("iR"+event.itemReward.rarity).html(item.itemPicName());
        d.append(d5);
    }
    const d7 = $("<div/>").addClass("eventActionsContainer").appendTo(d);
        $("<div/>").addClass("eventConfirm eventActionButton").attr("eventID",eventNum).html("Accept").appendTo(d7);
    if (EventManager.seeOld) d7.hide();
    if (event.type === "dungeon") $("<div/>").attr("id","eventCollectAll").addClass("eventActionButton").html("Collect All Dungeon Rewards").appendTo(d7);
    $eventContent.append(d);
});

$(document).on('click', "div.eventConfirm", (e) => {
    //gets rid of event, and adds to inventory if you need to
    e.preventDefault();
    const eventID = parseInt($(e.currentTarget).attr("eventID"));
    EventManager.readEvent(eventID);
})

$(document).on('click', "#eventCollectAll", (e) => {
    e.preventDefault();
    const eventIDs = EventManager.allDungeonEventIDs();
    eventIDs.forEach(eventID => EventManager.readEvent(eventID));
})

$(document).on('click', "#readNew", (e) => {
    $(e.currentTarget).addClass("readActive");
    $("#readOld").removeClass("readActive");
    EventManager.seeOld = false;
    refreshEvents();
})

$(document).on('click', "#readOld", (e) => {
    $(e.currentTarget).addClass("readActive");
    $("#readNew").removeClass("readActive");
    EventManager.seeOld = true;
    refreshEvents();
})

function eventChecker() {
    if (!EventManager.hasSeen("E002") && !WorkerManager.workers.some(w => w.type === "standard" && !w.owned)) EventManager.addEvent("E002");
    if (!EventManager.hasSeen("E003") && WorkerManager.workers.some(w => w.type === "advanced" && w.owned)) EventManager.addEvent("E003");
    if (!EventManager.hasSeen("E005") && achievementStats.totalItemsCrafted >= 10000) EventManager.addEvent("E005");
    if (!EventManager.hasSeen("E006") && masteredItem) EventManager.addEvent("E006");
    if (!EventManager.hasSeen("E007") && Inventory.full()) EventManager.addEvent("E007");
    if (!EventManager.hasSeen("E009") && Shop.purchased.includes("AL4101")) EventManager.addEvent("E009");
    if (!EventManager.hasSeen("E010") && Shop.purchased.includes("AL4102")) EventManager.addEvent("E010");
    if (!EventManager.hasSeen("E011") && Shop.purchased.includes("AL4103")) EventManager.addEvent("E011");
    if (!EventManager.hasSeen("E012") && Shop.purchased.includes("AL4104")) EventManager.addEvent("E012");
    if (!EventManager.hasSeen("E017") && achievementStats.highestFloor() >= 50) EventManager.addEvent("E017");
    if (!EventManager.hasSeen("E019") && Shop.purchased.includes("AL4106")) EventManager.addEvent("E019");
    if (!EventManager.hasSeen("E020") && Shop.purchased.includes("AL4107")) EventManager.addEvent("E020");
    if (!EventManager.hasSeen("E021") && Shop.purchased.includes("AL41071")) EventManager.addEvent("E021");
    if (!EventManager.hasSeen("E022") && Shop.purchased.includes("AL41072")) EventManager.addEvent("E022");
}

let masteredItem = false;