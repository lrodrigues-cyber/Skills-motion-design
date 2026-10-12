#!/usr/bin/env python3
"""Contrôle du son par une « oreille » automatique (facultatif, Python 3.9+).

    python3 scripts/ecoute.py public/audio/bande-son.wav
    python3 scripts/ecoute.py out/film.mp4 --jusqua 15

Le modèle YAMNet (Google, AudioSet, 521 classes de sons) écoute la piste et répond à deux questions :
  1. Est-ce que ça sonne comme les vidéos de référence du style ? On compare l'empreinte de la
     piste à celle des 5 références (scripts/empreinte-son.json, empreintes seules : aucun son copié).
     Repères : les références entre elles 0,65–0,85 ; la bande-son d'exemple 0,87 ; l'ancienne
     bande-son rejetée 0,69.
  2. Est-ce qu'un son est lu de travers ? Harpe, clavecin, musique de jeu vidéo, « ding », musique
     pour enfants : c'est ce qui faisait sonner les premières versions « cheap ».

Installation (une fois, ~600 Mo) : pip install tensorflow-cpu tf_keras soundfile scipy
Le modèle (15 Mo) est téléchargé au premier lancement dans ~/.cache/dashboard-cinematique/yamnet.
Code de sortie 1 si la piste ne passe pas.
"""
import argparse, csv, json, os, subprocess, sys, tempfile, urllib.request

SOURCES = {
    "yamnet.h5": "https://storage.googleapis.com/audioset/yamnet.h5",
    "yamnet.py": "https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/yamnet.py",
    "params.py": "https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/params.py",
    "features.py": "https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/features.py",
    "yamnet_class_map.csv": "https://raw.githubusercontent.com/tensorflow/models/master/research/audioset/yamnet/yamnet_class_map.csv",
}
MAUVAIS = ["Harp", "Harpsichord", "Pizzicato", "Video game music", "Music for children", "Ding", "Jingle, tinkle",
            "Doorbell", "Glockenspiel", "Music box", "Bell", "Chime", "Plucked string instrument"]
FILM = ["Soundtrack music", "Ambient music", "Electronic music", "Scary music", "Theme music", "Synthesizer",
        "Electronica", "Techno", "Trance music", "New-age music", "Background music"]
EFFETS = ["Whoosh, swoosh, swish", "Arrow", "Explosion", "Burst, pop", "Rumble", "Vehicle", "Timpani",
          "Heart sounds, heartbeat", "Sonar", "Sound effect", "Throbbing"]


def modele():
    cache = os.path.join(os.path.expanduser("~"), ".cache", "dashboard-cinematique", "yamnet")
    os.makedirs(cache, exist_ok=True)
    for nom, url in SOURCES.items():
        f = os.path.join(cache, nom)
        if not os.path.exists(f):
            print(f"téléchargement de {nom}…", file=sys.stderr)
            urllib.request.urlretrieve(url, f)
    sys.path.insert(0, cache)
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
    import params as yparams, yamnet as ymodel  # noqa: E402
    net = ymodel.yamnet_frames_model(yparams.Params())
    net.load_weights(os.path.join(cache, "yamnet.h5"))
    classes = [r["display_name"] for r in csv.DictReader(open(os.path.join(cache, "yamnet_class_map.csv")))]
    return net, classes


def charge(chemin, debut=0.0, fin=None):
    import numpy as np, soundfile as sf
    from scipy.signal import resample_poly
    if not chemin.lower().endswith((".wav", ".flac", ".ogg")):
        tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", chemin, "-vn", "-ac", "1", "-ar", "16000", tmp], check=True)
        chemin = tmp
    y, sr = sf.read(chemin, always_2d=True)
    y = y.mean(1)
    if sr != 16000:
        y = resample_poly(y, 16000, sr)
    a = int(debut * 16000)
    b = len(y) if fin is None else int(fin * 16000)
    return y[a:b].astype(np.float32), len(y) / 16000


def main():
    import numpy as np
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("fichier")
    ap.add_argument("--jusqua", type=float, default=14.5, help="fin de la partie musicale à comparer (s), 14,5 par défaut")
    ap.add_argument("--seuil", type=float, default=0.80, help="similarité minimale aux références (0,80 par défaut)")
    o = ap.parse_args()

    net, classes = modele()
    ici = os.path.dirname(os.path.abspath(__file__))
    refs = json.load(open(os.path.join(ici, "empreinte-son.json")))["references"]
    cos = lambda a, b: float(np.dot(a, b) / np.linalg.norm(a) / np.linalg.norm(b))

    y, duree = charge(o.fichier, 0, o.jusqua)
    scores, emb, _ = net(y)
    scores, emb = scores.numpy(), emb.numpy()
    centre = np.mean([np.array(v) for v in refs.values()], 0)
    sim = cos(emb.mean(0), centre)
    par_ref = {k: cos(emb.mean(0), np.array(v)) for k, v in refs.items()}
    moy = scores.mean(0)
    film = sum(moy[classes.index(c)] for c in FILM if c in classes)

    print(f"Similarité aux références : {sim:.3f}  ({' · '.join(f'{k} {v:.2f}' for k, v in par_ref.items())})")
    print(f"Couleur « musique de film / électro » : {film:.2f}")
    print("Ce que le modèle entend :", ", ".join(f"{classes[i]} {moy[i]:.2f}" for i in np.argsort(moy)[::-1][1:7]))

    problemes = []
    if sim < o.seuil:
        problemes.append(f"similarité {sim:.3f} < {o.seuil:.2f} : la piste ne sonne pas comme le style (vérifier la palette : nappe sombre, basse pulsée, arpège sombre)")
    yy, _ = charge(o.fichier)
    sc_tout, _, _ = net(yy)
    sc_tout = sc_tout.numpy()
    for k in range(sc_tout.shape[0]):
        for c in MAUVAIS:
            if c in classes and sc_tout[k][classes.index(c)] > 0.12:
                problemes.append(f"vers {k * 0.48:.1f} s : son lu comme « {c} » ({sc_tout[k][classes.index(c)]:.2f}) — trop pincé, trop cloche ou trop aigu")
    if duree > o.jusqua + 1:
        fin = sc_tout[int(o.jusqua / 0.48):].max(0)
        vus = [f"{c.split(',')[0]} {fin[classes.index(c)]:.2f}" for c in EFFETS if c in classes and fin[classes.index(c)] > 0.08]
        print("Révélation :", ", ".join(vus) if vus else "aucun effet de cinéma reconnu (whoosh, explosion, grondement…)")

    if problemes:
        print(f"{len(problemes)} problème(s) :\n  - " + "\n  - ".join(dict.fromkeys(problemes)))
        sys.exit(1)
    print("Le son colle au style.")


if __name__ == "__main__":
    main()
