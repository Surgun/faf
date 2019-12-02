class Tooltip {
  constructor(props) {
    Object.assign(this, props)
    this.isFont = this.icon ? this.icon.substring(0,2) === "<i" : false;
  }
  tooltipValue(id,prop) {
    if (this.type === "buff") return BuffManager.idToBuff(id)[prop];
    else if (this.type === "dungeon") return DungeonManager.dungeonByID(id)[prop];
    else if (this.type === "event") return EventManager.idToEventDB(id)[prop];
    else if (this.type === "guild") return GuildManager.idToGuild(id)[prop];
    else if (this.type === "hero") return HeroManager.idToHero(id)[prop];
    else if (this.type === "resource") return ResourceManager.idToMaterial(id)[prop];
    else if (this.type === "mob") return MobManager.idToMob(id)[prop];
    else if (this.type === "perk") return Shop.idToPerk(id)[prop];
    else if (this.type === "recipe") return recipeList.idToItem(id)[prop];
    else if (this.type === "skill") return SkillManager.idToSkill(id)[prop];
    else if (this.type === "worker") return WorkerManager.workerByID(id)[prop];
  }
}

TooltipManager = {
  tooltips: [],
  addTooltip(tooltip) {
    this.tooltips.push(tooltip)
  },
  findTooltip(id) {
    return this.tooltips.find(tooltip => tooltip.id === id)
  },
}

function generateTooltip(e) {
  const tooltipsContainer = $("#tooltips");
  const tooltipID = $(e.currentTarget).attr("data-tooltip");
  const tooltipEV = $(e.currentTarget).attr("data-tooltip-value");
  const tooltip = TooltipManager.findTooltip(tooltipID);
  const props = e.currentTarget.getBoundingClientRect();

  let positionBottom = ( window.innerHeight - props.top ) + 10;
  let positionLeft = props.left - 150;
  if (positionLeft < 0) positionLeft = 5;
  if (positionLeft > window.innerWidth) positionLeft - 5;
  const defaultStyles = {
    position: "absolute",
    bottom: positionBottom,
    left: positionLeft
  }
  
  if (tooltip === undefined) return;
  const generatedTooltip = $("<div/>").addClass("tooltip-container").css(defaultStyles).appendTo(tooltipsContainer);
  // If icon is image, render image
  if (tooltip.icon && !tooltip.isFont) $("<div/>").addClass("tooltip-icon").css({backgroundImage: `url(${tooltip.icon})`}).appendTo(generatedTooltip);
  // If icon is font, render font icon
  if (tooltip.icon && tooltip.isFont) $("<div/>").addClass("tooltip-icon").html(tooltip.icon).appendTo(generatedTooltip);

  const tooltipDetails = $("<div/>").addClass("tooltip-details").appendTo(generatedTooltip);
  
  if (tooltip.title) {
    const titleText = tooltipEV ? hashtagReplace(tooltip,tooltipEV,"title") : tooltip.title;
    $("<div/>").addClass("tooltip-title").html(titleText).appendTo(tooltipDetails);
  }
  if (tooltip.description) {
    const descText = tooltipEV ? hashtagReplace(tooltip,tooltipEV,"description") : tooltip.description;
    $("<div/>").addClass("tooltip-description").html(descText).appendTo(tooltipDetails);
  }

  return generatedTooltip;
}

function destroyTooltip(e) {
  $(".tooltip-container").addClass("destroyingTooltip");
  setTimeout(() => {
    $(".tooltip-container.destroyingTooltip").remove();
  }, 200)
}

$(document).on("mouseenter", ".tooltip", (e) => {
  e.stopPropagation();
  generateTooltip(e);
});

$(document).on("mouseleave", ".tooltip", (e) => {
  destroyTooltip(e);
});

function hashtagReplace(tooltip, id, type) {
  const html = (type === "title") ? tooltip.title : tooltip.description;
  if (!html.includes("#")) return html;
  const start = html.indexOf("#");
  const end = html.indexOf("#",start+1);
  const prop = html.substring(start+1,end);
  return html.substring(0,start)+tooltip.tooltipValue(id,prop)+html.substring(end+1);
}