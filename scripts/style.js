// Tab Selection for Recipes List

const recipeItems = document.querySelectorAll(".recipeSelect");

recipeItems.forEach((recipeItem) => recipeItem.addEventListener("click", tabHighlight));

function tabHighlight() {
    recipeItems.forEach((recipeItem) => recipeItem.classList.remove("selected"));
    this.classList.add("selected");
}

// Tab Selection for Navigation

const navTabs = document.querySelectorAll(".tablinks");

navTabs.forEach((navTab) => {
    navTab.addEventListener("click", navTabHighlight);
});

function navTabHighlight(evt, tgt) {
    navTabs.forEach((navTab) => {
        navTab.classList.remove("tab-selected");
    });
    if (tgt) {
        tgt.classList.add("tab-selected");
    } else {
        evt.target.parentNode.classList.add("tab-selected");
    }      
}

// Status Container Expand and Collapse

const sideHeadings = document.querySelectorAll("#side-content .heading");

sideHeadings.forEach((heading) => heading.addEventListener("click", toggleState));

function toggleState(e) {
    if (e.currentTarget.parentNode.classList.contains("height-collapse")) {
        e.currentTarget.parentNode.classList.remove("height-collapse");
        let arrow = e.currentTarget.getElementsByClassName("heading-arrow");
        arrow[0].classList.remove("arrow-rotate");
    } else {
        e.currentTarget.parentNode.classList.add("height-collapse");
        let arrow = e.currentTarget.getElementsByClassName("heading-arrow");
        arrow[0].classList.add("arrow-rotate");
    }
}

const versionHeadings = document.querySelectorAll("#cc-container .version-heading");

versionHeadings.forEach((heading) => heading.addEventListener("click", toggleAboutState));

function toggleAboutState(e) {
    if (e.currentTarget.nextElementSibling.classList.contains("expanded")) {
        e.currentTarget.nextElementSibling.classList.remove("expanded");
        let arrow = e.currentTarget.getElementsByClassName("heading-arrow");
        arrow[0].classList.remove("arrow-rotate");
    } else {
        e.currentTarget.nextElementSibling.classList.add("expanded");
        let arrow = e.currentTarget.getElementsByClassName("heading-arrow");
        arrow[0].classList.add("arrow-rotate");
    }
}

// Back To Top Button

const backToTopButton = document.querySelector(".back-to-top");

function backToTop() {
    if (document.body.scrollTop || document.documentElement.scrollTop > 200) {
        backToTopButton.classList.add("show-button");
    } else {
        backToTopButton.classList.remove("show-button");
    }
}

if (backToTopButton) window.onscroll = () => backToTop();

// Dialog Behavior and Tracking

const dialogs = document.querySelectorAll(".dialog");
const dialogsCloseButtons = document.querySelectorAll(".dialog_close");
const dialogTriggers = document.querySelectorAll(".isDialog");

dialogs.forEach((dialog) => dialog.addEventListener("click", closeDialog));
dialogsCloseButtons.forEach((closeButton) => closeButton.addEventListener("click", setDialogClose));
dialogTriggers.forEach((dialogTrigger) => dialogTrigger.addEventListener("click", setDialogOpen));

function closeDialog(dialog) {
    if (this === dialog.target) {
        window.location.assign("#closeDialog");
        setDialogClose();
    }
}

function setDialogOpen() {
    settings.dialogStatus = 1;
    saveSettings();
}

function setDialogClose() {
    settings.dialogStatus = 0;
    saveSettings();
}

if (window.location.href.indexOf("#dialog") > -1) {
    setDialogOpen();
} else {
    setDialogClose();
}

// Export Copy Click Feedback

const clipboardButton = document.querySelector("#exportSaveCopy");

function clipboardText() {
    if(document.querySelector(".ClipboardCopy")) {
        document.querySelector(".ClipboardCopy").remove();
    }
    const copyAlert = document.createElement('div');
    copyAlert.innerHTML = "Copied to clipboard.";
    copyAlert.classList.add("ClipboardCopy");
    clipboardButton.insertAdjacentElement("afterend", copyAlert);
}

if (clipboardButton) {
    clipboardButton.addEventListener("click", clipboardText);
}

// Toast Positioning Setting

const toastSettings = document.querySelectorAll("#settings_notificationLocation .selection-container");

toastSettings.forEach((selection) => {
    selection.addEventListener("input", assignToastPosition);
    if(selection.querySelector("input").value === settings.toastPosition) {
        selection.querySelector("input").setAttribute("checked", "checked")
    };
});

function assignToastPosition(e) {
    const option = e.target.getAttribute("value");
    toastSettings.forEach((selection) => {
        selection.querySelector("input").removeAttribute("checked")
    });
    e.target.setAttribute("checked", "checked");
    toastPosition = option;
    $.toast().reset('all');
    settings.toastPosition = toastPosition;
    saveSettings();
}

// Theme Management Setting

const themeSettings = document.querySelectorAll("#settings_siteTheme .selection-container");

themeSettings.forEach((selection) => {
    selection.addEventListener("input", assignTheme);
    if(parseInt(selection.querySelector("input").value) === settings.theme) {
        selection.querySelector("input").setAttribute("checked", "checked")
    }
});

function assignTheme(e) {
    const option = e.target.getAttribute("value");
    themeSettings.forEach((selection) => {
        selection.querySelector("input").removeAttribute("checked")
    });
    e.target.setAttribute("checked", "checked");
    settings.theme = parseInt(option);
    saveSettings();
    checkTheme();
}

function checkTheme() {
    if (settings.theme === 1) {
        document.body.classList.add("lightmode");
    } else if (settings.theme === 0) {
        document.body.classList.remove("lightmode");
    }
}

checkTheme();

// Battle Log Length Setting

const battleLogSetBtn = document.querySelector('#battleLogSet');
const battleLogResetBtn = document.querySelector('#battleLogReset');
const battleLogLengthInput = document.querySelector('#battleLogValue');
const battleLogNotice = document.createElement('div');

if (battleLogSetBtn && battleLogResetBtn && battleLogLengthInput) {
    battleLogSetBtn.addEventListener("click", assignLogLength);
    battleLogResetBtn.addEventListener("click", resetLogLength);
    battleLogLengthInput.value = settings.battleLogLength;
}

function assignLogLength() {
    if (battleLogLengthInput.value < 5 || battleLogLengthInput.value > 100) {
        addLogNotice("Invalid Value!");
    } else {
        BattleLog.logLength = battleLogLengthInput.value;
        settings.battleLogLength = BattleLog.logLength;
        BattleLog.clear();
        addLogNotice("Updated!");
        saveSettings();
    }
}

function resetLogLength() {
    settings.battleLogLength = 15;
    BattleLog.logLength = settings.battleLogLength;
    battleLogLengthInput.value = settings.battleLogLength;
    BattleLog.clear();
    addLogNotice("Reset!");
    saveSettings();
}

function addLogNotice(notice) {
    if (document.querySelector('.battleLogNotice')) {
        document.querySelector('.battleLogNotice').remove();
    }
    battleLogNotice.classList.add('battleLogNotice');
    battleLogNotice.innerHTML = notice;
    battleLogResetBtn.insertAdjacentElement('afterend', battleLogNotice);
}

// Logo Easter Egg

const $gameLogo = $("#game-logo");
let logoNum = 0;

$gameLogo.click(() => {
    logoNum += 1;
    if (logoNum === 1) $gameLogo.css("background-image","url('images/site-logo.png')");
    else if (logoNum === 2) $gameLogo.css("background-image","url('images/site-logo2.png')");
    else {
        $gameLogo.css("background-image","url('images/site-logo.png')");
        logoNum = 0;
    }
});

// Event Functions

function disableEventLayers() {
    const layers = document.querySelectorAll(".bgContainer .layer");
    layers.forEach((layer)=> {
        layer.classList.remove("christmasEvent"); // Add event classes to be removed
    });
}

function enableChristmasLayers() {
    const layers = document.querySelectorAll(".bgContainer .layer");
    layers.forEach((layer)=> {
        layer.classList.add("christmasEvent");
    });
}

//

const $dbpanel = $("#db-panel");

function dbEnable() {
    $dbpanel.empty();
    const d = $("<button/>").addClass("dbClose").html("Close Debug");

    const d1 = $("<div/>").addClass("gmContainer");
        const d1a = $("<button/>").addClass("gmOption").html("Enable God Mode");
    d1.append(d1a);

    const d2 = $("<div/>").addClass("heroTestContainer");
        const d2a = $("<button/>").addClass("heroTestOption").html("Enable Hero Test");
    d2.append(d2a);

    const d3 = $("<div/>").addClass("addItemContainer");
        const d3a = $("<input/>").addClass("addItemName");
        const d3b = $("<input/>").addClass("addItemRarity");
    d3.append(d3a,d3b);

    const d4 = $("<div/>").addClass("gearHeroesContainer");
        const d4a = $("<input/>").addClass("gearHeroesLevel");
        const d4b = $("<input/>").addClass("gearHeroesRarity");
    d4.append(d4a,d4b);

    const d5 = $("<div/>").addClass("addGoldContainer");
    const d6 = $("<div/>").addClass("addMaterialContainer");
    const d7 = $("<div/>").addClass("adjustSpeedContainer");

    const addGoldInput = $("<input/>").addClass("addGoldInput");
    const addMaterialInput = $("<input/>").addClass("addMaterialInput");
    const adjustSpeedInput = $("<input/>").addClass("adjustSpeedInput");

    d5.append(addGoldInput);
    d6.append(addMaterialInput);
    d7.append(adjustSpeedInput);

    $dbpanel.append(d,d1,d2,d3,d4,d5,d6,d7);
    $dbpanel.css("display", "block");
}

$(document).on('click', '.gmOption', (e) => {
    devtools.godmode();
});

$(document).on('click', '.heroTestOption', (e) => {
    devtools.heroTest();
});

$(document).on('click', '.dbClose', (e) => {
    $dbpanel.css("display", "none");
});