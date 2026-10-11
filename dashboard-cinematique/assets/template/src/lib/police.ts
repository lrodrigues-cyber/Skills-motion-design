import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Inter (variable, licence OFL) servie localement : aucun accès réseau au rendu,
// et Remotion attend que la police soit chargée avant de capturer une image.
export const chargerPolice = () =>
  loadFont({
    family: "Inter",
    url: staticFile("fonts/InterVariable.woff2"),
    weight: "100 900",
    format: "woff2",
  });
