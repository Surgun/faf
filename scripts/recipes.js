"use strict";

const ItemType = ["Armor", "Axes", "Belts", "Bows", "Cloaks", "Darts", "Earrings", "Gauntlets", "Gloves", "Hats", "Helmets", "Instruments", "Knives", "Maces", "Masks", "Pendants", "Potions", "Rings", "Rods", "Shields", "Shoes", "Spears", "Staves", "Swords", "Thrown", "Tomes", "Vests", "Wands", "Wards", "Whips"];

const $RecipeResults = $("#RecipeResults");

class Item{
    constructor (props) {
        Object.assign(this, props);
        this.owned = false;
        this.craftCount = 0;
        this.autoSell = "None";
        this.autoSacrifice = false;
    }
    createSave() {
        const save = {};
        save.id = this.id;
        save.owned = this.owned;
        save.craftCount = this.craftCount;
        save.autoSell = this.autoSell;
        save.autoSacrifice = this.autoSacrifice;
        return save;
    }
    loadSave(save) {
        this.owned = save.owned;
        this.craftCount = save.craftCount;
        this.autoSell = save.autoSell;
        if (save.autoSacrifice !== undefined) this.autoSacrifice = save.autoSacrifice;
    }
    itemDescription() {
        return this.description;
    }
    itemPicName() {
        return "<img src='images/recipes/"+this.type+"/"+this.id+".png'>"+"<div class='item-name'>"+this.name+"</div>";
    }
    itemPic() {
        return "<img src='images/recipes/"+this.type+"/"+this.id+".png'>";
    }
    imageValue() {
        return ResourceManager.formatCost("M001",formatToUnits(this.value,1));
    }
    visualizeRes() {
        const d = $("<div/>").addClass("itemCost")
        this.rcost.forEach(resource => {
            const resourceNameForTooltips = resource.charAt(0).toUpperCase()+resource.slice(1);
            d.append($("<div/>").addClass("indvCost tooltip").attr("data-tooltip",resourceNameForTooltips).html('<img src="images/resources/'+resource+'.png">'));
        })
        return d;
    }
    visualizeMat() {
        const d = $("<div/>").addClass("itemCost");
        for (const [material, amt] of Object.entries(this.mcost)) {
            const mat = ResourceManager.idToMaterial(material);
            const d1 = $("<div/>").addClass("indvCost tooltip").attr("id","vr"+this.id).attr("data-tooltip",mat.name).html(ResourceManager.formatCost(material,amt));
            d.append(d1);
        }
        return d;
    }
    getCost(resource) {
        if (resource in this.rcost) return this.rcost[resource];
        return 0;
    }
    act() {
        return this.actTime;
    }
    recipeListStats() {
        const d = $("<div/>").addClass("recipeStatList");
        if (this.actTime > 0) {
            let speed = "Fair";
            if (this.actTime > 5000) speed = "Slow";
            else if (this.actTime < 5000) speed = "Fast";
            const d1 = $("<div/>").addClass("recipeStatListAct tooltip").attr("data-tooltip", "ACT").html(miscIcons.act + speed);
            d.append(d1);
        }
        if (this.pow > 0) {
            const d2 = $("<div/>").addClass("recipeStatListPow tooltip").attr("data-tooltip", "POW").html(miscIcons.pow + this.pow);
            d.append(d2);
        }
        if (this.hp > 0) {
            const d3 = $("<div/>").addClass("recipeStatListHP tooltip").attr("data-tooltip", "HP").html(miscIcons.hp + this.hp);
            d.append(d3);
        }
        return d;
    }
    remainingReqs() {
        let s = ""
        this.rcost.forEach(r => {
            if (WorkerManager.lvlByType(r) >= this.lvl) return;
            const mat = r.charAt(0).toUpperCase() + r.slice(1);
            s += `Lv${this.lvl} ${mat} Worker, `
        });
        return s.slice(0, -2);
    }
    count() {
        return Math.min(this.craftCount,100);
    }
    addCount() {
        this.craftCount += 1;
        if (this.craftCount === 100) {
            masteredItem = true;
            refreshCraftCount();
            initializeActionSlots();
            refreshProgress();
        }
        $("#rc"+this.id).html(this.count()+"/100");
    }
    isMastered() {
        return this.craftCount >= 100;
    }
    autoSellToggle() {
        if (this.autoSell === "None") this.autoSell = "Common";
        else if (this.autoSell === "Common") this.autoSell = "Good";
        else if (this.autoSell === "Good") this.autoSell = "Great";
        else if (this.autoSell === "Great") this.autoSell = "Epic";
        else this.autoSell = "None";
    }
    autoSacrificeToggle() {
        this.autoSacrifice = !this.autoSacrifice;
    }
}

$(document).on("click",".recipeHeadName",(e) => {
    e.preventDefault();
    sortRecipesByHeading("name");
    recipeCanCraft();
});

$(document).on("click",".recipeHeadLvl",(e) => {
    e.preventDefault();
    sortRecipesByHeading("default");
    recipeCanCraft();
});

$(document).on("click",".recipeHeadTime",(e) => {
    e.preventDefault();
    sortRecipesByHeading("default");
    recipeCanCraft();
});

$(document).on("click",".recipeHeadValue",(e) => {
    e.preventDefault();
    sortRecipesByHeading("default");
    recipeCanCraft();
});

$(document).on("click",".recipeHeadCount",(e) => {
    e.preventDefault();
    sortRecipesByHeading("mastery");
    recipeCanCraft();
});

function sortRecipesByHeading(heading) {
    if (recipeList.recipeCategory === heading) recipeList.recipeCategory = heading+"Asc";
    else recipeList.recipeCategory = heading;
    initializeRecipes(recipeList.recipePop, recipeList.recipeCategory);
}

const recipeList = {
    recipes : [],
    recipeNewFilter : [],
    recipeCategory : "default",
    recipePop : "knives",
    createSave() {
        const save = [];
        this.recipes.forEach(r=> {
            save.push(r.createSave());
        });
        return save;
    },
    createFilterSave() {
        return this.recipeNewFilter;
    },
    loadSave(save) {
        save.forEach(i => {
            const rec = this.idToItem(i.id);
            rec.loadSave(i);
        });
    },
    loadRecipeFilterSave(save) {
        this.recipeNewFilter = save;
    },
    addItem(item) {
        this.recipes.push(item);
    },
    listByType(type) {
        return this.recipes.filter(recipe => recipe.type === type);
    },
    idToItem(id) {
        return this.recipes.find(recipe => recipe.id === id);
    },
    getNextBuyable(type) {
        const itemlvls = this.recipes.filter(r => r.owned && r.type === type).map(f => f.lvl);
        itemlvls.push(0);
        const maxLvl = Math.max(...itemlvls)
        return this.recipes.find(recipe => recipe.type === type && recipe.lvl === maxLvl+1);
    },
    buyable() {
        return true;
    },
    buyBP(id) {
        const item = this.idToItem(id);
        const amt = item.recipeBuy;
        //const amt = miscLoadedValues.recipeBuy[item.lvl-1]
        if (ResourceManager.materialAvailable("M001") < amt) {
            Notifications.cantAffordBlueprint();
            return;
        }
        ResourceManager.deductMoney(amt);
        item.owned = true;
        initializeRecipes(recipeList.recipePop, "default")
        refreshWorkers();
    },
    ownAtLeastOneOrCanBuy(type) {
        let returnVal = true;
        const owned = this.recipes.filter(recipe => recipe.type === type && recipe.owned).length;
        if (owned === 0) {
            const item = this.getNextBuyable(type);
            item.rcost.forEach(r => {
                if (WorkerManager.lvlByType(r) >= item.lvl) return;
                returnVal = false;
            });
        }
        return returnVal;
    },
    canBuy(type) {
        const item = this.getNextBuyable(type);
        if (item === undefined) return false;
        return item.rcost.every(r => WorkerManager.lvlByType(r) >= item.lvl)
    },
    moreRecipes(type) {
        return this.recipes.filter(r => !r.owned && type === r.type).length > 0;
    },
    remainingReqs(type) {
        const item = this.getNextBuyable(type);
        if (item === undefined) return null;
        return item.remainingReqs();
    },
    recipeIDByTypeLvl(type,lvl) {
        return this.recipes.find(r => r.type === type && r.lvl === lvl).id;
    },
    masteryCount() {
        return this.recipes.filter(r=>r.isMastered()).length;
    },
    recipeCount() {
        return this.recipes.length;
    },
    advancedWorkerUnlock() {
        return this.recipes.filter(r => r.owned).some(recipe => recipe.lvl >= 5);
    }
}

function refreshRecipeFilters() {
    //hide recipe buttons if we don't know know a recipe and also can't learn one...
    ItemType.forEach(type => {
        const recipeIcon = $("#rf"+type);
        if (recipeList.canBuy(type)) recipeIcon.addClass("hasEvent");
        else recipeIcon.removeClass("hasEvent");
        if (recipeList.ownAtLeastOneOrCanBuy(type)) recipeIcon.show();
        else recipeIcon.hide();
    });
}

function initializeRecipes(type,sortType) {
    recipeList.recipePop = type;
    //filtering
    let rFilter = recipeList.recipes.filter(r => r.owned);
    if (type === "Matless") {
        rFilter = rFilter.filter(r => r.mcost.length === 0 || r.isMastered());
        if (rFilter.length === 0) {
            Notifications.noItemFilter();
            return;
        }
    }
    else if (ResourceManager.isAMaterial(type)) {
        rFilter = rFilter.filter(r => r.mcost.hasOwnProperty(type) && !r.isMastered());
        if (rFilter.length === 0) {
            Notifications.noItemFilter();
            return;
        }
    }
    else rFilter = rFilter.filter(r => r.type === type);
    if (sortType === "default") rFilter.sort((a, b) => a.id.localeCompare(b.id))
    if (sortType === "defaultAsc") rFilter.sort((a, b) => b.id.localeCompare(a.id))
    if (sortType === "name") rFilter.sort((a, b) => a.name.localeCompare(b.name))
    if (sortType === "nameAsc") rFilter.sort((a, b) => b.name.localeCompare(a.name))
    if (sortType === "mastery") rFilter.sort((a,b) => Math.min(100,a.craftCount)-Math.min(100,b.craftCount));
    if (sortType === "masteryAsc") rFilter.sort((a,b) => Math.min(100,b.craftCount)-Math.min(100,a.craftCount));
    //generate the lists
    $RecipeResults.empty();
    //cycle through everything in bp's and make the div for it
    const table = $('<div/>').addClass('recipeTable');
    const tableHeader = $('<div/>').addClass('recipeHeader');
    const htd1 = $('<div/>').addClass('recipeHeadName isSortableHead').html("NAME");
    const htd2 = $('<div/>').addClass('recipeHeadLvl isSortableHead').html("LVL");
    const htd3 = $('<div/>').addClass('recipeHeadRes').html("RESOURCES");
    const htd4 = $('<div/>').addClass('recipeHeadCost').html("MATS");
    const htd5 = $('<div/>').addClass('recipeHeadStats').html("STATS");
    const htd6 = $('<div/>').addClass('recipeHeadTime isSortableHead').html("TIME");
    const htd7 = $('<div/>').addClass('recipeHeadValue isSortableHead').html("VALUE");
    const htd8 = $('<div/>').addClass('recipeHeadCount isSortableHead').html("MASTERY");
    tableHeader.append(htd1,htd2,htd3,htd4,htd5,htd6,htd7,htd8);
    //table.append(tableHeader);
    const tableContents = $('<div/>').addClass('recipeContents');
    //rows of table
    let alternate = false;
    let lastRow = null;

    rFilter.forEach((recipe) => {
        const td1 = $('<div/>').addClass('recipeName').attr("id",recipe.id).append(recipe.itemPicName());
        const td1a = $('<div/>').addClass('recipeDescription tooltip').attr("data-tooltip",recipe.itemDescription()).html("<i class='fas fa-info-circle'></i>");
        const td2 = $('<div/>').addClass('recipeLvl').html(recipe.lvl);
        const td3 = $('<div/>').addClass('recipecostdiv');
        const td3a = $('<div/>').addClass('reciperesdiv').html(recipe.visualizeRes());
        const td3a1 = $("<div/>").addClass("recipeResHeader recipeCardHeader").html("Resources");
        td3a.prepend(td3a1);
        const td3b = $('<div/>').addClass('recipematdiv').html(recipe.visualizeMat());
        const td3b1 = $("<div/>").addClass("recipeMatHeader recipeCardHeader").html("Materials");
        td3b.prepend(td3b1);
        td3.append(td3a, td3b);
        const td4 = $('<div/>').addClass('recipeStats').html(recipe.recipeListStats());
        const td4a = $("<div/>").addClass("recipeStatHeader recipeCardHeader").html("Statistics");
        td4.prepend(td4a);
        const td5 = $('<div/>').addClass('recipeTime').html(msToTime(recipe.craftTime))
        const td5a = $("<div/>").addClass("recipeTimeHeader recipeCardHeader").html("Craft Time");
        td5.prepend(td5a);
        const td6 = $('<div/>').addClass('recipeValue').html(recipe.imageValue());
        const td6a = $("<div/>").addClass("recipeValueHeader recipeCardHeader").html("Value");
        td6.prepend(td6a);
        const craftCount = Math.min(100,recipe.craftCount);
        const td7 = $('<div/>').addClass('recipeCount');
        const td7a = $("<div/>").addClass("recipeMasteryHeader recipeCardHeader").html("Mastery");
        const td7b = $('<div/>').addClass('recipeCountStatus').attr("id","rc"+recipe.id).html(craftCount+"/100");
        td7.append(td7a,td7b);
        const row = $('<div/>').addClass('recipeRow').attr("id","rr"+recipe.id).append(td1,td1a,td2,td3,td4,td5,td6,td7);
        lastRow = row;
        if (alternate) row.addClass("recipeRowHighlight");
        alternate = !alternate;
        tableContents.append(row);
    });
    table.append(tableContents);
    if (lastRow !== null) lastRow.addClass("recipeRowLast");
    $RecipeResults.append(table);
    refreshBlueprint(type)
}

function refreshCraftCount() {
    recipeList.recipes.forEach((recipe) => {
        const rr = $("#rc"+recipe.id)
        rr.html(recipe.count()+"/100");
        if (recipe.isMastered()) $("#vr"+recipe.id).addClass("masteredMat");
    });
}

function recipeCanCraft() {
    //loops through recipes, adds class if disabled
    $(".recipeRow").removeClass("recipeRowDisable");
    recipeList.recipes.forEach(recipe => {
        if (!WorkerManager.canCurrentlyCraft(recipe)) $("#rr"+recipe.id).addClass("recipeRowDisable");
    }) 
}

const $blueprintUnlock = $("#BlueprintUnlock");

let cacheBlueprintType = null;

function refreshBlueprint(type) {
    type = type || cacheBlueprintType;
    cacheBlueprintType = type;
    $blueprintUnlock.empty();
    const d = $("<div/>").addClass('bpShop');
    const nextRecipe = recipeList.getNextBuyable(type);
    if (recipeList.moreRecipes(type)) {
        const d1a = $("<div/>").addClass('bpShopTitle').html("Next Blueprint Unlock");
        const d1 = $("<div/>").addClass('bpShopName').html(nextRecipe.itemPicName());
        d.append(d1a,d1);
    }
    else {
        return;
    }
    const needed = recipeList.remainingReqs(type);
    if (needed.length === 0) {
        let amt = `${miscIcons.gold}&nbsp;&nbsp;${nextRecipe.recipeBuy}`
        if (nextRecipe.recipeBuy === 0) amt = "FREE";
        const b1 = $("<div/>").addClass('bpShopButton').attr("id",nextRecipe.id).html(`UNLOCK - ${amt}`);
        //const b1 = $("<div/>").addClass('bpShopButton').attr("id",nextRecipe.id).html(`UNLOCK - ${miscIcons.gold}&nbsp;&nbsp;${miscLoadedValues.recipeBuy[nextRecipe.lvl-1]}`);
        d.append(b1);
    }
    else {
        const d2 = $("<div/>").addClass('bpReq');
        const d2a = $("<div/>").addClass('bpReqHeading').html("Prerequisite Workers");
        const d2b = $("<div/>").addClass('bpReqNeeded').html(needed);
        d2.append(d2a, d2b);
        d.append(d2);
    }
    $blueprintUnlock.append(d);
}

$(document).on('click', '.recipeName', (e) => {
    //click on a recipe to slot it
    e.preventDefault();
    const type = $(e.target).attr("id");
    //const item = recipeList.idToItem(type);
    actionSlotManager.addSlot(type);
});

$(document).on('click', '.recipeSelect', (e) => {
    //click on a recipe filter
    e.preventDefault();
    const type = $(e.target).attr("id").substring(2);
    recipeList.recipeNewFilter = recipeList.recipeNewFilter.filter(t => t !== type);
    refreshRecipeFilters();
    if (recipeList.recipeCategory !== "default") {
        recipeList.recipeCategory = "default";
        initializeRecipes("default");
    }
    initializeRecipes(type,"default");
})

$(document).on('click','.bpShopButton', (e) => {
    e.preventDefault();
    const id = $(e.target).attr('id');
    recipeList.buyBP(id);
    refreshRecipeFilters();
});

