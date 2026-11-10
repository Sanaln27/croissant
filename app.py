from fastapi import FastAPI
from agent import agent_response
import uvicorn
from fastapi.middleware.cors import CORSMiddleware


app=FastAPI()
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])

@app.post("/croissant")
def shut_the_hell_up(query:str)->str:
    return agent_response(query)


if __name__ == "__main__":
    uvicorn.run(app,host="0.0.0.0",port=8000) 