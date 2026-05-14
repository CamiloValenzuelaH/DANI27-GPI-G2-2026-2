import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from main import app

if __name__ == "__main__":
    output_path = "openapi.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(app.openapi(), f, indent=2, ensure_ascii=False)
    print(f"OpenAPI spec exportada en {output_path}")