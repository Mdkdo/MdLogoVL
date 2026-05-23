(function(global) {
    const LOGO_COMMANDS_DATA = [
        // Mouvement
        { fr: "AV", en: "fd", arity: 1, js: "fd", cat: "mouvement" },
        { fr: "RE", en: "bk", arity: 1, js: "bk", cat: "mouvement" },
        { fr: "TD", en: "rt", arity: 1, js: "rt", cat: "mouvement" },
        { fr: "TG", en: "lt", arity: 1, js: "lt", cat: "mouvement" },
        { fr: "FPOS", en: "setxy", arity: 2, js: "setxy", cat: "mouvement" },
        { fr: "FCAP", en: "setheading", arity: 1, js: "setheading", cat: "mouvement" },
        { fr: "ORIGINE", en: "home", arity: 0, js: "home", cat: "mouvement" },
        { fr: "VE", en: "cs", arity: 0, js: "cs", cat: "mouvement" },
        { fr: "NETTOIE", en: "clean", arity: 0, js: "clean", cat: "mouvement" },
        { fr: "POSX", en: "posx", arity: 0, js: "posx", cat: "mouvement" },
        { fr: "POSY", en: "posy", arity: 0, js: "posy", cat: "mouvement" },
        { fr: "CAP", en: "heading", arity: 0, js: "heading", cat: "mouvement" },
        { fr: "DISTANCE", en: "distance", arity: 2, js: "distance", cat: "mouvement" },
        { fr: "TOWARDS", en: "towards", arity: 2, js: "towards", cat: "mouvement" },

        // Stylo & Couleurs
        { fr: "LC", en: "pu", arity: 0, js: "pu", cat: "stylo" },
        { fr: "BC", en: "pd", arity: 0, js: "pd", cat: "stylo" },
        { fr: "FCC", en: "setcolor", arity: 1, js: "setcolor", cat: "stylo" },
        { fr: "FTC", en: "setwidth", arity: 1, js: "setwidth", cat: "setwidth" },
        { fr: "FCB", en: "fillcolor", arity: 1, js: "fillcolor", cat: "stylo" },
        { fr: "FCA", en: "canvascolor", arity: 1, js: "canvascolor", cat: "stylo" },
        { fr: "REMPLIS", en: "fill", arity: 0, js: "fill", cat: "stylo" },
        { fr: "OPACITE", en: "opacity", arity: 1, js: "opacity", cat: "stylo" },
        { fr: "FLUIDE", en: "smooth", arity: 1, js: "smooth", cat: "stylo" },
        { fr: "RVB", en: "rgb", arity: 3, js: "rgb", cat: "stylo" },
        { fr: "DEGRADE", en: "gradient", arity: 2, js: "gradient", cat: "stylo" }, // On fix l'arité à 2 pour l'instant (type, colors array?) ou on gère le variable

        // Formes
        { fr: "CERCLE", en: "circle", arity: 1, js: "circle", cat: "formes" },
        { fr: "ARC", en: "arc", arity: 2, js: "arc", cat: "formes" },
        { fr: "RECTANGLE", en: "rectangle", arity: 2, js: "rectangle", cat: "formes" },
        { fr: "ELLIPSE", en: "ellipse", arity: 2, js: "ellipse", cat: "formes" },
        { fr: "POLYGONE", en: "polygon", arity: 2, js: "polygon", cat: "formes" },
        { fr: "ETOILE", en: "star", arity: 3, js: "star", cat: "formes" },
        { fr: "TAMPON", en: "stamp", arity: 0, js: "stamp", cat: "formes" },

        // Media
        { fr: "AFFICHEIMAGE", en: "showimage", arity: 1, js: "showimage", cat: "media" },
        { fr: "AFFICHEVIDEO", en: "showvideo", arity: 1, js: "showvideo", cat: "media" },
        { fr: "JOUE", en: "playsound", arity: 1, js: "playsound", cat: "media" },
        { fr: "ECRIS", en: "print", arity: 1, js: "print", cat: "media" },

        // Math
        { fr: "PI", en: "pi", arity: 0, js: "pi", cat: "math" },
        { fr: "RACINE", en: "sqrt", arity: 1, js: "sqrt", cat: "math" },
        { fr: "PUISSANCE", en: "pow", arity: 2, js: "pow", cat: "math" },
        { fr: "VALABS", en: "abs", arity: 1, js: "abs", cat: "math" },
        { fr: "EXP", en: "exp", arity: 1, js: "exp", cat: "math" },
        { fr: "LOGN", en: "ln", arity: 1, js: "ln", cat: "math" },
        { fr: "ENTIER", en: "integer", arity: 1, js: "integer", cat: "math" },
        { fr: "ARRONDI", en: "round", arity: 1, js: "round", cat: "math" },
        { fr: "PLAFOND", en: "ceil", arity: 1, js: "ceil", cat: "math" },
        { fr: "MIN", en: "min", arity: 2, js: "min", cat: "math" },
        { fr: "MAX", en: "max", arity: 2, js: "max", cat: "math" },
        { fr: "SIN", en: "sin", arity: 1, js: "sin", cat: "math" },
        { fr: "COS", en: "cos", arity: 1, js: "cos", cat: "math" },
        { fr: "TAN", en: "tan", arity: 1, js: "tan", cat: "math" },
        { fr: "ATAN", en: "atan", arity: 2, js: "atan", cat: "math" },
        { fr: "HASARD", en: "random", arity: 1, js: "random", cat: "math" },
        { fr: "MODULO", en: "mod", arity: 2, js: "mod", cat: "math" }
    ];

    global.LOGO_COMMANDS_DATA = LOGO_COMMANDS_DATA;
    global.LOGO_KEYWORDS = [ "DONNE", "DECLARE", "SI", "SINON", "TANTQUE", "REPETE", "CLASSE", "POUR", "FIN", "RENDS", "STOP", "CONTINUE", "CHOISIS", "CASE", "AUTRES", "LET", "VAR", "IF", "ELSE", "WHILE", "REPEAT", "CLASS", "SWITCH", "DEFAULT", "RETURN", "BREAK" ];

    // Generer LOGO_COMMANDS et arityMap
    global.LOGO_COMMANDS = LOGO_COMMANDS_DATA.map(c => c.fr);
    global.LOGO_ALL_CAPS = [...global.LOGO_KEYWORDS, ...global.LOGO_COMMANDS];

    global.arityMap = {};
    LOGO_COMMANDS_DATA.forEach(c => {
        global.arityMap[c.fr] = c.arity;
        global.arityMap[c.en.toUpperCase()] = c.arity;
    });

})(window);
