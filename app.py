from fastapi import FastAPI, UploadFile, File
from fastapi.responses import Response
from agent import agent_response
import uvicorn
from Sarvam import sarvam_tts
from fastapi.middleware.cors import CORSMiddleware


app=FastAPI()
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])

@app.post("/croissant")
def croissant(query: str, model_name: str, thread_id: str, image: UploadFile | None = File(None)) -> str:
    image_bytes = image.file.read() if image is not None else None
    image_media_type = image.content_type if image is not None else Noneu
    return agent_response(query, image_bytes, image_media_type, model_name, thread_id)

@app.post("/speak")
def speak(text: str, language: str = "en-US") -> Response:
    return Response(content=sarvam_tts(text, language), media_type="audio/mpeg")

@app.get("/health")
def is_it_alive():
    return {"status":"alive"}

if __name__ == "__main__":
    uvicorn.run(app,host="0.0.0.0",port=8000)
