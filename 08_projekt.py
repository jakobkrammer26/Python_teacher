import random

geheim = random.randint(1, 20)
while True:
    tipp = int(input("Dein Tipp (1 bis 20): "))
    if tipp < geheim:
        print("Zu klein!")
    elif tipp > geheim:
        print("Zu groß!")
    else:
        print("Richtig!")
        break
