"use strict";

const CombatManager = {
    refreshLater : false,
    nextTurn(dungeon) {
        const attacker = dungeon.order.nextTurn();
        const allies = (attacker.unitType === "hero") ? this.party.heroes : this.mobs;
        const enemies = (attacker.unitType === "hero") ? this.mobs : this.party.heroes;
        const attack = attacker.getSkill();
        attack.execute(attacker,allies,enemies);
        dungeon.order.nextPosition();
    },
    launchAttack(attacker, allies, enemies, dungeonid) {
        //clear buffs since it's for one round
        attacker.parry = false;
        attacker.armorBuff = false;
        //clear buffs since it's for one round
        if (attacker.stunned) {
            attacker.stunned = false;
            const battleMessage = $("<span/>").addClass("logSpecial");
            battleMessage.append(`${logIcon("fas fa-bolt")} ${logName(attacker.name)} is stunned and can't attack!`);
            BattleLog.addEntry(dungeonid,battleMessage);
            return;
        }
        if (attacker.fear) {
            if (Math.random() <= 0.4) {
                const battleMessage = $("<span/>").addClass("logSpecial");
                battleMessage.append(`${logIcon("fas fa-scarecrow")} ${logName(attacker.name)} is feared and can't attack!`);
                BattleLog.addEntry(dungeonid,battleMessage);
                return;
            }
            else {
                attacker.fear = false;
                const battleMessage2 = $("<span/>").addClass("logSpecial");
                battleMessage2.append(`${logIcon("fas fa-sparkles")} ${logName(attacker.name)} snaps out of it!`);
                BattleLog.addEntry(dungeonid,battleMessage2);
            }
        }
        if (attacker.ap >= 100) this.specialAttack(attacker, allies, enemies, dungeonid);
        else {
            const target = getTarget(enemies, attacker.target);
            this.normalAttack(attacker, target, dungeonid);
        }
    },
    specialAttack(attacker,allies,enemies, dungeonid) {
        if (attacker.special === "parry") SAparry(attacker, dungeonid);
        else if (attacker.special === "armor") SAarmor(attacker, dungeonid);
        else if (attacker.special === "bloodlet") SAbloodLet(attacker, enemies, dungeonid);
        else if (attacker.special === "ravage") SAravage(attacker, enemies, dungeonid);
        else if (attacker.special === "blast") SAblast(attacker, enemies, dungeonid);
        else if (attacker.special === "meteor") SAmeteor(attacker, enemies, dungeonid);
        else if (attacker.special === "heal") SAheal(attacker, allies, dungeonid);
        else if (attacker.special === "massHeal") SAmassHeal(attacker, allies, dungeonid);
        else if (attacker.special === "sniper") SAsniper(attacker, enemies, dungeonid);
        else if (attacker.special === "double") SAdouble(attacker, enemies, dungeonid);
        else if (attacker.special === "amplify") SAamplify(attacker, enemies, dungeonid);
        else if (attacker.special === "stun") SAstun(attacker, enemies, dungeonid) //stun chance based off damage?
        else if (attacker.special === "second") SAsecond(attacker, enemies, dungeonid);
        else if (attacker.special === "birdflame") SAbirdflame(attacker, enemies, dungeonid);
        else if (attacker.special === "defenseStance") SAdefenseStance(attacker, dungeonid);
        else if (attacker.special === "summon") SAsummon(attacker, dungeonid);
        else if (attacker.special === "fear") SAfear(attacker,enemies, dungeonid);
        else if (attacker.special === "lowHPstun") SAlowmaxHPStun(attacker, enemies, dungeonid);
        else if (attacker.special === "defenseStancePlus") SAdefenseStancePlus(attacker, enemies, dungeonid);
        else if (attacker.special === "summon2") SAsummon2(attacker, enemies, dungeonid);
        else if (attacker.special === "fearap") SAfearap(attacker, enemies, dungeonid);
        else {
            const target = getTarget(enemies, attacker.target);
            this.normalAttack(attacker, target, dungeonid);
        }
        attacker.ap -= 100;
    },
    normalAttack(attacker, defender, dungeonid) {
        const battleMessage = $("<span/>");
        const critical = this.rollStat(attacker.getCrit());
        let damage = attacker.getAdjPow();
        if (critical) {
            damage = Math.round(damage*attacker.critdmg);
            battleMessage.addClass("logSpecial");
            battleMessage.append(`${logIcon("fas fa-claw-marks")} Critical! `);
        }
        attacker.addAP();
        if (!this.refreshLater) refreshAPBar(attacker);
        battleMessage.append(`${logName(attacker.name)} attacks ${logName(defender.name)} for ${logDmg(damage)}!`);
        BattleLog.addEntry(dungeonid,battleMessage);
        this.takeDamage(damage, defender, attacker, dungeonid);
    },
    takeDamage(damage, defender, attacker, dungeonid) {
        if (defender.amplify) damage = Math.round(1.25 * damage);
        const battleMessage = $("<span/>");
        if (defender.parry) {
            defender.parry = false;
            battleMessage.append(`${logName(defender.name)} parries the attack!`);
            BattleLog.addEntry(dungeonid,battleMessage);
            const newdamage = Math.round(attacker.getAdjPow() * 1.2);
            return this.takeDamage(newdamage, attacker, defender, dungeonid);
        }
        const dodge = this.rollStat(defender.dodgeChance);
        if (dodge) {
            battleMessage = `${logName(defender.name)} dodges!`;
            BattleLog.addEntry(dungeonid,battleMessage);
            return;
        }
        const reducedDmg = Math.max(0,damage-defender.getArmor());
        if (defender.amplify) battleMessage.append(`${logName(defender.name)} takes an amplified ${logDmg(reducedDmg)}!`);
        else battleMessage.append(`${logName(defender.name)} takes ${logDmg(reducedDmg)}!`);
        if (defender.getArmor() > 0) battleMessage.append(` ${logBlock(defender.getArmor())}`);
        damage = Math.max(0,damage - defender.getArmor())
        defender.hp = Math.max(defender.hp - damage, 0);
        if (defender.hp === 0) battleMessage.append(` ${logDead(defender.name)}!`);
        if (!this.refreshLater) refreshHPBar(defender);
        BattleLog.addEntry(dungeonid,battleMessage);
        defender.ignoredArmor = false;
    },
    rollStat(stat) {
        return stat > Math.floor(Math.random()*100) + 1
    },
}

function logName(name) {
    return $("<span/>").addClass("logName").html(name).prop('outerHTML');
}

function logDmg(amt) {
    return $("<span/>").addClass("logDamage").html(`${logIcon("fas fa-sword")} ${amt} damage`).prop('outerHTML');
}

function logHeal(amt) {
    return $("<span/>").addClass("logHeal").html(`${logIcon("fas fa-heart")} ${amt} HP`).prop('outerHTML');
}

function logIcon(name) {
    return $("<i/>").addClass(name).prop('outerHTML');
}

function logBlock(amt) {
    return $("<span/>").addClass("logBlocked").html(`(${logIcon("fas fa-shield-alt")} ${amt} blocked)`).prop('outerHTML');
}

function logDead(name) {
    return $("<span/>").addClass("logDied").html(`${logName(name)} ${logIcon("fas fa-skull-crossbones")} died`).prop('outerHTML');
}


function getTarget(party,type) {
    party = party.filter(h => h.alive());
    if (type === "first") return party[0]
    if (type === "second") {
        if (party.length === 1) return party[0];
        return party[1];
    }
    if (type === "third") {
        if (party.length === 1) return party[0];
        if (party.length === 2) return party[2];
        return party[3]
    }
    if (type === "last") return party[party.length-1];
    else if (type === "reverse") return party.reverse()[0];
    else if (type === "random") {
        return party[Math.floor(Math.random()*party.length)];
    }
    else if (type === "highhp") return party.sort((a,b) => {return b.hp - a.hp})[0];
    else if (type === "lowhp") return party.sort((a,b) => {return a.hp - b.hp})[0];
    else if (type === "lowmaxHP") return party.sort((a,b) => {return b.maxHP() - a.maxHP()})[0];
    else if (type === "lowMissingHp") return party.sort((a,b) => {return b.missingHP() - a.missingHP()})[0];
}

const $drLog = $("#drLog");

const BattleLog = {
    log : [],
    logLength : settings.battleLogLength,
    addEntry(dungeonid,m) {
        if (dungeonid !== DungeonManager.dungeonView) return;
        if (this.log.length >= this.logLength) {
            this.log.shift();
        }
        this.log.push(m);
        if (CombatManager.refreshLater) return;
        this.refresh();
    },
    clear() {
        this.log = [];
        $drLog.empty();
    },
    refresh() {
        $drLog.empty();
        this.log.forEach(m=> {
            const d = $("<div/>").addClass("battleLog").html(m);
            $drLog.prepend(d);
        });
    },
    mobDrops(name,drops) {
        if (drops.length === 0) return;
        const dropnames = drops.map(m=>ResourceManager.idToMaterial(m).name);
        this.addEntry(`${name} dropped ${dropnames.join(", ")}`)
    },
}
