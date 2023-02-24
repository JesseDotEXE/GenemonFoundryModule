export function log(feature, message) {
    if (game.settings.get("starwarsffg", "enableDebug")) {
        console.log(`GENEMON | ${feature} | ${message}`);
    }
}
