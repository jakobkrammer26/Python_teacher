def groesste(zahlen):
    gross = zahlen[0]
    for z in zahlen:
        if z > gross:
            gross = z
    return gross
