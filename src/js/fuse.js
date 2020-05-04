"use strict";

const $fuseBuilding = $("#fuseBuilding");

class fuse {
    constructor(uniqueID) {
        const props = uniqueIDProperties(uniqueID);
        Object.assign(this, props);
        this.recipe = recipeList.idToItem(this.id);
        this.fuseTime = 0;
        this.started = false;
    }
    createSave() {
        const save = {};
        save.fuseTime = this.fuseTime;
        save.started = this.started;
        save.uniqueID = this.uniqueID;
        return save;
    }
    loadSave(save) {
        if (save.fuseTime !== undefined) this.fuseTime = save.fuseTime;
        if (save.started !== undefined) this.started = save.started;
    }
    addTime(ms) {
        this.fuseTime = Math.min(this.fuseTime+ms,this.getMaxFuse());
    }
    getMaxFuse() {
        return this.recipe.craftTime*this.rarity;
    }
    timeRemaining() {
        return this.getMaxFuse() - this.fuseTime;
    }
    fuseComplete() {
        if (this.notStarted()) return false;
        return this.fuseTime === this.getMaxFuse();
    }
    increaseRarity() {
        this.rarity += 1;
        this.uniqueID = this.id+"_"+this.rarity+"_"+this.sharp;
    }
    notStarted() {
        return !this.started;
    }
}

const FusionManager = {
    slots : [],
    lvl : 1,
    fuseNum : 0,
    createSave() {
        const save = {};
        save.lvl = this.lvl;
        save.slots = [];
        this.slots.forEach(slot => {
            save.slots.push(slot.createSave());
        });
        return save;
    },
    loadSave(save) {
        save.slots.forEach(s => {
            const slot = new fuse(s.uniqueID);
            slot.loadSave(s);
            slot.fuseID = this.fuseNum;
            this.fuseNum += 1;
            this.slots.push(slot);
        });
        if (save.lvl !== undefined) this.lvl = save.lvl;
    },
    addFuse(uniqueid) {
        if (!Inventory.hasThree(uniqueid)) return;
        if (this.slots.length === this.maxSlots()) {
            Notifications.noFuseSlots();
            return;
        }
        const fuseProps = uniqueIDProperties(uniqueid);
        if (ResourceManager.materialAvailable("M001") < this.getFuseCost(fuseProps,1)) {
            Notifications.cantAffordFuse();
            return;
        }
        ResourceManager.deductMoney(this.getFuseCost(fuseProps,1));
        Inventory.removeFromInventoryUID(uniqueid,true);
        Inventory.removeFromInventoryUID(uniqueid,true);
        Inventory.removeFromInventoryUID(uniqueid,true);
        const newFuse = new fuse(uniqueid);
        newFuse.fuseID = this.fuseNum;
        this.fuseNum += 1;
        this.slots.push(newFuse);
        refreshFuseSlots();
        refreshPossibleFuse();
    },
    fuseByID(fuseID) {
        return this.slots.find(f => f.fuseID === fuseID);
    },
    startFuse(fuseid) {
        const fuse = this.fuseByID(fuseid);
        fuse.increaseRarity();    
        fuse.started = true;
        refreshFuseSlots();
    },
    cancelFuse(fuseid) {
        const fuse = this.fuseByID(fuseid);
        if (Inventory.full(3)) {
            Notifications.fuseInvFull();
            return;
        }
        ResourceManager.addMaterial("M001",this.getFuseCost(fuse,1));
        Inventory.addFuseToInventory(fuse,true);
        Inventory.addFuseToInventory(fuse,true);
        Inventory.addFuseToInventory(fuse,true);
        this.slots = this.slots.filter(f=>f.fuseID !== fuseid);
        refreshFuseSlots();
        refreshPossibleFuse();
    },
    addTime(ms) {
        this.slots.forEach(fuse => {
            if (fuse.started) fuse.addTime(ms);
        });
        refreshFuseBars();
    },
    getFuseCost(fuse,rarityBoost=0) {
        const item = recipeList.idToItem(fuse.id);;
        return 4*item.value*(fuse.rarity+rarityBoost);
    },
    aFuseIsDone() {
        return this.slots.some(f=>f.fuseComplete());
    },
    collectFuse(fuseID) {
        const slot = this.slots.find(f=>f.fuseID === fuseID);
        if (slot === undefined || !slot.fuseComplete()) return;
        if (Inventory.full()) {
            Notifications.fuseInvFull();
            return;
        }
        Inventory.addFuseToInventory(slot);
        this.slots = this.slots.filter(f=>f.fuseID !== fuseID);
        refreshFuseSlots();
    },
    maxSlots() {
        return 1+this.lvl;
    },
    addLevel() {
        this.lvl += 1;
        refreshFuseSlots();
    },
    getMaxFuse(uniqueIDProperties) {
        //this takes a uniqueIDProperties return (which is only from the fusion creation screen) to give fuse time
        const recipe = recipeList.idToItem(uniqueIDProperties.id);
        return recipe.craftTime*uniqueIDProperties.rarity;
    }
}

function initiateFusionBldg() {
    $fuseBuilding.show();
    refreshFuseSlots();
    refreshPossibleFuse();
}

function createFuseBar(fuse) {
    const fusePercent = fuse.fuseTime/fuse.getMaxFuse();
    const fuseAmt = msToTime(fuse.getMaxFuse()-fuse.fuseTime);
    const fuseWidth = (fusePercent*100).toFixed(1)+"%";
    const d1 = $("<div/>").addClass("fuseBarDiv").attr("id","fuseBarDiv"+fuse.fuseID);
    const d1a = $("<div/>").addClass("fuseBar").attr("data-label",fuseAmt).attr("id","fuseBar"+fuse.fuseID);
    const s1 = $("<span/>").addClass("fuseBarFill").attr("id","fuseFill"+fuse.fuseID).css('width', fuseWidth);
    return d1.append(d1a,s1);
}

function refreshFuseBars() {
    FusionManager.slots.forEach(fuse => {
        if (fuse.fuseComplete()) {
            $("#fuseBarDiv"+fuse.fuseID).hide();
            $("#fuseSlotCollect"+fuse.fuseID).show();
        }
        const fusePercent = fuse.fuseTime/fuse.getMaxFuse();
        const fuseAmt = msToTime(fuse.getMaxFuse()-fuse.fuseTime);
        const fuseWidth = (fusePercent*100).toFixed(1)+"%";
        $("#fuseBar"+fuse.fuseID).attr("data-label",fuseAmt);
        $("#fuseFill"+fuse.fuseID).css('width', fuseWidth);
    });
}

const $fuseSlots = $("#fuseSlots");
const $fuseList = $("#fuseList");

function refreshFuseSlots() {
    $fuseSlots.empty();
    // Fusion Slots Cards
    const fusionCardsContainer = $("<div/>").addClass(`fusionCardsContainer`).appendTo($fuseSlots);
    FusionManager.slots.forEach(slot => {
        const d1 = $("<div/>").addClass("fuseSlot").addClass("R"+slot.rarity);
        const d2 = $("<div/>").addClass("fuseSlotName itemName").html(slot.name);
        const d3 = createFuseBar(slot);
        const d4 = $("<div/>").addClass("fuseSlotCollect").attr("id","fuseSlotCollect"+slot.fuseID).attr("fuseid",slot.fuseID).html("Collect Fuse").hide();
        const d5 = $("<div/>").addClass("fuseSlotStart").attr("id","fuseSlotStart"+slot.fuseID).attr("fuseid",slot.fuseID).html("Start Fuse").hide();
        const d6 = $('<div/>').addClass("fuseClose").attr("fuseid",slot.fuseID).html(`<i class="fas fa-times"></i>`).hide();
        if (slot.fuseComplete()) {
            d3.hide();
            d4.show();
        }
        if (slot.notStarted()) {
            d3.hide();
            d5.show();
            d6.show();
        }
        d1.append(d2,d3,d4,d5,d6);
        fusionCardsContainer.append(d1);
    });
    for (let i=0;i<FusionManager.maxSlots()-FusionManager.slots.length;i++) {
        const d4 = $("<div/>").addClass("fuseSlot");
        const d5 = $("<div/>").addClass("fuseSlotName itemName").html("Empty");
        d4.append(d5);
        fusionCardsContainer.append(d4);
    }
}

function refreshPossibleFuse() {
    $fuseList.empty();
    // Possible Fusions Header
    const possibleFusionHeaderContainer = $("<div/>").addClass(`possibleFusionHeaderContainer`).prependTo($fuseList);
    const possibleFusionHeader = $("<div/>").addClass(`possibleFusionHeader`).appendTo(possibleFusionHeaderContainer);
    const headingDetails = $("<div/>").addClass("headingDetails").appendTo(possibleFusionHeader);
        $("<div/>").addClass("headingTitle").html(displayText("header_fusion_possible_fuse_title")).appendTo(headingDetails);
        $("<div/>").addClass("headingDescription").html(displayText("header_fusion_possible_fuse_desc")).appendTo(headingDetails);
    // Possible Fusions Cards
    const d2 = $("<div/>").addClass('possibleFuseHolder');
    const rarities = ["rarity_common","rarity_good","rarity_great","rarity_epic"];
    if(Inventory.getFusePossibilities().length === 0) d2.addClass("fuseInvBlank").html("No Items Available to Fuse");
    if(Inventory.getFusePossibilities().length > 0) {
        Inventory.getFusePossibilities().forEach(f => {
            const d3 = $("<div/>").addClass("possibleFusegroup");
            const fuseRarity = displayText("fusion_possible_fuse_rarity").replace("{0}",displayText(`${rarities[f.rarity]}`));
            const d4 = $("<div/>").addClass("possibleFusegroupHeader").addClass("possibleFuseRarity"+f.rarity).html(fuseRarity);
            const d5 = $("<div/>").addClass("possibleFuse").html(f.name);
            const d6 = $("<div/>").addClass("fuseTime tooltip").attr("data-tooltip","fuse_time").html(`<i class="fas fa-clock"></i> ${msToTime(FusionManager.getMaxFuse(f))}`);
            const d7 = $("<div/>").addClass("fuseStart").attr("uniqueid",f.uniqueID);
                $("<div/>").addClass("fuseStartText").html("Fuse").appendTo(d7);
                $("<div/>").addClass("fuseStartCost tooltip").attr({"data-tooltip": "gold_value", "data-tooltip-value": formatWithCommas(FusionManager.getFuseCost(f,0))}).html(`${ResourceManager.materialIcon("M001")}${formatToUnits(FusionManager.getFuseCost(f),2)}`).appendTo(d7);
            d3.append(d4,d5,d6,d7);
            d2.append(d3);
        });
    }
    $fuseList.append(d2);
}
    
$(document).on('click', '.fuseStart', (e) => {
    e.preventDefault();
    destroyTooltip();
    const uniqueid = $(e.currentTarget).attr("uniqueid");
    FusionManager.addFuse(uniqueid);
});

$(document).on('click', '.fuseClose', (e) => {
    e.preventDefault();
    const fuseid = parseInt($(e.currentTarget).attr("fuseid"));
    FusionManager.cancelFuse(fuseid);
})

$(document).on('click', '.fuseSlotStart', (e) => {
    e.preventDefault();
    const fuseid = parseInt($(e.currentTarget).attr("fuseid"));
    FusionManager.startFuse(fuseid);
});

$(document).on('click', '.fuseSlotCollect', (e) => {
    e.preventDefault();
    const id = parseInt($(e.currentTarget).attr("fuseid"));
    FusionManager.collectFuse(id);
});