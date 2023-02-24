export default class TemplateHelpers {
    static async preload() {
        const templatePaths = [
            "modules/genemon/templates/pokemon-skills.html",
        ];

        return loadTemplates(templatePaths);
    }
}
