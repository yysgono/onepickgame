import i18n from "./i18n";
import resources from "./locales/headerPersonal.json";
function register(){Object.entries(resources).forEach(([lang,messages])=>i18n.addResourceBundle(lang,"translation",messages,true,true));}
if(i18n.isInitialized) register(); else i18n.once("initialized",register);
