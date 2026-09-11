from pathlib import Path
from PIL import Image

out = Path("public/support-templates/apple-devices")
out.mkdir(parents=True, exist_ok=True)
hero = Image.open("/home/ubuntu/upload/search_images/JHVauucGgJtn.jpg")
store = Image.open("/home/ubuntu/upload/search_images/XjLknlrKf8mH.jpg")
vision = Image.open("/home/ubuntu/upload/search_images/yU9wZS4tNn04.jpg")
# Crop real products from Apple-sourced product compositions, retaining generous whitespace.
hero.crop((35, 45, 760, 730)).save(out / "iphone.jpg", quality=90, optimize=True)
hero.crop((775, 45, 1310, 365)).save(out / "watch.jpg", quality=90, optimize=True)
hero.crop((775, 365, 1310, 735)).save(out / "airpods.jpg", quality=90, optimize=True)
store.crop((10, 465, 390, 900)).save(out / "mac.jpg", quality=90, optimize=True)
store.crop((300, 445, 585, 770)).save(out / "ipad.jpg", quality=90, optimize=True)
vision.save(out / "vision-pro.jpg", quality=90, optimize=True)
print("prepared", ", ".join(p.name for p in sorted(out.iterdir())))
