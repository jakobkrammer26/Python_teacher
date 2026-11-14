import random

geheim = random.randint(1, 20)
versuche = 0
hinweis = "Dein Tipp (1 bis 20): "
while True:
    tipp = int(input(hinweis))
    versuche += 1
    if tipp < geheim:
        hinweis = "Zu klein! Neuer Tipp: "
    elif tipp > geheim:
        hinweis = "Zu groß! Neuer Tipp: "
    else:
        input(f"Richtig nach {versuche} Versuchen! Enter zum Beenden ...")
        break
