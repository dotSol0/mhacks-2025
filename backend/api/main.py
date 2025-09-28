from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import calculate, recognize, agent

app = FastAPI(title="Env Simulation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calculate.router, prefix="/calculate", tags=["calculate"])
app.include_router(recognize.router, prefix="/recognize", tags=["recognize"])
app.include_router(agent.router, prefix="/agent", tags=["agent"])


@app.get("/")
def read_root():
    return {"message": "Environmental simulation API is running"}
