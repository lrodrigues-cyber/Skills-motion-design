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
// Les flous (profondeur de champ) coûtent cher : 2 rendus en parallèle suffisent.
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY ?? 2));

// Navigateur déjà installé sur la machine (sinon Remotion télécharge le sien).
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
