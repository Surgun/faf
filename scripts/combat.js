"use strict";

const CombatManager = {
    launchAttack(attacker, allies, enemies, dungeonid) {
        //clear buffs since it's for one round
        attacker.parry = false;
        attacker.armorBuff = false;
        //clear buffs since it's for one round
        if (attacker.stunned) {
            attacker.stunned = false;
            const battleMessage = `${attacker.name} is stunned and can't attack!`
            BattleLog.addEntry(dungeonid,battleMessage);
            return;
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
        else {
            const target = getTarget(enemies, attacker.target);
            this.normalAttack(attacker, target, dungeonid);
        }
        attacker.ap -= 100;
    },
    normalAttack(attacker, defender, dungeonid) {
        let battleMessage = "";
        const critical = this.rollStat(attacker.crit);
        let damage = attacker.getAdjPow();
        if (critical) {
            damage = Math.round(damage*attacker.critdmg);
            battleMessage = "Critical! ";
        }
        attacker.addAP();
        refreshAPBar(attacker);
        battleMessage += `${attacker.name} attacks ${defender.name} for ${damage} damage!`
        BattleLog.addEntry(dungeonid,battleMessage);
        this.takeDamage(damage, defender, attacker, dungeonid);
    },
    takeDamage(damage, defender, attacker, dungeonid) {
        if (defender.amplify) damage = Math.round(1.25 * damage);
        let battleMessage = "";
        if (defender.parry) {
            defender.parry = false;
            battleMessage = `${defender.name} parries the attack!`
            BattleLog.addEntry(dungeonid,battleMessage);
            const newdamage = Math.round(attacker.getAdjPow() * 1.2);
            return this.takeDamage(newdamage, attacker, defender, dungeonid);
        }
        const dodge = this.rollStat(defender.dodgeChance);
        if (dodge) {
            battleMessage = `${defender.name} dodges!`;
            BattleLog.addEntry(dungeonid,battleMessage);
            return;
        }
        if (defender.amplify) battleMessage = `${defender.name} takes an amplified ${Math.max(0,damage-defender.getArmor())} damage.`;
        else battleMessage = `${defender.name} takes ${Math.max(0,damage-defender.getArmor())} damage.`;
        if (defender.getArmor() > 0) battleMessage += ` (${defender.getArmor()} blocked)`;
        damage = Math.max(0,damage - defender.getArmor())
        defender.hp = Math.max(defender.hp - damage, 0);
        if (defender.hp === 0) battleMessage += ` ${defender.name} died!`;
        refreshHPBar(defender);
        BattleLog.addEntry(dungeonid,battleMessage);
        defender.ignoredArmor = false;
    },
    rollStat(stat) {
        return stat > Math.floor(Math.random()*100) + 1
    },
}


function getTarget(party,type) {
    party = party.filter(h => h.alive());
    if (type === "first") return party[0]
    else if (type === "reverse") return party.reverse()[0];
    else if (type === "random") return party[Math.floor(Math.random()*party.length)];
    else if (type === "highhp") return party.sort((a,b) => {return b.hp - a.hp})[0];
    else if (type === "lowhp") return party.sort((a,b) => {return a.hp - b.hp})[0];
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
        $drLog.empty();
        this.log.forEach(m=> {
            const d = $("<div/>").addClass("battleLog").html(m);
            $drLog.prepend(d);
        });
    },
    clear() {
        this.log = [];
        $drLog.empty();
    },
    mobDrops(name,drops) {
        if (drops.length === 0) return;
        const dropnames = drops.map(m=>ResourceManager.idToMaterial(m).name);
        this.addEntry(`${name} dropped ${dropnames.join(", ")}`)
    },
}
