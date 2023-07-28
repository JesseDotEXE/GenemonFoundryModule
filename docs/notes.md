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

