from fastapi import FastAPI
from agent import agent_response
import uvicorn
from fastapi.middleware.cors import CORSMiddleware


app=FastAPI()
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])

@app.post("/croissant")
def shut_the_hell_up(query:str,model_name:str,thread_id:str)->str:
    return agent_response(query,model_name,thread_id)

@app.get("./health")
def is_it_alive():
    return {"status":"alive"}

if __name__ == "__main__":
    uvicorn.run(app,host="0.0.0.0",port=8000) 