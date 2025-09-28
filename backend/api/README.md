Env Simulation API

Run locally:

1. Create a virtualenv and install requirements:

   python -m venv .venv; .\.venv\Scripts\activate; pip install -r requirements.txt

2. Start server:

   uvicorn main:app --reload --port 8000

Endpoints:
- GET / -> health
- GET /calculate/items -> list emissions items
- POST /calculate/user -> calculate user emissions (body: CalculateRequest)
- POST /recognize/image -> placeholder for image recognition
- GET /recognize/brainstorm/{item_id} -> stub for agent brainstorming
- GET /agent/person/{person_id} -> synthetic person environmental effect
