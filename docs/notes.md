# OggDude Data Examples
They can be found here:
C:\Users\jesse\AppData\Local\Apps\2.0\05EY5Q21.T1C\VZN0L5W9.TP2\swch..tion_0000000000000000_0002.0003_1f936c6a3e7c2001\Data

# SWFFG Mapping Ideas
```
// Pokemon Items
GENEMON TYPE -> SWFFG GEAR // use gear and a 'TYPE' subtype to display
GENEMON ABILITY -> SWFFG GEAR // use gear and an 'ABILITY' subtype to display
GENEMON HELDITEM -> SWFFG GEAR // use gear and a 'HELDITEM' subtype to display
GENEMON NATURE -> SWFFG GEAR // use gear and a 'NATURE' subtype to display; alternatively we can maybe just use species for this
GENEMON SPECIES -> SWFFG SPECIALIZATION
GENEMON MOVE -> SWFFG WEAPON
GENEMON MOVEPROPERTY -> SWFFG ITEMMODIFIER
GENEMON CONDITION -> SWFFG ARMOR // is this the same as STATUS?
GENEMON STATUS -> SWFFG ??? // unused
GENEMON CATCHRATE -> SWFFG ??? // do we need this?

// Trainer Items
GENEMON PATH -> SWFFG FORCEPOWER
GENEMON SPECIALIZATION -> SWFFG SPECIALIZATION
GENEMON REGION -> SWFFG SPECIES
GENEMON ITEM -> SWFFG GEAR

// Shared Items
GENEMON TALENT -> SWFFG TALENT
```

# Custom Handlebars Functions
I can use these on the Pokemon/Trainer sheet at the bottom after the form to manage specific things.
https://handlebarsjs.com/examples/helper-simple.html

I just need to put these in the Genemon plug-in init.

# Importer Notes
I think all Genemon items should have a "Type" which we will consider a "subtype" of the 
actual SWFFG types which we can key off of for placing in custom character sheets.

# Importer Images
So images are wierd and need to be placed into a specific folder path. The "OggDudeDataFull" folder gives examples.

# Weapon Importer
Weapons require the skill list to be in the import directory otherwise it will crash and burn.

# Pokemon Importer
Character portraits are imported as base64 strings. I'll need to have the images somewhere to convert to base64 and then let the script upload to the game world.

They also seem to be savable as ```character.img = `${serverPath}/${characterData.Character.Key}.png`;```

There is a bug with weapons that the qualities appear but break. Players will need to re-add attacks to Pokemon.

Pokemon should have blank Specialization, Species, and Career items (unless Morgan wants it in).
* Checkout the Pikachu - Pokemon.xml file for details.

# Pokemon Importer Notes from 7/31 Discussion
Potentially shift Abilities to SWFFG Talents.

Conversions
* Region is Species
* Path is Forcepower
* Specialization is Specialization
* Catch Rate is just text in Pokemon biography.
* Don't worry about Status and Conditions.

Pokemon will import with Species, Gear(abilities and held items), Bio, and Picture.
* Each Pokemon will be a Species.
* Pokemon Pre-import Setup
  + Each Pokemon needs a Species associated with them.
  + Each Pokemon needs their image converted to a blob.
* Players will assign attacks from the Specializations.
* Morgan will make Specializations.
  + We don't need to worry about trainer specializations for now either.
* Need to convert all the images to blobs, maybe save them in a JSON mapping.

# Species Importer
No clue what the OptionChoices are. They seem to just be added onto the description.

# Pokemon Importer Notes from 8/27
* Looks like Soak, Ranged Defense, and Melee Defense can't be imported via the Species.

# Weapon/Quality Importer
Cannot import Roll/Dice mods by default but if I add this to a quality we can import it:
```
<BaseMods>
    <Mod>
      <DieModifiers>
        <DieModifier>
            <BoostCount>1</BoostCount>
        </DieModifier>
      </DieModifiers>
    </Mod>
</BaseMods>
```

I can try to adjust import-helpers.js line 2302 with this:
```
switch (m) {
  case "BoostCount":
    modtype = "Roll Modifiers";
    type = "Add Boost";
    break;
  case "SetbackCount":
    modtype = "Roll Modifiers";
    type = "Add Setback";
    break;
}
```

I can also test with the v11 plugin to see if that works just fine as well.
