def altersklasse(alter):
    if alter < 12:
        return "Kind"
    elif alter < 18:
        return "Jugendlicher"
    else:
        return "Erwachsener"
