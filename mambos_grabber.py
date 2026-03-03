import os
import json
import cv2
import numpy as np
from PIL import Image

RAW_DIR = "content/mambos_raw"
OUT_DIR = "content/mambos"
TARGET_SIZE = (256, 256)

os.makedirs(OUT_DIR, exist_ok=True)

metadata = {}

for filename in os.listdir(RAW_DIR):
    if not filename.lower().endswith((".png", ".jpg", ".jpeg")):
        continue

    name = os.path.splitext(filename)[0]
    path = os.path.join(RAW_DIR, filename)

    # Load and resize
    img = Image.open(path).convert("RGBA")
    img = img.resize(TARGET_SIZE, Image.LANCZOS)

    # Save standardized version
    out_path = os.path.join(OUT_DIR, f"{name}.png")
    img.save(out_path)

    # Convert to grayscale
    gray = img.convert("L")
    gray_np = np.array(gray)

    gray_path = os.path.join(OUT_DIR, f"{name}_gray.png")
    Image.fromarray(gray_np).save(gray_path)

    # Generate edge map using Canny
    edges = cv2.Canny(gray_np, threshold1=50, threshold2=150)
    edge_path = os.path.join(OUT_DIR, f"{name}_edge.png")
    Image.fromarray(edges).save(edge_path)

    # Compute metadata
    metadata[name] = {
        "mean_brightness": float(np.mean(gray_np)),
        "std_brightness": float(np.std(gray_np)),
        "edge_density": float(np.sum(edges > 0) / edges.size)
    }

    print(f"Processed: {name}")

# Save metadata
with open(os.path.join(OUT_DIR, "metadata.json"), "w") as f:
    json.dump(metadata, f, indent=2)

print("All Mambos processed.")