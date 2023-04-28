// Mappings
//
// Pokemon
// * Species -> Specialization
// * Nature -> ???(dont think we ever decided this)
// * Abilities -> Ability
// * Held Item -> Gear
// * Catch rate -> ??? (dont think this was ever discussed)
// * Moves -> Weapon
// * Move Properties -> Item Modifier
// * Status -> Armor
// * Conditions/Buffs/Debuffs -> Item Modifier (should probably be in a separate folder since these go on the Armor)
// * Talents -> Talents
//
// Trainers
// * Path -> Force Power
// * Specialization -> Specialization
// * Region-> Species
// * Items -> Gear
// * Talents-> Talents
// * Pokemon List -> ???

module.exports = {
    // Pokemon
    "SPECIES": "specialization",
    "TYPE": "gear", // use gear and a 'TYPE' tag to display
    "ABILITY": "gear", // use gear and an 'ABILITY' tag to display
    "HELDITEM": "gear", // use gear and a 'HELDITEM' tag to display
    "NATURE": "gear", // use gear and a 'NATURE' tag to display; alternatively we can maybe just use species for this
    "MOVE": "weapon",
    "MOVEPROPERTY": "itemmodifier",
    "CONDITION": "armour", // is this the same as STATUS?
    "STATUS": "???", // unused
    "CATCHRATE": "gear", // Don't think we need a mapping, just make it a field somewhere
    // Trainer
    "PATH": "forcepower",
    "SPECIALIZATION": "specialization",
    "REGION": "species",
    "ITEM": "gear",
    // Shared
    "TALENT": "talent"
};
