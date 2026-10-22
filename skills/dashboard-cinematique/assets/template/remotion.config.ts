import { Config } from "@remotion/cli/config";

// Rendu « livraison » : JPEG 95 (évite le banding dans les dégradés sombres),
// H.264 CRF 16, couleurs BT.709 pour un rendu identique partout.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(16);
Config.setX264Preset("slow");
Config.setColorSpace("bt709");
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
// Rendu par la carte graphique. Les 3 couches du Plateau (flous, masques, plan 3D sur-échantillonné)
// sont dessinées par le GPU au lieu du processeur : ×18 mesuré (2,8 s → 0,15 s par image en 1080p,
// RTX 4060), images identiques à l'œil (PSNR 44–48 dB, écart moyen < 1,2/255 : anti-crénelage sub-pixel).
// Windows et macOS : "angle" (Direct3D / Metal). Linux : le rendu logiciel par défaut reste
// le choix sûr ; "angle-egl" si la machine a une carte graphique.
// Forcer un moteur : REMOTION_GL=swangle (logiciel, l'ancien rendu) | angle | angle-egl | vulkan.
const gl = process.env.REMOTION_GL ?? (process.platform === "linux" ? undefined : "angle");
if (gl) Config.setChromiumOpenGlRenderer(gl as Parameters<typeof Config.setChromiumOpenGlRenderer>[0]);
// Rendus en parallèle : au-delà de 4 la carte graphique est saturée (mesuré : 2, 4 et 6 au même temps,
// 8 plus lent). En rendu logiciel, 2 (les flous saturent la mémoire du navigateur).
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY ?? (gl && gl !== "swangle" ? 4 : 2)));

// Navigateur déjà installé sur la machine (sinon Remotion télécharge le sien).
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
